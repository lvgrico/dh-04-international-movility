import type { Pool, PoolClient } from 'pg';
import { E } from '../domain/errors';
import { assertApplicationTransition, nominationLabel } from '../domain/states';
import type { Ctx, NominationStatus } from '../domain/types';
import { appendAudit, appendOutbox, withTx } from '../infrastructure/db/unit-of-work';
import { assertCanRead, requireRole } from './authz';
import type { Deps } from './deps';
import { evaluateCheck } from './eligibility-service';

export async function createDraft(deps: Deps, ctx: Ctx, input: { opportunityId: string; statement?: string }) {
  requireRole(ctx.actor, 'student');
  const id = `APP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  await withTx(deps.pool, async (c) => {
    const opp = await c.query('SELECT 1 FROM opportunity WHERE opportunity_id=$1', [input.opportunityId]);
    if (!opp.rowCount) throw E.validation(`Unknown opportunity ${input.opportunityId}`);
    await c.query(
      `INSERT INTO application(application_id,opportunity_id,student_subject,statement,workflow_state)
       VALUES ($1,$2,$3,$4,'DRAFT')`, [id, input.opportunityId, ctx.actor.subject, input.statement ?? '']);
    await appendAudit(c, { applicationId: id, targetType: 'application', targetId: id, actor: ctx.actor.subject,
      action: 'application.draft_created', beforeAfter: { to: 'DRAFT' }, correlationId: ctx.correlationId });
  });
  return { applicationId: id, workflowState: 'DRAFT' };
}

export async function saveDraft(deps: Deps, ctx: Ctx, applicationId: string, input: { statement: string }) {
  requireRole(ctx.actor, 'student');
  await withTx(deps.pool, async (c) => {
    const a = (await c.query('SELECT * FROM application WHERE application_id=$1 FOR UPDATE', [applicationId])).rows[0];
    if (!a || a.student_subject !== ctx.actor.subject) throw E.notFound();
    if (a.workflow_state !== 'DRAFT') throw E.invalidState('Only a DRAFT can be edited');
    await c.query('UPDATE application SET statement=$2, row_version=row_version+1 WHERE application_id=$1', [applicationId, input.statement ?? '']);
    await appendAudit(c, { applicationId, targetType: 'application', targetId: applicationId, actor: ctx.actor.subject,
      action: 'application.draft_saved', correlationId: ctx.correlationId });
  });
  return { applicationId, workflowState: 'DRAFT' };
}

/**
 * DRAFT -> SUBMITTED. ADR-003: takes the opportunity row in SHARED mode, so it is serialized against any
 * exclusive-lock operation on the same opportunity. The SIS is called only AFTER commit (V-SEQ-01).
 */
export async function submitApplication(deps: Deps, ctx: Ctx, applicationId: string) {
  requireRole(ctx.actor, 'student');
  const checkId = await withTx(deps.pool, async (c) => {
    const head = (await c.query('SELECT opportunity_id, student_subject FROM application WHERE application_id=$1', [applicationId])).rows[0];
    if (!head || head.student_subject !== ctx.actor.subject) throw E.notFound();

    const opp = (await c.query('SELECT * FROM opportunity WHERE opportunity_id=$1 FOR SHARE', [head.opportunity_id])).rows[0];
    const app = (await c.query('SELECT * FROM application WHERE application_id=$1 FOR UPDATE', [applicationId])).rows[0];
    assertApplicationTransition(app.workflow_state, 'SUBMITTED');
    if (!app.statement || app.statement.trim().length < 10) {
      throw E.validation('statement is required (minimum 10 characters)');
    }
    const today = deps.clock().toISOString().slice(0, 10);
    const period = (await c.query(
      `SELECT period_no FROM application_period
        WHERE opportunity_id=$1 AND opens_on <= $2::date AND closes_on >= $2::date
        ORDER BY period_no DESC LIMIT 1`, [opp.opportunity_id, today])).rows[0];
    if (!period) throw E.periodClosed();

    await c.query(
      `UPDATE application SET workflow_state='SUBMITTED', pinned_version_no=$2, period_no=$3, row_version=row_version+1
        WHERE application_id=$1`, [applicationId, opp.current_version_no, period.period_no]);
    const chk = await c.query(
      `INSERT INTO eligibility_check(application_id, outcome, next_attempt_at) VALUES ($1,'PENDING_VALIDATION',$2) RETURNING check_id`,
      [applicationId, deps.clock().toISOString()]);
    await appendAudit(c, { applicationId, targetType: 'application', targetId: applicationId, actor: ctx.actor.subject,
      action: 'application.submitted', beforeAfter: { from: 'DRAFT', to: 'SUBMITTED', pinnedVersion: opp.current_version_no, period: period.period_no },
      correlationId: ctx.correlationId });
    await appendOutbox(c, 'ApplicationSubmitted', { to: ctx.actor.subject, template: 'application-submitted', applicationId });
    return Number(chk.rows[0].check_id);
  });

  // After commit: failure here can never invalidate the submission (BR-11).
  await evaluateCheck(deps, checkId, ctx.correlationId);
  return getStatus(deps, ctx, applicationId);
}

export async function getStatus(deps: Deps, ctx: Ctx, applicationId: string) {
  const app = (await deps.pool.query('SELECT * FROM application WHERE application_id=$1', [applicationId])).rows[0];
  if (!app) throw E.notFound();
  await assertCanRead(deps.pool, ctx.actor, app);

  const elig = (await deps.pool.query(
    'SELECT outcome, criteria_results, sis_reference, checked_at FROM eligibility_check WHERE application_id=$1 ORDER BY check_id DESC LIMIT 1',
    [applicationId])).rows[0] ?? null;
  const nom = (await deps.pool.query('SELECT * FROM nomination WHERE application_id=$1 ORDER BY created_at DESC LIMIT 1', [applicationId])).rows[0] ?? null;
  const host = nom ? (await deps.pool.query('SELECT outcome, recorded_by, recorded_at FROM host_decision WHERE nomination_id=$1', [nom.nomination_id])).rows[0] ?? null : null;
  const acc = nom ? (await deps.pool.query('SELECT status, accepted_at FROM mobility_acceptance WHERE nomination_id=$1', [nom.nomination_id])).rows[0] ?? null : null;

  return {
    applicationId,
    opportunityId: app.opportunity_id,
    // Four separate records, shown as four separate facts (BR-03, E2-ADR-004):
    application: { workflowState: app.workflow_state, pinnedVersionNo: app.pinned_version_no, periodNo: app.period_no, withdrawnReason: app.withdrawn_reason },
    eligibility: elig && { outcome: elig.outcome, criteria: elig.criteria_results, sisReference: elig.sis_reference },
    nomination: nom && { nominationId: nom.nomination_id, status: nom.status, label: nominationLabel(nom.status as NominationStatus), offerExpiresAt: nom.offer_expires_at, override: !!nom.override_justification },
    hostDecision: host && { outcome: host.outcome, recordedBy: host.recorded_by, recordedAt: host.recorded_at },
    acceptance: acc && { status: acc.status, label: 'Accepted by you', acceptedAt: acc.accepted_at },
    nextAction: nextAction(app.workflow_state, elig?.outcome, nom?.status),
  };
}

function nextAction(state: string, elig?: string, nom?: string): string {
  if (state === 'DRAFT') return 'Complete and submit your application';
  if (state === 'SUBMITTED') return elig === 'PENDING_VALIDATION' ? 'Waiting for automatic eligibility validation' : elig === 'INELIGIBLE' ? 'Not eligible - an adviser will record the outcome' : 'Waiting for adviser triage';
  if (state === 'IN_ACADEMIC_REVIEW') return 'Waiting for academic approval';
  if (state === 'READY_FOR_NOMINATION') return 'Waiting for Horizon to nominate';
  if (state === 'NOMINATED') {
    if (nom === 'AWAITING_HOST_DECISION') return 'Waiting for the host university decision (you are NOT admitted yet)';
    if (nom === 'ADMITTED') return 'Accept or decline the offer before it expires';
    if (nom === 'ACCEPTED') return 'Prepare your pre-departure requirements';
    return 'No action required';
  }
  if (state === 'WITHDRAWN') return 'Application withdrawn';
  if (state === 'REJECTED') return 'Application rejected';
  return 'No action required';
}

export async function getAudit(deps: Deps, ctx: Ctx, applicationId: string) {
  requireRole(ctx.actor, 'adviser', 'coordinator', 'it');
  const app = (await deps.pool.query('SELECT * FROM application WHERE application_id=$1', [applicationId])).rows[0];
  if (!app) throw E.notFound();
  if (ctx.actor.role === 'adviser') await assertCanRead(deps.pool, ctx.actor, app);
  const r = await deps.pool.query(
    `SELECT audit_id, actor_subject AS actor, action, before_after AS "beforeAfter", reason, correlation_id AS "correlationId", occurred_at AS "occurredAt"
       FROM audit_event WHERE application_id=$1 ORDER BY audit_id`, [applicationId]);
  return r.rows;
}

export type DbLike = Pool | PoolClient;
