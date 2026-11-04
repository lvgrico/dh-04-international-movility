import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { processOutbox } from '../src/application/outbox-worker';
import { retryPendingEligibility } from '../src/application/eligibility-service';
import { startTestApp, TEST_APP_URL, type TestApp } from './helpers';

let t: TestApp;
before(async () => { t = await startTestApp(); });
after(async () => { await t.close(); });

describe('resilience of integrations (QS-03, QS-07, BR-11)', () => {
  it('T-INT-01 SIS down at submission: the submission persists as PENDING_VALIDATION, then the worker validates it once the SIS is back', async () => {
    const opp = await t.publish();
    const s = await t.login('stu-0001');
    const d = await t.call(s, 'POST', '/api/v1/applications', { opportunityId: opp, statement: 'Applying while the SIS is down.' });
    const id = d.body.applicationId;

    t.sis.mode = 'down';
    const sub = await t.call(s, 'POST', `/api/v1/applications/${id}/submissions`);
    assert.equal(sub.status, 200, 'the student is not blocked by the outage');
    assert.equal(sub.body.application.workflowState, 'SUBMITTED');
    assert.equal(sub.body.eligibility.outcome, 'PENDING_VALIDATION');
    assert.match(sub.body.nextAction, /Waiting for automatic eligibility validation/);

    // the adviser cannot advance a pending application
    const early = await t.call(await t.login('adv-01'), 'POST', `/api/v1/applications/${id}/triage`, { decision: 'ACCEPT' });
    assert.equal(early.body.code, 'ELIGIBILITY_NOT_CONFIRMED');

    t.sis.mode = 'ok';
    const resolved = await retryPendingEligibility(t.deps, { force: true });
    assert.ok(resolved >= 1);
    const st = await t.call(s, 'GET', `/api/v1/applications/${id}/status`);
    assert.equal(st.body.eligibility.outcome, 'ELIGIBLE');
    assert.equal((await t.call(await t.login('adv-01'), 'POST', `/api/v1/applications/${id}/triage`, { decision: 'ACCEPT' })).status, 200);
  });

  it('T-INT-02 a malformed SIS payload is treated as unavailable, never as data', async () => {
    const opp = await t.publish();
    const s = await t.login('stu-0002');
    const d = await t.call(s, 'POST', '/api/v1/applications', { opportunityId: opp, statement: 'Applying with a broken SIS payload.' });
    t.sis.mode = 'malformed';
    const sub = await t.call(s, 'POST', `/api/v1/applications/${d.body.applicationId}/submissions`);
    t.sis.mode = 'ok';
    assert.equal(sub.body.eligibility.outcome, 'PENDING_VALIDATION');
  });

  it('T-INT-03 the retry is idempotent: running the worker twice does not duplicate the result', async () => {
    const before = await t.admin.query(`SELECT count(*)::int AS n FROM audit_event WHERE action='eligibility.checked'`);
    await retryPendingEligibility(t.deps, { force: true });
    await retryPendingEligibility(t.deps, { force: true });
    const after = await t.admin.query(`SELECT count(*)::int AS n FROM audit_event WHERE action='eligibility.checked'`);
    assert.equal(after.rows[0].n - before.rows[0].n, 1, 'only the previously malformed one is resolved, exactly once');
  });

  it('T-NOT-01 notification gateway down: the nomination stays committed; delivery goes to RETRY_WAIT and succeeds later', async () => {
    const opp = await t.publish();
    const app = await t.readyApplication('stu-0001', opp);
    await processOutbox(t.deps, { force: true });      // drain earlier events
    t.notifier.failing = true;
    const nom = await t.call(await t.login('coord-01'), 'POST', `/api/v1/applications/${app}/nominations`, {});
    assert.equal(nom.status, 201, 'business result is independent of the gateway');

    const r = await processOutbox(t.deps, { force: true });
    assert.ok(r.failed >= 1);
    const waiting = await t.admin.query(`SELECT count(*)::int AS n FROM outbox_event WHERE state='RETRY_WAIT' AND event_type='NominationCreated'`);
    assert.equal(waiting.rows[0].n, 1);
    const st = await t.call(await t.login('stu-0001'), 'GET', `/api/v1/applications/${app}/status`);
    assert.equal(st.body.nomination.status, 'AWAITING_HOST_DECISION');

    t.notifier.failing = false;
    const r2 = await processOutbox(t.deps, { force: true });
    assert.ok(r2.delivered >= 1);
    assert.ok(t.notifier.sent.some((m) => m.template === 'nominated-not-admitted'));
    const left = await t.admin.query(`SELECT count(*)::int AS n FROM outbox_event WHERE state IN ('PENDING','RETRY_WAIT')`);
    assert.equal(left.rows[0].n, 0);
  });
});

describe('audit integrity and least privilege (QS-04, E2-ADR-006)', () => {
  it('T-AUD-01 the application DB role cannot UPDATE or DELETE audit events, nor alter requirement versions', async () => {
    const c = new pg.Client({ connectionString: TEST_APP_URL });
    await c.connect();
    try {
      await assert.rejects(c.query(`UPDATE audit_event SET action='tampered'`), /permission denied/);
      await assert.rejects(c.query('DELETE FROM audit_event'), /permission denied/);
      await assert.rejects(c.query('TRUNCATE audit_event'), /permission denied/);
      await assert.rejects(c.query('UPDATE requirement_version SET places=999'), /permission denied/);
      const ok = await c.query('SELECT count(*)::int AS n FROM audit_event');
      assert.ok(ok.rows[0].n > 0, 'but it can read and append');
    } finally { await c.end(); }
  });

  it('T-AUD-02 every state-changing command left an audit entry with actor, correlation id and before/after', async () => {
    const rows = await t.admin.query(`SELECT action, actor_subject, correlation_id, before_after FROM audit_event WHERE action IN ('nomination.created','application.submitted')`);
    assert.ok(rows.rowCount! > 0);
    for (const r of rows.rows) { assert.ok(r.actor_subject && r.correlation_id && r.before_after, `incomplete audit row ${r.action}`); }
  });

  it('T-DATA-01 raw GPA and credits are never persisted by IMAMS (BR-06, CL-017)', async () => {
    const dump = await t.admin.query(`SELECT criteria_results::text AS c FROM eligibility_check WHERE criteria_results IS NOT NULL`);
    for (const r of dump.rows) assert.doesNotMatch(r.c, /\d/, 'criteria hold PASS/FAIL only, never numbers');
    const cols = await t.admin.query(`SELECT column_name FROM information_schema.columns WHERE table_name IN ('application','eligibility_check') AND column_name ~* '(gpa|credit)'`);
    assert.equal(cols.rowCount, 0, 'no GPA/credit columns exist outside requirement thresholds');
  });
});
