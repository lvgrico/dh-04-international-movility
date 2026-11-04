import { DependencyUnavailable } from '../domain/errors';
import { withTx } from '../infrastructure/db/unit-of-work';
import type { Deps } from './deps';

const MAX_ATTEMPTS = 5;

/**
 * E2-ADR-007 (simplified): rows are claimed with FOR UPDATE SKIP LOCKED, which acts as the lease.
 * A notifier failure never touches business state: the event goes to RETRY_WAIT, then DEAD_LETTER (QS-07).
 * `force` ignores the backoff schedule (used by tests and the demo).
 */
export async function processOutbox(deps: Deps, opts: { force?: boolean } = {}): Promise<{ delivered: number; failed: number }> {
  return withTx(deps.pool, async (c) => {
    const rows = (await c.query(
      `SELECT event_id, event_type, payload, attempt_count FROM outbox_event
        WHERE state IN ('PENDING','RETRY_WAIT') AND ($1::boolean OR next_attempt_at <= $2::timestamptz)
        ORDER BY event_id LIMIT 50 FOR UPDATE SKIP LOCKED`, [opts.force ?? false, deps.clock().toISOString()])).rows;
    let delivered = 0, failed = 0;
    for (const r of rows) {
      try {
        await deps.notifier.send({ to: r.payload.to, template: r.payload.template, payload: r.payload });
        await c.query(`UPDATE outbox_event SET state='DELIVERED', attempt_count=attempt_count+1 WHERE event_id=$1`, [r.event_id]);
        delivered++;
      } catch (e) {
        if (!(e instanceof DependencyUnavailable)) throw e;
        const attempts = r.attempt_count + 1;
        await c.query(
          `UPDATE outbox_event SET state=$2, attempt_count=$3, next_attempt_at=$4::timestamptz + make_interval(secs => $5) WHERE event_id=$1`,
          [r.event_id, attempts >= MAX_ATTEMPTS ? 'DEAD_LETTER' : 'RETRY_WAIT', attempts, deps.clock().toISOString(), 5 * 2 ** attempts]);
        failed++;
      }
    }
    return { delivered, failed };
  });
}
