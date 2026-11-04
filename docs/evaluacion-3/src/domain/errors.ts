// Defined error vocabulary (architecture-and-design.md §8.3). No HTTP/SQL imports here.
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly title: string,
    public readonly detail?: string,
  ) {
    super(`${code}: ${title}`);
  }
}

export const E = {
  unauthenticated: () => new AppError(401, 'SESSION_INVALID', 'Authentication required'),
  forbidden: (detail?: string) => new AppError(403, 'ACTION_FORBIDDEN', 'Action not permitted for this user', detail),
  overrideNotPermitted: () =>
    new AppError(403, 'OVERRIDE_NOT_PERMITTED', 'This user cannot override the quota', 'Requires permission nomination.override'),
  notFound: () => new AppError(404, 'RESOURCE_NOT_FOUND', 'Resource not found'),
  quotaExceeded: () =>
    new AppError(409, 'QUOTA_EXCEEDED', 'No places are available for this opportunity',
      'An authorized override with a written justification is required. No nomination was created.'),
  notNominatable: (detail: string) => new AppError(409, 'NOT_NOMINATABLE', 'Application cannot be nominated', detail),
  invalidState: (detail: string) => new AppError(409, 'INVALID_STATE', 'Illegal state transition', detail),
  eligibilityNotConfirmed: () =>
    new AppError(409, 'ELIGIBILITY_NOT_CONFIRMED', 'Eligibility has not been confirmed as ELIGIBLE',
      'The application cannot advance past triage (CL-015).'),
  termAlreadyAccepted: () =>
    new AppError(409, 'TERM_ALREADY_ACCEPTED', 'The student already accepted a mobility in this term'),
  offerExpired: () => new AppError(409, 'OFFER_EXPIRED', 'The acceptance window has closed'),
  periodClosed: () => new AppError(409, 'PERIOD_CLOSED', 'No application period is open for this opportunity'),
  validation: (detail: string) => new AppError(422, 'VALIDATION_FAILED', 'Validation failed', detail),
  dependencyUnavailable: (detail?: string) => new AppError(503, 'DEPENDENCY_UNAVAILABLE', 'A dependency is unavailable', detail),
};

/** Thrown by ports (SIS, notifier) when the external system cannot answer. */
export class DependencyUnavailable extends Error {}
