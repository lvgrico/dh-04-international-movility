import { appendAudit, appendOutbox, withTx } from '../infrastructure/db/unit-of-work';
import type { Deps } from './deps';

/**
 * Worker job (E2-ADR-011, QS-09): an ADMITTED offer whose window has ended becomes OFFER_EXPIRED, which releases
 * its place (CL-014). SKIP LOCKED makes concurrent workers and a concurrent acceptance safe: whoever holds the
 * nomination row decides; the other sees the new status.
 */
export async function expireOffers(deps: Deps): Promise<number> {
  return withTx(deps.pool, async (c) => {
    const due = (await c.query(
      `SELECT n.nomination_id, n.application_id, a.student_subject
         FROM nomination n JOIN application a ON a.application_id=n.application_id
        WHERE n.status='ADMITTED' AND n.offer_expires_at <= $1::timestamptz
        ORDER BY n.nomination_id FOR UPDATE OF n SKIP LOCKED`, [deps.clock().toISOString()])).rows;
    for (const n of due) {
      await c.query(`UPDATE nomination SET status='OFFER_EXPIRED' WHERE nomination_id=$1`, [n.nomination_id]);
      await appendAudit(c, { applicationId: n.application_id, targetType: 'nomination', targetId: n.nomination_id, actor: 'system',
        action: 'offer.expired', beforeAfter: { from: 'ADMITTED', to: 'OFFER_EXPIRED' }, correlationId: 'worker-expiry' });
      await appendOutbox(c, 'OfferExpired', { to: n.student_subject, template: 'offer-expired', nominationId: n.nomination_id });
    }
    return due.length;
  });
}
