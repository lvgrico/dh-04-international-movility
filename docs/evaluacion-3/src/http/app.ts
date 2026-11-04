import { randomBytes } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import { AppError, E } from '../domain/errors';
import type { Actor, Ctx } from '../domain/types';
import { academicDecision, triage } from '../application/review';
import { acceptOffer } from '../application/acceptance';
import { createDraft, getAudit, getStatus, saveDraft, submitApplication } from '../application/applications';
import type { Deps } from '../application/deps';
import { retryPendingEligibility } from '../application/eligibility-service';
import { nominate, recordHostDecision } from '../application/nominations';
import { listOpportunities, placesUtilisation, publishOpportunity } from '../application/opportunities';
import { expireOffers } from '../application/offers';
import { processOutbox } from '../application/outbox-worker';
import type { MockSis } from '../infrastructure/adapters/mock-sis';
import type { SimulatedNotifier } from '../infrastructure/adapters/notifiers';

export interface AppOptions {
  deps: Deps;
  simulators?: { sis: MockSis; notifier: SimulatedNotifier } | null;
}

type AuthedRequest = Request & { ctx: Ctx };
const wrap = (fn: (req: AuthedRequest, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => { fn(req as AuthedRequest, res).catch(next); };

export function createApp({ deps, simulators }: AppOptions) {
  const app = express();
  app.use(express.json());
  const v1 = express.Router();

  // ---- Simulated institutional login (IdentityPort stand-in, E2-ADR-009): synthetic subjects only.
  v1.post('/auth/login', wrap(async (req, res) => {
    const subject = String(req.body?.subject ?? '');
    const u = (await deps.pool.query('SELECT subject FROM app_user WHERE subject=$1', [subject])).rows[0];
    if (!u) throw E.unauthenticated();
    const token = randomBytes(24).toString('hex');
    await deps.pool.query('INSERT INTO session(token,subject) VALUES ($1,$2)', [token, subject]);
    res.json({ token, subject });
  }));

  // ---- Everything below needs a valid session. Roles come from the DB, never from the request body.
  v1.use((req: Request, _res: Response, next: NextFunction) => {
    (async () => {
      const m = /^Bearer (.+)$/.exec(req.header('authorization') ?? '');
      if (!m) throw E.unauthenticated();
      const u = (await deps.pool.query(
        `SELECT u.subject, u.role, u.programme, u.permissions FROM session s JOIN app_user u ON u.subject=s.subject WHERE s.token=$1`, [m[1]])).rows[0];
      if (!u) throw E.unauthenticated();
      const actor: Actor = { subject: u.subject, role: u.role, programme: u.programme, permissions: u.permissions };
      (req as AuthedRequest).ctx = { actor, correlationId: req.header('x-correlation-id') ?? `corr-${randomBytes(4).toString('hex')}` };
    })().then(() => next(), next);
  });
  const authed = wrap;

  v1.get('/opportunities', authed(async (_req, res) => { res.json(await listOpportunities(deps)); }));
  v1.post('/opportunities', authed(async (req, res) => { res.status(201).json(await publishOpportunity(deps, req.ctx, req.body)); }));
  v1.get('/opportunities/:id/places', authed(async (req, res) => { res.json(await placesUtilisation(deps, req.ctx, req.params.id)); }));

  v1.post('/applications', authed(async (req, res) => { res.status(201).json(await createDraft(deps, req.ctx, req.body)); }));
  v1.put('/applications/:id', authed(async (req, res) => { res.json(await saveDraft(deps, req.ctx, req.params.id, req.body)); }));
  v1.post('/applications/:id/submissions', authed(async (req, res) => { res.status(200).json(await submitApplication(deps, req.ctx, req.params.id)); }));
  v1.post('/applications/:id/triage', authed(async (req, res) => { res.json(await triage(deps, req.ctx, req.params.id, req.body)); }));
  v1.post('/applications/:id/academic-decisions', authed(async (req, res) => { res.json(await academicDecision(deps, req.ctx, req.params.id, req.body)); }));
  v1.post('/applications/:id/nominations', authed(async (req, res) => { res.status(201).json(await nominate(deps, req.ctx, req.params.id, req.body ?? {})); }));
  v1.get('/applications/:id/status', authed(async (req, res) => { res.setHeader('Cache-Control', 'no-store'); res.json(await getStatus(deps, req.ctx, req.params.id)); }));
  v1.get('/applications/:id/audit', authed(async (req, res) => { res.json(await getAudit(deps, req.ctx, req.params.id)); }));
  v1.post('/nominations/:id/host-decisions', authed(async (req, res) => { res.status(201).json(await recordHostDecision(deps, req.ctx, req.params.id, req.body)); }));
  v1.post('/nominations/:id/acceptances', authed(async (req, res) => { res.json(await acceptOffer(deps, req.ctx, req.params.id)); }));

  app.use('/api/v1', v1);

  // ---- Simulators (only when explicitly enabled): outage, notifier failure, run the worker once.
  if (simulators) {
    const sim = express.Router();
    sim.post('/sis', (req, res) => { simulators.sis.mode = req.body?.mode ?? 'ok'; res.json({ sisMode: simulators.sis.mode }); });
    sim.post('/notifier', (req, res) => { simulators.notifier.failing = !!req.body?.failing; res.json({ notifierFailing: simulators.notifier.failing }); });
    sim.post('/worker/run', wrap(async (_req, res) => {
      const eligibilityResolved = await retryPendingEligibility(deps, { force: true });
      const offersExpired = await expireOffers(deps);
      const outbox = await processOutbox(deps, { force: true });
      res.json({ eligibilityResolved, offersExpired, outbox });
    }));
    app.use('/sim', sim);
  }

  app.use((_req, _res, next) => next(E.notFound()));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.status).type('application/problem+json').json({
        type: `urn:imams:problem:${err.code.toLowerCase().replace(/_/g, '-')}`,
        title: err.title, status: err.status, code: err.code, detail: err.detail, instance: req.originalUrl,
        correlationId: req.header('x-correlation-id') ?? undefined,
      });
      return;
    }
    console.error(err);
    res.status(500).type('application/problem+json').json({ type: 'urn:imams:problem:internal', title: 'Internal error', status: 500, code: 'INTERNAL' });
  });
  return app;
}
