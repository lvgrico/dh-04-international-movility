import { DependencyUnavailable } from '../domain/errors';
import { evaluateEligibility } from '../domain/eligibility';
import { appendAudit, appendOutbox, withTx } from '../infrastructure/db/unit-of-work';
import type { Deps } from './deps';

const RETRY_SECONDS = 5;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new DependencyUnavailable('SIS timeout')), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

/**
 * E2-ADR-005 / V-SEQ-01: the submission is already committed. Here we ask the SIS; if it cannot answer,
 * the check stays PENDING_VALIDATION and the worker retries. Raw GPA/credits are never stored.
 */
export async function evaluateCheck(deps: Deps, checkId: number, correlationId: string): Promise<'DONE' | 'PENDING'> {
  const q = await deps.pool.query(
    `SELECT e.check_id, e.outcome, a.application_id, a.student_subject, v.min_gpa::float AS min_gpa, v.min_credits
       FROM eligibility_check e
       JOIN application a ON a.application_id=e.application_id
       JOIN requirement_version v ON v.opportunity_id=a.opportunity_id AND v.version_no=a.pinned_version_no
      WHERE e.check_id=$1`, [checkId]);
  const row = q.rows[0];
  if (!row || row.outcome !== 'PENDING_VALIDATION') return 'DONE';

  let record;
  try {
    record = await withTimeout(deps.sis.getAcademicRecord(row.student_subject), deps.config.sisTimeoutMs);
  } catch (e) {
    if (!(e instanceof DependencyUnavailable)) throw e;
    await deps.pool.query(
      `UPDATE eligibility_check SET attempt_count=attempt_count+1, next_attempt_at=$2::timestamptz + make_interval(secs => $3) WHERE check_id=$1`,
      [checkId, deps.clock().toISOString(), RETRY_SECONDS]);
    return 'PENDING';
  }

  const { outcome, criteria } = evaluateEligibility(record, { minGpa: row.min_gpa, minCredits: row.min_credits });
  await withTx(deps.pool, async (c) => {
    // Guard makes the update idempotent if the request path and the worker race.
    const upd = await c.query(
      `UPDATE eligibility_check SET outcome=$2, criteria_results=$3, sis_reference=$4, checked_at=$5
        WHERE check_id=$1 AND outcome='PENDING_VALIDATION'`,
      [checkId, outcome, JSON.stringify(criteria), record.recordVersion, deps.clock().toISOString()]);
    if (!upd.rowCount) return;
    await c.query('UPDATE application SET programme=$2 WHERE application_id=$1', [row.application_id, record.programme]);
    await appendAudit(c, { applicationId: row.application_id, targetType: 'eligibility_check', targetId: String(checkId),
      actor: 'system', action: 'eligibility.checked', beforeAfter: { outcome, criteria, sisReference: record.recordVersion },
      correlationId });
    await appendOutbox(c, 'EligibilityChecked', { to: row.student_subject, template: 'eligibility-checked', applicationId: row.application_id, outcome });
  });
  return 'DONE';
}

/** Worker job: retry every check still waiting for the SIS (QS-03). `force` ignores the retry schedule. */
export async function retryPendingEligibility(deps: Deps, opts: { force?: boolean } = {}): Promise<number> {
  const r = await deps.pool.query(
    `SELECT check_id FROM eligibility_check
      WHERE outcome='PENDING_VALIDATION' AND ($1::boolean OR next_attempt_at <= $2::timestamptz)
      ORDER BY check_id LIMIT 50`, [opts.force ?? false, deps.clock().toISOString()]);
  let done = 0;
  for (const row of r.rows) {
    if ((await evaluateCheck(deps, Number(row.check_id), 'worker-retry')) === 'DONE') done++;
  }
  return done;
}
