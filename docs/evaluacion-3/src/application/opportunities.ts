import { createHash } from 'node:crypto';
import { E } from '../domain/errors';
import type { Ctx } from '../domain/types';
import { appendAudit, withTx } from '../infrastructure/db/unit-of-work';
import { requireRole } from './authz';
import type { Deps } from './deps';

export interface PublishInput {
  opportunityId?: string; destination: string; term: string; places: number;
  minGpa: number; minCredits: number; opensOn: string; closesOn: string; horizonDeadline: string;
}

export async function publishOpportunity(deps: Deps, ctx: Ctx, input: PublishInput) {
  requireRole(ctx.actor, 'coordinator');
  const bad = [
    !input.destination && 'destination', !input.term && 'term',
    !(Number.isInteger(input.places) && input.places >= 0) && 'places',
    !(input.minGpa >= 0 && input.minGpa <= 4) && 'minGpa',
    !(Number.isInteger(input.minCredits) && input.minCredits >= 0) && 'minCredits',
    !/^\d{4}-\d{2}-\d{2}$/.test(input.opensOn ?? '') && 'opensOn',
    !/^\d{4}-\d{2}-\d{2}$/.test(input.closesOn ?? '') && 'closesOn',
    !/^\d{4}-\d{2}-\d{2}$/.test(input.horizonDeadline ?? '') && 'horizonDeadline',
  ].filter(Boolean);
  if (bad.length) throw E.validation(`Invalid fields: ${bad.join(', ')}`);
  if (input.closesOn < input.opensOn) throw E.validation('closesOn must not precede opensOn');

  const id = input.opportunityId ?? `OPP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  // Material part fingerprint (ADR-001). Places/deadline are non-material and excluded.
  const fingerprint = createHash('sha256')
    .update(JSON.stringify({ g: input.minGpa, c: input.minCredits, d: input.term, p: [input.opensOn, input.closesOn] }))
    .digest('hex');

  await withTx(deps.pool, async (c) => {
    const dup = await c.query('SELECT 1 FROM opportunity WHERE opportunity_id=$1', [id]);
    if (dup.rowCount) throw E.validation(`Opportunity ${id} already exists`);
    await c.query('INSERT INTO opportunity(opportunity_id,destination,term) VALUES ($1,$2,$3)', [id, input.destination, input.term]);
    await c.query(
      `INSERT INTO requirement_version(opportunity_id,version_no,min_gpa,min_credits,places,horizon_deadline,material_fingerprint)
       VALUES ($1,1,$2,$3,$4,$5,$6)`,
      [id, input.minGpa, input.minCredits, input.places, input.horizonDeadline, fingerprint],
    );
    await c.query('INSERT INTO application_period(opportunity_id,period_no,opens_on,closes_on) VALUES ($1,1,$2,$3)', [id, input.opensOn, input.closesOn]);
    await appendAudit(c, { targetType: 'opportunity', targetId: id, actor: ctx.actor.subject, action: 'opportunity.published',
      beforeAfter: { version: 1, places: input.places }, correlationId: ctx.correlationId });
  });
  return { opportunityId: id, versionNo: 1, periodNo: 1 };
}

export async function listOpportunities(deps: Deps) {
  const r = await deps.pool.query(
    `SELECT o.opportunity_id AS "opportunityId", o.destination, o.term, v.places,
            p.opens_on::text AS "opensOn", p.closes_on::text AS "closesOn"
       FROM opportunity o
       JOIN requirement_version v ON v.opportunity_id=o.opportunity_id AND v.version_no=o.current_version_no
       JOIN application_period p ON p.opportunity_id=o.opportunity_id
        AND p.period_no=(SELECT max(period_no) FROM application_period WHERE opportunity_id=o.opportunity_id)
      ORDER BY o.opportunity_id`);
  return r.rows;
}

/** Read-only utilisation: places vs ACTIVE nominations (same definition as the nomination guard). */
export async function placesUtilisation(deps: Deps, ctx: Ctx, opportunityId: string) {
  requireRole(ctx.actor, 'coordinator', 'adviser', 'it');
  const r = await deps.pool.query(
    `SELECT v.places,
            (SELECT count(*)::int FROM nomination n WHERE n.opportunity_id=o.opportunity_id
               AND n.status IN ('AWAITING_HOST_DECISION','ADMITTED','ACCEPTED')) AS "activeNominations"
       FROM opportunity o JOIN requirement_version v ON v.opportunity_id=o.opportunity_id AND v.version_no=o.current_version_no
      WHERE o.opportunity_id=$1`, [opportunityId]);
  if (!r.rowCount) throw E.notFound();
  return { opportunityId, ...r.rows[0] };
}
