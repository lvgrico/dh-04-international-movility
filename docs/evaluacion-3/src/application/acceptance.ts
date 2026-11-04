import { E } from '../domain/errors';
import { WITHDRAWABLE_APPLICATION_STATES } from '../domain/states';
import type { Ctx } from '../domain/types';
import { appendAudit, appendOutbox, withTx } from '../infrastructure/db/unit-of-work';
import { requireRole } from './authz';
import type { Deps } from './deps';

/**
 * E2-ADR-011 / QS-08 / BR-16. The unique partial index on mobility_acceptance(student, term) is the guard.
 *
 * LOCK ORDER (identified while implementing; see docs/architecture-update.md):
 *   1. insert the acceptance row FIRST (blocks/fails on the unique index),
 *   2. only then lock the nomination, then the student's other application rows.
 * Locking the nomination before the insert creates a deadlock when two offers of the same student are accepted
 * at once (each cascade needs the other's nomination row). Acceptance never takes an opportunity row.
 */
export async function acceptOffer(deps: Deps, ctx: Ctx, nominationId: string) {
  requireRole(ctx.actor, 'student');

  const result = await withTx(deps.pool, async (c) => {
    const head = (await c.query(
      `SELECT n.nomination_id, n.status, n.offer_expires_at, n.application_id, a.student_subject, o.term
         FROM nomination n JOIN application a ON a.application_id=n.application_id
         JOIN opportunity o ON o.opportunity_id=n.opportunity_id
        WHERE n.nomination_id=$1`, [nominationId])).rows[0];
    if (!head || head.student_subject !== ctx.actor.subject) throw E.notFound();
    if (head.status !== 'ADMITTED') {
      // If the offer is gone because this student ALREADY accepted another one this term (cascade revoked it),
      // the contract answer is TERM_ALREADY_ACCEPTED, not a generic INVALID_STATE.
      if (head.status !== 'ACCEPTED') {
        const done = await c.query(
          `SELECT 1 FROM mobility_acceptance WHERE student_subject=$1 AND term=$2 AND status='ACTIVE'`, [head.student_subject, head.term]);
        if (done.rowCount) throw E.termAlreadyAccepted();
      }
      throw E.invalidState(`Only an ADMITTED offer can be accepted (current: ${head.status})`);
    }

    // QS-09: the SERVER clock decides. An expired offer releases its place and is reported as OFFER_EXPIRED.
    if (head.offer_expires_at && new Date(head.offer_expires_at).getTime() <= deps.clock().getTime()) {
      const upd = await c.query(`UPDATE nomination SET status='OFFER_EXPIRED' WHERE nomination_id=$1 AND status='ADMITTED'`, [nominationId]);
      if (upd.rowCount) {
        await appendAudit(c, { applicationId: head.application_id, targetType: 'nomination', targetId: nominationId, actor: 'system',
          action: 'offer.expired', beforeAfter: { from: 'ADMITTED', to: 'OFFER_EXPIRED' }, correlationId: ctx.correlationId });
      }
      return { expired: true as const };
    }

    // 1. the guard
    const acceptanceId = `ACC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    try {
      await c.query(
        `INSERT INTO mobility_acceptance(acceptance_id,nomination_id,student_subject,term,status) VALUES ($1,$2,$3,$4,'ACTIVE')`,
        [acceptanceId, nominationId, head.student_subject, head.term]);
    } catch (e: any) {
      if (e.code === '23505') throw E.termAlreadyAccepted();
      throw e;
    }

    // 2. now lock and re-check the nomination
    const nom = (await c.query('SELECT status FROM nomination WHERE nomination_id=$1 FOR UPDATE', [nominationId])).rows[0];
    if (nom.status !== 'ADMITTED') throw E.invalidState(`Offer is no longer open (current: ${nom.status})`);

    // 3. cascade: withdraw the student's other active applications of the same term, release their places
    const others = (await c.query(
      `SELECT a.application_id, a.workflow_state FROM application a JOIN opportunity o ON o.opportunity_id=a.opportunity_id
        WHERE a.student_subject=$1 AND o.term=$2 AND a.application_id<>$3 AND a.workflow_state = ANY($4)
        ORDER BY a.application_id FOR UPDATE OF a`,
      [head.student_subject, head.term, head.application_id, WITHDRAWABLE_APPLICATION_STATES])).rows;

    const withdrawn: string[] = [];
    for (const o of others) {
      await c.query(`UPDATE application SET workflow_state='WITHDRAWN', withdrawn_reason='ACCEPTED_ANOTHER', row_version=row_version+1 WHERE application_id=$1`, [o.application_id]);
      await appendAudit(c, { applicationId: o.application_id, targetType: 'application', targetId: o.application_id, actor: 'system',
        action: 'application.withdrawn', beforeAfter: { from: o.workflow_state, to: 'WITHDRAWN' }, reason: 'ACCEPTED_ANOTHER', correlationId: ctx.correlationId });
      const revoked = (await c.query(
        `UPDATE nomination SET status='REVOKED' WHERE application_id=$1 AND status IN ('AWAITING_HOST_DECISION','ADMITTED','ACCEPTED') RETURNING nomination_id`,
        [o.application_id])).rows;
      for (const r of revoked) {
        await appendAudit(c, { applicationId: o.application_id, targetType: 'nomination', targetId: r.nomination_id, actor: 'system',
          action: 'nomination.revoked', beforeAfter: { to: 'REVOKED' }, reason: 'ACCEPTED_ANOTHER', correlationId: ctx.correlationId });
      }
      withdrawn.push(o.application_id);
    }

    await c.query(`UPDATE nomination SET status='ACCEPTED' WHERE nomination_id=$1`, [nominationId]);
    await appendAudit(c, { applicationId: head.application_id, targetType: 'nomination', targetId: nominationId, actor: ctx.actor.subject,
      action: 'offer.accepted', beforeAfter: { from: 'ADMITTED', to: 'ACCEPTED', term: head.term, withdrawnApplications: withdrawn }, correlationId: ctx.correlationId });
    await appendOutbox(c, 'OfferAccepted', { to: head.student_subject, template: 'offer-accepted', nominationId, withdrawnApplications: withdrawn });
    return { expired: false as const, acceptanceId, withdrawn };
  });

  if (result.expired) throw E.offerExpired();
  return { nominationId, status: 'ACCEPTED', acceptanceId: result.acceptanceId, withdrawnApplications: result.withdrawn };
}
