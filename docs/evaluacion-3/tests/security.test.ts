import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, type TestApp } from './helpers';

let t: TestApp;
let opp: string;
let appId: string;      // READY_FOR_NOMINATION application of stu-0001 (programme ENG)
before(async () => {
  t = await startTestApp();
  opp = await t.publish({ places: 2 });
  appId = await t.readyApplication('stu-0001', opp);
});
after(async () => { await t.close(); });

describe('access control by role and relationship (QS-05, BR-14) - negative matrix', () => {
  it('T-SEC-01 no token or an invalid token -> 401', async () => {
    assert.equal((await t.call(null, 'GET', `/api/v1/applications/${appId}/status`)).status, 401);
    assert.equal((await t.call('not-a-token', 'GET', `/api/v1/applications/${appId}/status`)).status, 401);
  });

  it('T-SEC-02 a student cannot nominate, record host decisions or publish opportunities -> 403, and nothing changes', async () => {
    const s = await t.login('stu-0001');
    const r1 = await t.call(s, 'POST', `/api/v1/applications/${appId}/nominations`, {});
    assert.equal(r1.status, 403); assert.equal(r1.body.code, 'ACTION_FORBIDDEN');
    const r2 = await t.call(s, 'POST', '/api/v1/opportunities', { destination: 'x', term: 'x', places: 1, minGpa: 3, minCredits: 1, opensOn: t.day(0), closesOn: t.day(1), horizonDeadline: t.day(2) });
    assert.equal(r2.status, 403);
    const n = await t.admin.query('SELECT count(*)::int AS n FROM nomination WHERE application_id=$1', [appId]);
    assert.equal(n.rows[0].n, 0, 'no protected write happened');
  });

  it("T-SEC-03 a student cannot read another student's application: 404 (existence concealed)", async () => {
    const r = await t.call(await t.login('stu-0002'), 'GET', `/api/v1/applications/${appId}/status`);
    assert.equal(r.status, 404);
    assert.equal(r.body.code, 'RESOURCE_NOT_FOUND');
  });

  it('T-SEC-04 a student cannot submit or accept on behalf of another student -> 404', async () => {
    const other = await t.login('stu-0002');
    assert.equal((await t.call(other, 'POST', `/api/v1/applications/${appId}/submissions`)).status, 404);
  });

  it('T-SEC-05 an academic coordinator of ANOTHER programme cannot decide (scope) -> 403', async () => {
    const opp2 = await t.publish();
    const s = await t.login('stu-0001');
    const d = await t.call(s, 'POST', '/api/v1/applications', { opportunityId: opp2, statement: 'Programme scope test statement.' });
    await t.call(s, 'POST', `/api/v1/applications/${d.body.applicationId}/submissions`);
    await t.call(await t.login('adv-01'), 'POST', `/api/v1/applications/${d.body.applicationId}/triage`, { decision: 'ACCEPT' });
    const wrong = await t.call(await t.login('acad-bus'), 'POST', `/api/v1/applications/${d.body.applicationId}/academic-decisions`, { decision: 'APPROVED' });
    assert.equal(wrong.status, 403);
    const right = await t.call(await t.login('acad-eng'), 'POST', `/api/v1/applications/${d.body.applicationId}/academic-decisions`, { decision: 'APPROVED' });
    assert.equal(right.status, 200);
  });

  it('T-SEC-06 an adviser outside the opportunity assignment cannot triage or read it -> 403', async () => {
    const unassigned = await t.publish();
    await t.admin.query('DELETE FROM adviser_assignment WHERE opportunity_id=$1', [unassigned]);
    const s = await t.login('stu-0002');
    const d = await t.call(s, 'POST', '/api/v1/applications', { opportunityId: unassigned, statement: 'Adviser scope test statement.' });
    await t.call(s, 'POST', `/api/v1/applications/${d.body.applicationId}/submissions`);
    const adv = await t.login('adv-01');
    assert.equal((await t.call(adv, 'POST', `/api/v1/applications/${d.body.applicationId}/triage`, { decision: 'ACCEPT' })).status, 403);
    assert.equal((await t.call(adv, 'GET', `/api/v1/applications/${d.body.applicationId}/status`)).status, 403);
  });

  it('T-SEC-07 a role sent in the request body is ignored; roles come from the server (BR-14)', async () => {
    const s = await t.login('stu-0001');
    const r = await t.call(s, 'POST', `/api/v1/applications/${appId}/nominations`, { role: 'coordinator', actor: { role: 'coordinator' } });
    assert.equal(r.status, 403);
  });

  it('T-SEC-08 audit history is not readable by students', async () => {
    assert.equal((await t.call(await t.login('stu-0001'), 'GET', `/api/v1/applications/${appId}/audit`)).status, 403);
  });
});
