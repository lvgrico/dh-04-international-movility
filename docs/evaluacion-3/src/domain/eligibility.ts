import type { AcademicRecord } from './types';

export interface RequirementSnapshot {
  minGpa: number;
  minCredits: number;
}

export type CriteriaResults = Record<string, 'PASS' | 'FAIL'>;

/**
 * Pure rule (E2-ADR-005). Output holds only pass/fail per criterion:
 * raw GPA / credits are used in memory and never returned for storage (CL-017).
 */
export function evaluateEligibility(
  record: AcademicRecord,
  req: RequirementSnapshot,
): { outcome: 'ELIGIBLE' | 'INELIGIBLE'; criteria: CriteriaResults } {
  const criteria: CriteriaResults = {
    enrolled: record.enrolled ? 'PASS' : 'FAIL',
    minGpa: record.gpa >= req.minGpa ? 'PASS' : 'FAIL',
    minCredits: record.completedCredits >= req.minCredits ? 'PASS' : 'FAIL',
  };
  const outcome = Object.values(criteria).every((v) => v === 'PASS') ? 'ELIGIBLE' : 'INELIGIBLE';
  return { outcome, criteria };
}
