import type { Pool } from 'pg';
import type { AcademicRecordPort, NotificationPort } from '../domain/ports';

export interface Deps {
  pool: Pool;
  sis: AcademicRecordPort;
  notifier: NotificationPort;
  clock: () => Date;
  config: { offerWindowDays: number; sisTimeoutMs: number };
}
