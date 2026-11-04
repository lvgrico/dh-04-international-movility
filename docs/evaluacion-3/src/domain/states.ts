import { E } from './errors';
import type { NominationStatus, WorkflowState } from './types';

/** BR-04 / CL-014: only these nomination statuses occupy a place. */
export const ACTIVE_NOMINATION: NominationStatus[] = ['AWAITING_HOST_DECISION', 'ADMITTED', 'ACCEPTED'];

/** Application states that a single-acceptance cascade may withdraw (V-STATE-APP). */
export const WITHDRAWABLE_APPLICATION_STATES: WorkflowState[] = [
  'SUBMITTED', 'CORRECTION_REQUESTED', 'IN_ACADEMIC_REVIEW', 'READY_FOR_NOMINATION', 'NOMINATED',
];

/** Transitions implemented in increment 1 (subset of V-STATE-APP). */
const APPLICATION_TRANSITIONS: Record<string, WorkflowState[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['IN_ACADEMIC_REVIEW', 'REJECTED', 'WITHDRAWN'],
  IN_ACADEMIC_REVIEW: ['READY_FOR_NOMINATION', 'REJECTED', 'WITHDRAWN'],
  READY_FOR_NOMINATION: ['NOMINATED', 'WITHDRAWN'],
  NOMINATED: ['WITHDRAWN'],
};

export function assertApplicationTransition(from: WorkflowState, to: WorkflowState): void {
  if (!APPLICATION_TRANSITIONS[from]?.includes(to)) {
    throw E.invalidState(`Application cannot move from ${from} to ${to}`);
  }
}

const NOMINATION_TRANSITIONS: Record<string, NominationStatus[]> = {
  AWAITING_HOST_DECISION: ['ADMITTED', 'REFUSED', 'REVOKED'],
  ADMITTED: ['ACCEPTED', 'DECLINED', 'OFFER_EXPIRED', 'REVOKED'],
};

export function assertNominationTransition(from: NominationStatus, to: NominationStatus): void {
  if (!NOMINATION_TRANSITIONS[from]?.includes(to)) {
    throw E.invalidState(`Nomination cannot move from ${from} to ${to}`);
  }
}

/** Distinct student-facing labels (E2-ADR-004): "nominated" is never shown as "admitted". */
export function nominationLabel(status: NominationStatus | null): string | null {
  switch (status) {
    case null: return null;
    case 'AWAITING_HOST_DECISION': return 'Nominated by Horizon - not yet admitted';
    case 'ADMITTED': return 'Admitted by host university - awaiting your acceptance';
    case 'ACCEPTED': return 'Accepted by you';
    case 'REFUSED': return 'Not admitted by host university';
    case 'DECLINED': return 'You declined the offer';
    case 'OFFER_EXPIRED': return 'Offer expired';
    case 'REVOKED': return 'Nomination revoked';
  }
}
