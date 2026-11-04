import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, trials, type TestApp } from './helpers';

let t: TestApp;
before(async () => { t = await startTestApp(); });
after(async () => { await t.close(); });

describe('quota integrity (QS-01, E2-ADR-003, BR-04)', () => {
  it('T-QUO-01 two coordinators nominate for the LAST place at the same moment: exactly one 201 and one 409, every trial', async () => {
    const N = trials('QUOTA_TRIALS', 30);
    const c1 = await t.login('coord-01');
    const c2 = await t.login('coord-senior');            // independent session / connection
    let wins = 0, conflicts = 0;
    for (let i = 0; i < N; i++) {
      const opp = await t.publish({ places: 1 });
      const [a1, a2] = [await t.readyApplication('stu-0001', opp), await t.readyApplication('stu-0002', opp)];
      const [r1, r2] = await Promise.all([
        t.call(c1, 'POST', `/api/v1/applications/${a1}/nominations`, {}),
        t.call(c2, 'POST', `/api/v1/applications/${a2}/nominations`, {}),
      ]);
      const statuses = [r1.status, r2.status].sort();
      assert.deepEqual(statuses, [201, 409], `trial ${i}: got ${statuses}`);
      const loser = r1.status === 409 ? r1 : r2;
      assert.equal(loser.body.code, 'QUOTA_EXCEEDED');
      const active = await t.admin.query(
        `SELECT count(*)::int AS n FROM nomination WHERE opportunity_id=$1 AND status IN ('AWAITING_HOST_DECISION','ADMITTED','ACCEPTED')`, [opp]);
      assert.equal(active.rows[0].n, 1, `trial ${i}: active nominations must never exceed places`);
      wins++; conflicts++;
    }
    console.log(`# QUOTA_TRIALS=${N} -> ${wins} nominations created, ${conflicts} QUOTA_EXCEEDED, 0 violations`);
  });

  it('T-QUO-02 the loser leaves NO residue: no nomination, no success audit, no outbox event (rolled-back transaction)', async () => {
    const opp = await t.publish({ places: 1 });
    const [a1, a2] = [await t.readyApplication('stu-0001', opp), await t.readyApplication('stu-0002', opp)];
    const coord = await t.login('coord-01');
    assert.equal((await t.call(coord, 'POST', `/api/v1/applications/${a1}/nominations`, {})).status, 201);
    const before = await t.admin.query('SELECT (SELECT count(*) FROM outbox_event)::int AS o, (SELECT count(*) FROM audit_event)::int AS a');
    const lose = await t.call(coord, 'POST', `/api/v1/applications/${a2}/nominations`, {});
    assert.equal(lose.status, 409);
    const after = await t.admin.query('SELECT (SELECT count(*) FROM outbox_event)::int AS o, (SELECT count(*) FROM audit_event)::int AS a');
    assert.deepEqual(after.rows[0], before.rows[0], 'a rejected command must not write audit or outbox');
    const st = await t.call(await t.login('stu-0002'), 'GET', `/api/v1/applications/${a2}/status`);
    assert.equal(st.body.application.workflowState, 'READY_FOR_NOMINATION');
    assert.equal(st.body.nomination, null);
  });

  it('T-QUO-03 override: needs the permission AND a justification; it is stored and audited', async () => {
    const opp = await t.publish({ places: 1 });
    const [a1, a2] = [await t.readyApplication('stu-0001', opp), await t.readyApplication('stu-0002', opp)];
    const plain = await t.login('coord-01');
    const senior = await t.login('coord-senior');
    assert.equal((await t.call(plain, 'POST', `/api/v1/applications/${a1}/nominations`, {})).status, 201);

    const noPerm = await t.call(plain, 'POST', `/api/v1/applications/${a2}/nominations`, { override: { justification: 'Dean request' } });
    assert.equal(noPerm.status, 403); assert.equal(noPerm.body.code, 'OVERRIDE_NOT_PERMITTED');
    const noText = await t.call(senior, 'POST', `/api/v1/applications/${a2}/nominations`, { override: { justification: '   ' } });
    assert.equal(noText.status, 422);
    const ok = await t.call(senior, 'POST', `/api/v1/applications/${a2}/nominations`, { override: { justification: 'Partner agreed to an extra seat' } });
    assert.equal(ok.status, 201); assert.equal(ok.body.override, true);

    const audit = await t.call(await t.login('it-01'), 'GET', `/api/v1/applications/${a2}/audit`);
    const ev = audit.body.find((e: any) => e.action === 'nomination.created');
    assert.equal(ev.reason, 'Partner agreed to an extra seat');
    assert.equal(ev.actor, 'coord-senior');
    const u = await t.call(plain, 'GET', `/api/v1/opportunities/${opp}/places`);
    assert.deepEqual([u.body.places, u.body.activeNominations], [1, 2], 'override is the only way to exceed places, and it is visible');
  });

  it('T-QUO-04 a refused nomination releases its place, which can then be nominated again (CL-014)', async () => {
    const opp = await t.publish({ places: 1 });
    const [a1, a2] = [await t.readyApplication('stu-0001', opp), await t.readyApplication('stu-0002', opp)];
    const coord = await t.login('coord-01');
    const n1 = await t.call(coord, 'POST', `/api/v1/applications/${a1}/nominations`, {});
    assert.equal((await t.call(coord, 'POST', `/api/v1/applications/${a2}/nominations`, {})).status, 409);
    assert.equal((await t.call(coord, 'POST', `/api/v1/nominations/${n1.body.nominationId}/host-decisions`, { outcome: 'REFUSED' })).status, 201);
    assert.equal((await t.call(coord, 'POST', `/api/v1/applications/${a2}/nominations`, {})).status, 201);
  });

  it('T-QUO-05 the same application cannot hold two active nominations (unique partial index)', async () => {
    const opp = await t.publish({ places: 3 });
    const a1 = await t.readyApplication('stu-0001', opp);
    const coord = await t.login('coord-01');
    const [r1, r2] = await Promise.all([
      t.call(coord, 'POST', `/api/v1/applications/${a1}/nominations`, {}),
      t.call(coord, 'POST', `/api/v1/applications/${a1}/nominations`, {}),
    ]);
    assert.deepEqual([r1.status, r2.status].sort(), [201, 409]);
    const n = await t.admin.query(`SELECT count(*)::int AS n FROM nomination WHERE application_id=$1`, [a1]);
    assert.equal(n.rows[0].n, 1);
  });
});
