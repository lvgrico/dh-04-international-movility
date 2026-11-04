import type { PoolClient, Pool } from 'pg';
import { E } from '../domain/errors';
import type { Actor, Role } from '../domain/types';

/** Default deny (BR-14): every use case calls one of these before touching state. */
export function requireRole(actor: Actor, ...roles: Role[]): void {
  if (!roles.includes(actor.role)) throw E.forbidden(`Role ${actor.role} cannot perform this action`);
}

export async function adviserAssigned(db: Pool | PoolClient, subject: string, opportunityId: string): Promise<boolean> {
  const r = await db.query('SELECT 1 FROM adviser_assignment WHERE subject=$1 AND opportunity_id=$2', [subject, opportunityId]);
  return r.rowCount === 1;
}

/**
 * Read access to one application, by role and relationship (scope):
 * student -> own only (others get 404: existence is concealed),
 * adviser -> assigned opportunities, coordinator -> all, academic coordinator -> own programme.
 */
export async function assertCanRead(db: Pool | PoolClient, actor: Actor, app: { student_subject: string; opportunity_id: string; programme: string | null }): Promise<void> {
  switch (actor.role) {
    case 'student':
      if (app.student_subject !== actor.subject) throw E.notFound();
      return;
    case 'coordinator':
      return;
    case 'adviser':
      if (await adviserAssigned(db, actor.subject, app.opportunity_id)) return;
      throw E.forbidden('Application is outside your assigned opportunities');
    case 'academic_coordinator':
      if (app.programme && app.programme === actor.programme) return;
      throw E.forbidden('Application is outside your programme');
    default:
      throw E.forbidden();
  }
}
