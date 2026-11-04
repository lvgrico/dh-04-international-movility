import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { expireOffers } from '../src/application/offers';
import { startTestApp, trials, type TestApp } from './helpers';

let t: TestApp;
before(async () => { t = await startTestApp(); });
after(async () => { await t.close(); });

/** Two opportunities of the SAME term, one student with both applications nominated and admitted. */
async function twoAdmittedOffers(term: string, student = 'stu-0001') {
  const coord = await t.login('coord-01');
  const oppA = await t.publish({ places: 1, term });
  const oppB = await t.publish({ places: 1, term });
  const appA = await t.readyApplication(student, oppA);
  const appB = await t.readyApplication(student, oppB);
  const nomA = (await t.call(coord, 'POST', `/api/v1/applications/${appA}/nominations`, {})).body.nominationId;
  const nomB = (await t.call(coord, 'POST', `/api/v1/applications/${appB}/nominations`, {})).body.nominationId;
  await t.call(coord, 'POST', `/api/v1/nominations/${nomA}/host-decisions`, { outcome: 'ADMITTED' });
  await t.call(coord, 'POST', `/api/v1/nominations/${nomB}/host-decisions`, { outcome: 'ADMITTED' });
  return { oppA, oppB, appA, appB, nomA, nomB };
}

describe('single acceptance per student per term (QS-08, E2-ADR-011, BR-16)', () => {
  it('T-ACC-01 accepting two offers of the same term AT THE SAME MOMENT: exactly one 200 and one 409, every trial, no deadlock', async () => {
    const N = trials('ACCEPT_TRIALS', 20);
    const s = await t.login('stu-0001');
    for (let i = 0; i < N; i++) {
      const o = await twoAdmittedOffers(`CONC-${i}`);
      const [r1, r2] = await Promise.all([
        t.call(s, 'POST', `/api/v1/nominations/${o.nomA}/acceptances`),
        t.call(s, 'POST', `/api/v1/nominations/${o.nomB}/acceptances`),
      ]);
      assert.deepEqual([r1.status, r2.status].sort(), [200, 409], `trial ${i}: ${r1.status}/${r2.status} ${JSON.stringify([r1.body, r2.body])}`);
      const loser = r1.status === 409 ? r1 : r2;
      assert.equal(loser.body.code, 'TERM_ALREADY_ACCEPTED');
      const act = await t.admin.query(`SELECT count(*)::int AS n FROM mobility_acceptance WHERE student_subject='stu-0001' AND term=$1 AND status='ACTIVE'`, [`CONC-${i}`]);
      assert.equal(act.rows[0].n, 1, `trial ${i}: exactly one active acceptance per term`);
    }
    console.log(`# ACCEPT_TRIALS=${N} -> each trial: 1 acceptance, 1 TERM_ALREADY_ACCEPTED, 0 deadlocks`);
  });

  it('T-ACC-02 accepting one offer withdraws the other application, revokes its nomination and releases its place (same transaction)', async () => {
    const o = await twoAdmittedOffers('CASCADE-1');
    const s = await t.login('stu-0001');
    const acc = await t.call(s, 'POST', `/api/v1/nominations/${o.nomA}/acceptances`);
    assert.equal(acc.status, 200);
    assert.deepEqual(acc.body.withdrawnApplications, [o.appB]);

    const other = await t.call(s, 'GET', `/api/v1/applications/${o.appB}/status`);
    assert.equal(other.body.application.workflowState, 'WITHDRAWN');
    assert.equal(other.body.application.withdrawnReason, 'ACCEPTED_ANOTHER');
    assert.equal(other.body.nomination.status, 'REVOKED');

    const coord = await t.login('coord-01');
    const placesB = await t.call(coord, 'GET', `/api/v1/opportunities/${o.oppB}/places`);
    assert.equal(placesB.body.activeNominations, 0, 'the released place is available again');

    const audit = await t.call(await t.login('it-01'), 'GET', `/api/v1/applications/${o.appB}/audit`);
    const w = audit.body.find((e: any) => e.action === 'application.withdrawn');
    assert.equal(w.actor, 'system'); assert.equal(w.reason, 'ACCEPTED_ANOTHER');
  });

  it('T-ACC-03 a student of a DIFFERENT term can still accept another mobility (rule is per term)', async () => {
    const first = await twoAdmittedOffers('TERM-A');
    const s = await t.login('stu-0001');
    assert.equal((await t.call(s, 'POST', `/api/v1/nominations/${first.nomA}/acceptances`)).status, 200);
    const other = await twoAdmittedOffers('TERM-B');
    assert.equal((await t.call(s, 'POST', `/api/v1/nominations/${other.nomA}/acceptances`)).status, 200);
  });

  it('T-ACC-04 an expired offer is rejected by SERVER time (OFFER_EXPIRED) and releases its place (QS-09)', async () => {
    const o = await twoAdmittedOffers('EXPIRY-1', 'stu-0002');
    const s = await t.login('stu-0002');
    t.clock.offsetMs = 15 * 86_400_000;                    // offer window is 14 days
    try {
      const r = await t.call(s, 'POST', `/api/v1/nominations/${o.nomA}/acceptances`);
      assert.equal(r.status, 409); assert.equal(r.body.code, 'OFFER_EXPIRED');
    } finally { t.clock.offsetMs = 0; }
    const st = await t.call(s, 'GET', `/api/v1/applications/${o.appA}/status`);
    assert.equal(st.body.nomination.status, 'OFFER_EXPIRED');
    const places = await t.call(await t.login('coord-01'), 'GET', `/api/v1/opportunities/${o.oppA}/places`);
    assert.equal(places.body.activeNominations, 0);
  });

  it('T-ACC-05 only the owner can accept, and only an ADMITTED offer (a merely nominated one cannot be accepted)', async () => {
    const coord = await t.login('coord-01');
    const opp = await t.publish({ term: 'OWNER-1' });
    const app = await t.readyApplication('stu-0001', opp);
    const nom = (await t.call(coord, 'POST', `/api/v1/applications/${app}/nominations`, {})).body.nominationId;
    const own = await t.login('stu-0001');
    const early = await t.call(own, 'POST', `/api/v1/nominations/${nom}/acceptances`);
    assert.equal(early.status, 409); assert.equal(early.body.code, 'INVALID_STATE');
    await t.call(coord, 'POST', `/api/v1/nominations/${nom}/host-decisions`, { outcome: 'ADMITTED' });
    assert.equal((await t.call(await t.login('stu-0002'), 'POST', `/api/v1/nominations/${nom}/acceptances`)).status, 404);
    assert.equal((await t.call(own, 'POST', `/api/v1/nominations/${nom}/acceptances`)).status, 200);
  });

  it('T-ACC-06 the worker expires overdue offers WITHOUT any student action, releasing the place (E2-ADR-011)', async () => {
    const o = await twoAdmittedOffers('EXPIRY-WORKER', 'stu-0002');
    const coord = await t.login('coord-01');
    assert.equal((await t.call(coord, 'GET', `/api/v1/opportunities/${o.oppA}/places`)).body.activeNominations, 1);
    assert.equal(await expireOffers(t.deps), 0, 'nothing is overdue yet');
    t.clock.offsetMs = 15 * 86_400_000;
    try { assert.ok((await expireOffers(t.deps)) >= 2, 'at least both offers of this scenario are overdue'); } finally { t.clock.offsetMs = 0; }
    const st = await t.admin.query('SELECT status FROM nomination WHERE nomination_id = ANY($1)', [[o.nomA, o.nomB]]);
    assert.deepEqual(st.rows.map((r) => r.status), ['OFFER_EXPIRED', 'OFFER_EXPIRED']);
    assert.equal((await t.call(coord, 'GET', `/api/v1/opportunities/${o.oppA}/places`)).body.activeNominations, 0);
    assert.equal(await expireOffers(t.deps), 0, 'idempotent: running again expires nothing');
  });
});
