import type { Pool, PoolClient } from 'pg';

/** One transaction: business change + audit + outbox commit or roll back together (E2-ADR-006/007). */
export async function withTx<T>(pool: Pool, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const result = await fn(c);
    await c.query('COMMIT');
    return result;
  } catch (err) {
    try { await c.query('ROLLBACK'); } catch { /* connection already broken */ }
    throw err;
  } finally {
    c.release();
  }
}

export interface AuditInput {
  applicationId?: string | null;
  targetType: string;
  targetId: string;
  actor: string;
  action: string;
  beforeAfter?: unknown;
  reason?: string | null;
  correlationId: string;
}

export async function appendAudit(c: PoolClient, a: AuditInput): Promise<void> {
  await c.query(
    `INSERT INTO audit_event(application_id,target_type,target_id,actor_subject,action,before_after,reason,correlation_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [a.applicationId ?? null, a.targetType, a.targetId, a.actor, a.action,
     a.beforeAfter === undefined ? null : JSON.stringify(a.beforeAfter), a.reason ?? null, a.correlationId],
  );
}

/** Payloads carry no document contents and no raw academic values. */
export async function appendOutbox(c: PoolClient, eventType: string, payload: Record<string, unknown>): Promise<void> {
  await c.query('INSERT INTO outbox_event(event_type,payload) VALUES ($1,$2)', [eventType, JSON.stringify(payload)]);
}
