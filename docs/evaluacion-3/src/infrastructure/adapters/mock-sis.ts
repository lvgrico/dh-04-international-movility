import { DependencyUnavailable } from '../../domain/errors';
import type { AcademicRecordPort } from '../../domain/ports';
import type { AcademicRecord } from '../../domain/types';

export type SisMode = 'ok' | 'down' | 'malformed';

const FIXTURES: Record<string, { gpa: number; completedCredits: number; enrolled: boolean; programme: string }> = {
  'stu-0001': { gpa: 3.8, completedCredits: 96, enrolled: true, programme: 'ENG' },
  'stu-0002': { gpa: 3.5, completedCredits: 88, enrolled: true, programme: 'ENG' },
  'stu-0003': { gpa: 3.2, completedCredits: 72, enrolled: true, programme: 'BUS' },
  'stu-0004': { gpa: 2.4, completedCredits: 80, enrolled: true, programme: 'ENG' },
};

/** Simulated SIS (constraint: integration may be simulated). Supports outage and malformed-payload modes. */
export class MockSis implements AcademicRecordPort {
  mode: SisMode = 'ok';
  delayMs = 0;
  calls = 0;

  async getAcademicRecord(subject: string): Promise<AcademicRecord> {
    this.calls++;
    if (this.delayMs) await new Promise((r) => setTimeout(r, this.delayMs));
    if (this.mode === 'down') throw new DependencyUnavailable('SIS unavailable');
    const f = FIXTURES[subject];
    const raw: any = f
      ? { subject, ...f, recordVersion: 'SIS-SIM-0001', asOf: new Date().toISOString() }
      : null;
    if (this.mode === 'malformed') return { ...raw, gpa: 'n/a' } as any;
    return validate(subject, raw);
  }
}

/** Adapter-side schema validation (architecture §8.4): bad payloads count as "unavailable", not as data. */
function validate(subject: string, raw: any): AcademicRecord {
  if (!raw) throw new DependencyUnavailable(`SIS has no record for ${subject}`);
  if (typeof raw.gpa !== 'number' || raw.gpa < 0 || raw.gpa > 4.5) throw new DependencyUnavailable('SIS payload invalid: gpa');
  if (!Number.isInteger(raw.completedCredits) || raw.completedCredits < 0) throw new DependencyUnavailable('SIS payload invalid: credits');
  return raw as AcademicRecord;
}

/** Wrap malformed mode through the same validator so the adapter contract is honoured. */
export class ValidatingSis implements AcademicRecordPort {
  constructor(private readonly inner: MockSis) {}
  async getAcademicRecord(subject: string): Promise<AcademicRecord> {
    const r: any = await this.inner.getAcademicRecord(subject);
    return validate(subject, r);
  }
}
