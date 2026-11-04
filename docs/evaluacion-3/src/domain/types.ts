export type Role = 'student' | 'adviser' | 'coordinator' | 'academic_coordinator' | 'it';

export interface Actor {
  subject: string;
  role: Role;
  programme: string | null;
  permissions: string[];
}

export interface Ctx {
  actor: Actor;
  correlationId: string;
}

export type WorkflowState =
  | 'DRAFT' | 'SUBMITTED' | 'CORRECTION_REQUESTED' | 'IN_ACADEMIC_REVIEW'
  | 'READY_FOR_NOMINATION' | 'NOMINATED' | 'REJECTED' | 'WITHDRAWN' | 'RETURNED_FOR_REAPPLICATION';

export type NominationStatus =
  | 'AWAITING_HOST_DECISION' | 'ADMITTED' | 'ACCEPTED' | 'DECLINED' | 'OFFER_EXPIRED' | 'REFUSED' | 'REVOKED';

/** What the SIS port returns. IMAMS never persists gpa/completedCredits (BR-06, CL-017). */
export interface AcademicRecord {
  subject: string;
  gpa: number;
  completedCredits: number;
  enrolled: boolean;
  programme: string;
  recordVersion: string;
  asOf: string;
}
