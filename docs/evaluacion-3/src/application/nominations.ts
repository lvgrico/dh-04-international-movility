import { E } from '../domain/errors';
import { assertApplicationTransition, assertNominationTransition } from '../domain/states';
import type { Ctx } from '../domain/types';
import { appendAudit, appendOutbox, withTx } from '../infrastructure/db/unit-of-work';
import { requireRole } from './authz';
import type { Deps } from './deps';

/**
 * E2-ADR-003 / QS-01. One transaction: lock the OPPORTUNITY row exclusively, count ACTIVE nominations,
 * compare with the places of the CURRENT requirement version, then insert nomination + audit + outbox together.
 * The quota is never decided from a number read earlier or shown on a screen.
 */
export async function nominate(deps: Deps, ctx: Ctx, applicationId: string, input: { override?: { justification?: string } } = {}) {
  requireRole(ctx.actor, 'coordinator');

  return withTx(deps.pool, async (c) => {
    const head = (await c.query('SELECT opportunity_id FROM application WHERE application_id=$1', [applicationId])).rows[0];
    if (!head) throw E.notFound();

    // Lock order (documented in architecture update): opportunity row first, then application row.
    const opp = (await c.query('SELECT * FROM opportunity WHERE opportunity_id=$1 FOR UPDATE', [head.opportunity_id])).rows[0];
    const app = (await c.query('SELECT * FROM application WHERE application_id=$1 FOR UPDATE', [applicationId])).rows[0];

    if (app.workflow_state !== 'READY_FOR_NOMINATION') {
      throw E.notNominatable(`Application is ${app.workflow_state}; it must be READY_FOR_NOMINATION (eligible, triaged and academically approved)`);
    }
    assertApplicationTransition(app.workflow_state, 'NOMINATED');

    const places = Number((await c.query(
      'SELECT places FROM requirement_version WHERE opportunity_id=$1 AND version_no=$2', [opp.opportunity_id, opp.current_version_no])).rows[0].places);
    const active = Number((await c.query(
      `SELECT count(*) FROM nomination WHERE opportunity_id=$1 AND status IN ('AWAITING_HOST_DECISION','ADMITTED','ACCEPTED')`, [opp.opportunity_id])).rows[0].count);

    let overrideJustification: string | null = null;
    if (active >= places) {
      if (!input.override) throw E.quotaExceeded();
      if (!ctx.actor.permissions.includes('nomination.override')) throw E.overrideNotPermitted();
      if (!input.override.justification?.trim()) throw E.validation('override.justification is mandatory');
      overrideJustification = input.override.justification.trim();
    }

    const nominationId = `NOM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    await c.query(
      `INSERT INTO nomination(nomination_id,application_id,opportunity_id,status,override_justification,override_by)
       VALUES ($1,$2,$3,'AWAITING_HOST_DECISION',$4,$5)`,
      [nominationId, applicationId, opp.opportunity_id, overrideJustification, overrideJustification ? ctx.actor.subject : null]);
    await c.query(`UPDATE application SET workflow_state='NOMINATED', row_version=row_version+1 WHERE application_id=$1`, [applicationId]);
    await appendAudit(c, { applicationId, targetType: 'nomination', targetId: nominationId, actor: ctx.actor.subject, action: 'nomination.created',
      beforeAfter: { places, activeBefore: active, override: !!overrideJustification }, reason: overrideJustification, correlationId: ctx.correlationId });
    await appendOutbox(c, 'NominationCreated', { to: app.student_subject, template: 'nominated-not-admitted', applicationId, nominationId });
    return { nominationId, status: 'AWAITING_HOST_DECISION', override: !!overrideJustification };
  });
}

/** Host decision (recorded by the coordinator from the partner's answer). REFUSED releases the place (CL-014). */
export async function recordHostDecision(deps: Deps, ctx: Ctx, nominationId: string, input: { outcome: 'ADMITTED' | 'REFUSED' }) {
  requireRole(ctx.actor, 'coordinator');
  if (input.outcome !== 'ADMITTED' && input.outcome !== 'REFUSED') throw E.validation('outcome must be ADMITTED or REFUSED');

  return withTx(deps.pool, async (c) => {
    const nom = (await c.query('SELECT * FROM nomination WHERE nomination_id=$1 FOR UPDATE', [nominationId])).rows[0];
    if (!nom) throw E.notFound();
    assertNominationTransition(nom.status, input.outcome);

    const expires = input.outcome === 'ADMITTED'
      ? new Date(deps.clock().getTime() + deps.config.offerWindowDays * 86_400_000).toISOString()
      : null;
    await c.query('UPDATE nomination SET status=$2, offer_expires_at=$3 WHERE nomination_id=$1', [nominationId, input.outcome, expires]);
    await c.query('INSERT INTO host_decision(nomination_id,outcome,recorded_by) VALUES ($1,$2,$3)', [nominationId, input.outcome, ctx.actor.subject]);
    const app = (await c.query('SELECT student_subject FROM application WHERE application_id=$1', [nom.application_id])).rows[0];
    await appendAudit(c, { applicationId: nom.application_id, targetType: 'nomination', targetId: nominationId, actor: ctx.actor.subject,
      action: `host_decision.${input.outcome.toLowerCase()}`, beforeAfter: { from: nom.status, to: input.outcome, offerExpiresAt: expires }, correlationId: ctx.correlationId });
    await appendOutbox(c, 'HostDecisionRecorded', { to: app.student_subject, template: input.outcome === 'ADMITTED' ? 'admitted-by-host' : 'not-admitted-by-host', nominationId });
    return { nominationId, status: input.outcome, offerExpiresAt: expires };
  });
}
