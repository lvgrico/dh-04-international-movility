import type { AddressInfo } from 'node:net';
import pg from 'pg';
import { createApp } from '../src/http/app';
import { migrate } from '../src/infrastructure/db/migrate';
import { MockSis, ValidatingSis } from '../src/infrastructure/adapters/mock-sis';
import { SimulatedNotifier } from '../src/infrastructure/adapters/notifiers';
import type { Deps } from '../src/application/deps';

export const TEST_ADMIN_URL = process.env.TEST_DATABASE_ADMIN_URL ?? 'postgres://postgres:imams@localhost:5432/imams_test';
export const TEST_APP_URL = process.env.TEST_DATABASE_URL ?? 'postgres://imams_app:imams_app@localhost:5432/imams_test';

export interface Reply { status: number; body: any; contentType: string }

export async function startTestApp() {
  await migrate({ reset: true, url: TEST_ADMIN_URL });          // clean, seeded database for every test file
  const pool = new pg.Pool({ connectionString: TEST_APP_URL, max: 20 });   // runtime role (least privilege)
  const admin = new pg.Pool({ connectionString: TEST_ADMIN_URL, max: 3 }); // only to arrange / inspect
  const sis = new MockSis();
  const notifier = new SimulatedNotifier(false);
  const clock = { offsetMs: 0 };
  const deps: Deps = {
    pool, sis: new ValidatingSis(sis), notifier,
    clock: () => new Date(Date.now() + clock.offsetMs),
    config: { offerWindowDays: 14, sisTimeoutMs: 1000 },
  };
  const app = createApp({ deps, simulators: { sis, notifier } });
  const server = await new Promise<import('node:http').Server>((resolve) => { const s = app.listen(0, () => resolve(s)); });
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  async function call(token: string | null, method: string, path: string, body?: unknown): Promise<Reply> {
    const r = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await r.text();
    return { status: r.status, body: text ? JSON.parse(text) : null, contentType: r.headers.get('content-type') ?? '' };
  }
  const tokens = new Map<string, string>();
  async function login(subject: string): Promise<string> {
    if (!tokens.has(subject)) {
      const r = await call(null, 'POST', '/api/v1/auth/login', { subject });
      if (r.status !== 200) throw new Error(`login failed for ${subject}: ${r.status}`);
      tokens.set(subject, r.body.token);
    }
    return tokens.get(subject)!;
  }

  const day = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

  /** Publish a fresh opportunity through the real endpoint and assign the adviser. */
  async function publish(over: Partial<Record<string, unknown>> = {}) {
    const coord = await login('coord-01');
    const r = await call(coord, 'POST', '/api/v1/opportunities', {
      destination: 'Test University', term: '2027-S1', places: 1, minGpa: 3.0, minCredits: 60,
      opensOn: day(-1), closesOn: day(30), horizonDeadline: day(40), ...over,
    });
    if (r.status !== 201) throw new Error(`publish failed: ${JSON.stringify(r.body)}`);
    await admin.query('INSERT INTO adviser_assignment(subject,opportunity_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', ['adv-01', r.body.opportunityId]);
    return r.body.opportunityId as string;
  }

  /** Draft -> submitted (eligible) -> triaged -> academically approved => READY_FOR_NOMINATION, via the real API. */
  async function readyApplication(student: string, opportunityId: string, programmeCoordinator = 'acad-eng') {
    const s = await login(student);
    const d = await call(s, 'POST', '/api/v1/applications', { opportunityId, statement: 'I want to study abroad to deepen my engineering skills.' });
    const id = d.body.applicationId as string;
    const sub = await call(s, 'POST', `/api/v1/applications/${id}/submissions`);
    if (sub.body.eligibility?.outcome !== 'ELIGIBLE') throw new Error(`not eligible: ${JSON.stringify(sub.body)}`);
    const t = await call(await login('adv-01'), 'POST', `/api/v1/applications/${id}/triage`, { decision: 'ACCEPT' });
    if (t.status !== 200) throw new Error(`triage failed: ${JSON.stringify(t.body)}`);
    const a = await call(await login(programmeCoordinator), 'POST', `/api/v1/applications/${id}/academic-decisions`, { decision: 'APPROVED' });
    if (a.status !== 200) throw new Error(`academic failed: ${JSON.stringify(a.body)}`);
    return id;
  }

  async function close() {
    await new Promise((r) => server.close(r));
    await pool.end();
    await admin.end();
  }
  return { base, pool, admin, sis, notifier, clock, deps, call, login, publish, readyApplication, close, day };
}

export type TestApp = Awaited<ReturnType<typeof startTestApp>>;
export const trials = (envName: string, dflt: number) => Number(process.env[envName] ?? dflt);
