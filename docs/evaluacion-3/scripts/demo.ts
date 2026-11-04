// Scripted demonstration of increment 1 against a RUNNING server (npm start, ENABLE_SIMULATORS=true).
// Prerequisite: `npm run db:reset` so the synthetic seed is in its initial state.
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

async function call(token: string | null, method: string, path: string, body?: unknown) {
  const r = await fetch(BASE + path, {
    method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  return { status: r.status, body: text ? JSON.parse(text) : null };
}
const login = async (subject: string) => (await call(null, 'POST', '/api/v1/auth/login', { subject })).body.token as string;
const title = (t: string) => console.log(`\n=== ${t} ===`);
const show = (label: string, r: { status: number; body: any }, pick?: (b: any) => unknown) =>
  console.log(`${label.padEnd(46)} -> HTTP ${r.status}  ${JSON.stringify(pick ? pick(r.body) : r.body)}`);

async function ready(student: string, opp: string) {
  const s = await login(student);
  const d = await call(s, 'POST', '/api/v1/applications', { opportunityId: opp, statement: 'I want to study abroad to broaden my engineering skills.' });
  const id = d.body.applicationId as string;
  const sub = await call(s, 'POST', `/api/v1/applications/${id}/submissions`);
  show(`${student} submits`, sub, (b) => ({ state: b.application.workflowState, eligibility: b.eligibility?.outcome }));
  show('adviser triage ACCEPT', await call(await login('adv-01'), 'POST', `/api/v1/applications/${id}/triage`, { decision: 'ACCEPT' }), (b) => b.workflowState ?? b.code);
  const acad = student === 'stu-0003' ? 'acad-bus' : 'acad-eng';
  show(`${acad} academic APPROVED`, await call(await login(acad), 'POST', `/api/v1/applications/${id}/academic-decisions`, { decision: 'APPROVED' }), (b) => b.workflowState ?? b.code);
  return id;
}

async function main() {
  const coord = await login('coord-01');
  const OPP = 'OPP-2027-01'; // 1 place

  title('1. Valid flow: apply -> validate (simulated SIS) -> triage -> academic approval -> nominate');
  const app1 = await ready('stu-0001', OPP);
  const nom = await call(coord, 'POST', `/api/v1/applications/${app1}/nominations`, {});
  show('coordinator nominates (1 place free)', nom);
  const st = await call(await login('stu-0001'), 'GET', `/api/v1/applications/${app1}/status`);
  show('student status', st, (b) => ({ nomination: b.nomination.label, hostDecision: b.hostDecision, nextAction: b.nextAction }));

  title('2. Domain rule: a second candidate for the same (now full) opportunity is rejected');
  const app2 = await ready('stu-0002', OPP);
  show('coordinator nominates (0 places free)', await call(coord, 'POST', `/api/v1/applications/${app2}/nominations`, {}), (b) => ({ code: b.code, detail: b.detail }));
  show('places utilisation', await call(coord, 'GET', `/api/v1/opportunities/${OPP}/places`));

  title('3. Alternative case: ineligible student cannot advance');
  const s4 = await login('stu-0004');
  const d4 = await call(s4, 'POST', '/api/v1/applications', { opportunityId: OPP, statement: 'Applying although my GPA is low.' });
  show('stu-0004 submits', await call(s4, 'POST', `/api/v1/applications/${d4.body.applicationId}/submissions`), (b) => b.eligibility);
  show('adviser triage ACCEPT', await call(await login('adv-01'), 'POST', `/api/v1/applications/${d4.body.applicationId}/triage`, { decision: 'ACCEPT' }), (b) => b.code);

  title('4. Access control');
  show("stu-0002 reads stu-0001's application", await call(await login('stu-0002'), 'GET', `/api/v1/applications/${app1}/status`), (b) => b.code);
  show('student tries to nominate', await call(await login('stu-0002'), 'POST', `/api/v1/applications/${app2}/nominations`, {}), (b) => b.code);
  show('coordinator WITHOUT override permission', await call(coord, 'POST', `/api/v1/applications/${app2}/nominations`, { override: { justification: 'Dean asked' } }), (b) => b.code);

  title('5. Resilience: SIS outage does not lose the submission');
  await call(null, 'POST', '/sim/sis', { mode: 'down' });
  const s3 = await login('stu-0003');
  const d3 = await call(s3, 'POST', '/api/v1/applications', { opportunityId: 'OPP-2027-03', statement: 'Applying while the SIS is unavailable.' });
  show('stu-0003 submits while SIS is DOWN', await call(s3, 'POST', `/api/v1/applications/${d3.body.applicationId}/submissions`), (b) => ({ state: b.application.workflowState, eligibility: b.eligibility.outcome, next: b.nextAction }));
  await call(null, 'POST', '/sim/sis', { mode: 'ok' });
  show('worker runs after SIS is back', await call(null, 'POST', '/sim/worker/run'));
  show('student status now', await call(s3, 'GET', `/api/v1/applications/${d3.body.applicationId}/status`), (b) => b.eligibility?.outcome);

  title('6. Host decision and acceptance (nomination is not admission)');
  show('host admits', await call(coord, 'POST', `/api/v1/nominations/${nom.body.nominationId}/host-decisions`, { outcome: 'ADMITTED' }));
  const s1 = await login('stu-0001');
  show('student accepts', await call(s1, 'POST', `/api/v1/nominations/${nom.body.nominationId}/acceptances`));
  show('student status', await call(s1, 'GET', `/api/v1/applications/${app1}/status`), (b) => ({ nomination: b.nomination.status, acceptance: b.acceptance?.status }));

  title('7. Audit trail of the nominated application');
  const audit = await call(await login('it-01'), 'GET', `/api/v1/applications/${app1}/audit`);
  for (const e of audit.body) console.log(`  #${e.audit_id}  ${e.actor.padEnd(13)} ${e.action.padEnd(26)} ${e.correlationId}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
