import { E } from '../domain/errors';
import { assertApplicationTransition } from '../domain/states';
import type { Ctx } from '../domain/types';
import { appendAudit, appendOutbox, withTx } from '../infrastructure/db/unit-of-work';
import { adviserAssigned, requireRole } from './authz';
import type { Deps } from './deps';

/** Adviser triage. Cannot advance unless eligibility is ELIGIBLE (CL-015). */
export async function triage(deps: Deps, ctx: Ctx, applicationId: string, input: { decision: 'ACCEPT' | 'REJECT'; reason?: string }) {
  requireRole(ctx.actor, 'adviser');
  if (input.decision !== 'ACCEPT' && input.decision !== 'REJECT') throw E.validation('decision must be ACCEPT or REJECT');
  if (input.decision === 'REJECT' && !input.reason?.trim()) throw E.validation('reason is mandatory when rejecting');

  return withTx(deps.pool, async (c) => {
    const app = (await c.query('SELECT * FROM application WHERE application_id=$1 FOR UPDATE', [applicationId])).rows[0];
    if (!app) throw E.notFound();
    if (!(await adviserAssigned(c, ctx.actor.subject, app.opportunity_id))) throw E.forbidden('Application is outside your assigned opportunities');

    const to = input.decision === 'ACCEPT' ? 'IN_ACADEMIC_REVIEW' : 'REJECTED';
    assertApplicationTransition(app.workflow_state, to);
    if (to === 'IN_ACADEMIC_REVIEW') {
      const e = (await c.query('SELECT outcome FROM eligibility_check WHERE application_id=$1 ORDER BY check_id DESC LIMIT 1', [applicationId])).rows[0];
      if (e?.outcome !== 'ELIGIBLE') throw E.eligibilityNotConfirmed();
    }
    await c.query('UPDATE application SET workflow_state=$2, row_version=row_version+1 WHERE application_id=$1', [applicationId, to]);
    await appendAudit(c, { applicationId, targetType: 'application', targetId: applicationId, actor: ctx.actor.subject,
      action: `triage.${input.decision.toLowerCase()}`, beforeAfter: { from: app.workflow_state, to }, reason: input.reason ?? null, correlationId: ctx.correlationId });
    await appendOutbox(c, 'ApplicationStateChanged', { to: app.student_subject, template: 'application-state-changed', applicationId, state: to });
    return { applicationId, workflowState: to };
  });
}

/** Academic decision by the coordinator of the application's own programme only (scope check). */
export async function academicDecision(deps: Deps, ctx: Ctx, applicationId: string, input: { decision: 'APPROVED' | 'REJECTED'; reason?: string }) {
  requireRole(ctx.actor, 'academic_coordinator');
  if (input.decision !== 'APPROVED' && input.decision !== 'REJECTED') throw E.validation('decision must be APPROVED or REJECTED');
  if (input.decision === 'REJECTED' && !input.reason?.trim()) throw E.validation('reason is mandatory when rejecting');

  return withTx(deps.pool, async (c) => {
    const app = (await c.query('SELECT * FROM application WHERE application_id=$1 FOR UPDATE', [applicationId])).rows[0];
    if (!app) throw E.notFound();
    if (!app.programme || app.programme !== ctx.actor.programme) throw E.forbidden('Application is outside your programme');

    const to = input.decision === 'APPROVED' ? 'READY_FOR_NOMINATION' : 'REJECTED';
    assertApplicationTransition(app.workflow_state, to);
    await c.query('UPDATE application SET workflow_state=$2, row_version=row_version+1 WHERE application_id=$1', [applicationId, to]);
    await appendAudit(c, { applicationId, targetType: 'application', targetId: applicationId, actor: ctx.actor.subject,
      action: `academic.${input.decision.toLowerCase()}`, beforeAfter: { from: app.workflow_state, to }, reason: input.reason ?? null, correlationId: ctx.correlationId });
    await appendOutbox(c, 'ApplicationStateChanged', { to: app.student_subject, template: 'application-state-changed', applicationId, state: to });
    return { applicationId, workflowState: to };
  });
}
