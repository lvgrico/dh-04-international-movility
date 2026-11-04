import type { AcademicRecord } from './types';

/** E2-ADR-005: the SIS is read-only and authoritative. Throws DependencyUnavailable when it cannot answer. */
export interface AcademicRecordPort {
  getAcademicRecord(subject: string): Promise<AcademicRecord>;
}

/** E2-ADR-007: delivery adapter used only by the worker, never inside a request transaction. */
export interface NotificationPort {
  send(message: { to: string; template: string; payload: Record<string, unknown> }): Promise<void>;
}
