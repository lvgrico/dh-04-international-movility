import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, type TestApp } from './helpers';

let t: TestApp;
before(async () => { t = await startTestApp(); });
after(async () => { await t.close(); });

describe('end-to-end use case: apply -> validate -> review -> nominate -> host decision -> accept', () => {
  it('T-LIFE-01 a valid application completes the whole flow, with distinct statuses and a full audit trail', async () => {
    const opp = await t.publish({ places: 1 });
    const stu = await t.login('stu-0001');

    const draft = await t.call(stu, 'POST', '/api/v1/applications', { opportunityId: opp, statement: 'Exchange semester to study robotics abroad.' });
    assert.equal(draft.status, 201);
    const id = draft.body.applicationId;

    const sub = await t.call(stu, 'POST', `/api/v1/applications/${id}/submissions`);
    assert.equal(sub.status, 200);
    assert.equal(sub.body.application.workflowState, 'SUBMITTED');
    assert.equal(sub.body.eligibility.outcome, 'ELIGIBLE');
    assert.equal(sub.body.application.pinnedVersionNo, 1, 'eligibility is evaluated against the pinned requirement version');

    assert.equal((await t.call(await t.login('adv-01'), 'POST', `/api/v1/applications/${id}/triage`, { decision: 'ACCEPT' })).status, 200);
    assert.equal((await t.call(await t.login('acad-eng'), 'POST', `/api/v1/applications/${id}/academic-decisions`, { decision: 'APPROVED' })).status, 200);

    const coord = await t.login('coord-01');
    const nom = await t.call(coord, 'POST', `/api/v1/applications/${id}/nominations`, {});
    assert.equal(nom.status, 201);
    assert.equal(nom.body.status, 'AWAITING_HOST_DECISION');

    // BR-03: nominated is NOT admitted
    let st = await t.call(stu, 'GET', `/api/v1/applications/${id}/status`);
    assert.match(st.body.nomination.label, /not yet admitted/);
    assert.equal(st.body.hostDecision, null);
    assert.equal(st.body.acceptance, null);

    assert.equal((await t.call(coord, 'POST', `/api/v1/nominations/${nom.body.nominationId}/host-decisions`, { outcome: 'ADMITTED' })).status, 201);
    st = await t.call(stu, 'GET', `/api/v1/applications/${id}/status`);
    assert.equal(st.body.hostDecision.outcome, 'ADMITTED');
    assert.equal(st.body.acceptance, null, 'admitted is not yet accepted');

    const acc = await t.call(stu, 'POST', `/api/v1/nominations/${nom.body.nominationId}/acceptances`);
    assert.equal(acc.status, 200);
    st = await t.call(stu, 'GET', `/api/v1/applications/${id}/status`);
    assert.equal(st.body.nomination.status, 'ACCEPTED');
    assert.equal(st.body.acceptance.status, 'ACTIVE');

    const audit = await t.call(await t.login('it-01'), 'GET', `/api/v1/applications/${id}/audit`);
    const actions = audit.body.map((a: any) => a.action);
    for (const expected of ['application.draft_created', 'application.submitted', 'eligibility.checked', 'triage.accept',
      'academic.approved', 'nomination.created', 'host_decision.admitted', 'offer.accepted']) {
      assert.ok(actions.includes(expected), `audit is missing ${expected}`);
    }
    assert.ok(audit.body.every((a: any) => a.actor && a.occurredAt && a.correlationId), 'every entry has actor, time, correlation id');
  });

  it('T-LIFE-02 an ineligible student is flagged and cannot advance past triage (CL-015)', async () => {
    const opp = await t.publish();
    const stu = await t.login('stu-0004'); // GPA 2.4 in the simulated SIS
    const d = await t.call(stu, 'POST', '/api/v1/applications', { opportunityId: opp, statement: 'I would like to join the exchange program.' });
    const sub = await t.call(stu, 'POST', `/api/v1/applications/${d.body.applicationId}/submissions`);
    assert.equal(sub.body.eligibility.outcome, 'INELIGIBLE');
    assert.equal(sub.body.eligibility.criteria.minGpa, 'FAIL');
    assert.ok(!JSON.stringify(sub.body).includes('2.4'), 'raw GPA is never exposed');
    const tr = await t.call(await t.login('adv-01'), 'POST', `/api/v1/applications/${d.body.applicationId}/triage`, { decision: 'ACCEPT' });
    assert.equal(tr.status, 409);
    assert.equal(tr.body.code, 'ELIGIBILITY_NOT_CONFIRMED');
  });

  it('T-LIFE-03 invalid submissions are refused: short statement (422) and closed period (409)', async () => {
    const stu = await t.login('stu-0001');
    const open = await t.publish();
    const d = await t.call(stu, 'POST', '/api/v1/applications', { opportunityId: open, statement: 'short' });
    const bad = await t.call(stu, 'POST', `/api/v1/applications/${d.body.applicationId}/submissions`);
    assert.equal(bad.status, 422);
    assert.equal(bad.body.code, 'VALIDATION_FAILED');

    const closed = await t.publish({ opensOn: t.day(-20), closesOn: t.day(-5) });
    const d2 = await t.call(stu, 'POST', '/api/v1/applications', { opportunityId: closed, statement: 'A perfectly valid statement.' });
    const late = await t.call(stu, 'POST', `/api/v1/applications/${d2.body.applicationId}/submissions`);
    assert.equal(late.status, 409);
    assert.equal(late.body.code, 'PERIOD_CLOSED');
  });

  it('T-LIFE-04 skipping steps is refused: an unapproved application cannot be nominated (BR-02)', async () => {
    const opp = await t.publish();
    const stu = await t.login('stu-0002');
    const d = await t.call(stu, 'POST', '/api/v1/applications', { opportunityId: opp, statement: 'Submitting but not yet reviewed.' });
    await t.call(stu, 'POST', `/api/v1/applications/${d.body.applicationId}/submissions`);
    const r = await t.call(await t.login('coord-01'), 'POST', `/api/v1/applications/${d.body.applicationId}/nominations`, {});
    assert.equal(r.status, 409);
    assert.equal(r.body.code, 'NOT_NOMINATABLE');
    assert.equal(r.contentType.startsWith('application/problem+json'), true);
  });

  it('T-LIFE-05 a student can hold several active applications (BR-16 allows it until one is accepted)', async () => {
    const a = await t.publish(); const b = await t.publish();
    const s = await t.login('stu-0002');
    const r1 = await t.call(s, 'POST', '/api/v1/applications', { opportunityId: a, statement: 'First choice destination.' });
    const r2 = await t.call(s, 'POST', '/api/v1/applications', { opportunityId: b, statement: 'Second choice destination.' });
    assert.equal(r1.status, 201); assert.equal(r2.status, 201);
    assert.equal((await t.call(s, 'POST', `/api/v1/applications/${r1.body.applicationId}/submissions`)).status, 200);
    assert.equal((await t.call(s, 'POST', `/api/v1/applications/${r2.body.applicationId}/submissions`)).status, 200);
  });
});
