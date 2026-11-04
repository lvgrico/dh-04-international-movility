import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { evaluateEligibility } from '../src/domain/eligibility';
import { assertApplicationTransition, nominationLabel } from '../src/domain/states';

const rec = { subject: 's', gpa: 3.5, completedCredits: 80, enrolled: true, programme: 'ENG', recordVersion: 'v', asOf: '' };

describe('domain rules (pure, no database)', () => {
  it('T-ELIG-01 eligible when every criterion passes; result holds pass/fail only', () => {
    const r = evaluateEligibility(rec, { minGpa: 3.0, minCredits: 60 });
    assert.equal(r.outcome, 'ELIGIBLE');
    assert.deepEqual(r.criteria, { enrolled: 'PASS', minGpa: 'PASS', minCredits: 'PASS' });
    assert.ok(!JSON.stringify(r).includes('3.5'), 'raw GPA must not appear in the stored result (CL-017)');
  });
  it('T-ELIG-02 ineligible names the failing criterion', () => {
    const r = evaluateEligibility({ ...rec, gpa: 2.4 }, { minGpa: 3.0, minCredits: 60 });
    assert.equal(r.outcome, 'INELIGIBLE');
    assert.equal(r.criteria.minGpa, 'FAIL');
    assert.equal(r.criteria.minCredits, 'PASS');
  });
  it('T-STATE-01 illegal application transitions are rejected', () => {
    assert.throws(() => assertApplicationTransition('DRAFT', 'NOMINATED'), /INVALID_STATE/);
    assert.throws(() => assertApplicationTransition('SUBMITTED', 'NOMINATED'), /INVALID_STATE/);
    assert.doesNotThrow(() => assertApplicationTransition('READY_FOR_NOMINATION', 'NOMINATED'));
  });
  it('T-STAT-01 "nominated" is never labelled as "admitted" (BR-03)', () => {
    assert.match(nominationLabel('AWAITING_HOST_DECISION')!, /not yet admitted/);
    assert.doesNotMatch(nominationLabel('AWAITING_HOST_DECISION')!, /^Admitted/);
    assert.match(nominationLabel('ADMITTED')!, /Admitted by host university/);
  });
});

describe('architecture conformance', () => {
  it('T-ARCH-01 domain imports nothing from HTTP, SQL or providers (design §5.4)', () => {
    const dir = path.resolve(import.meta.dirname, '../src/domain');
    const forbidden = /from\s+['"](pg|express|\.\.\/(http|infrastructure|application))/;
    for (const f of readdirSync(dir)) {
      assert.doesNotMatch(readFileSync(path.join(dir, f), 'utf8'), forbidden, `${f} violates the layering`);
    }
  });
  it('T-ARCH-02 application layer never imports the HTTP layer', () => {
    const dir = path.resolve(import.meta.dirname, '../src/application');
    for (const f of readdirSync(dir)) {
      assert.doesNotMatch(readFileSync(path.join(dir, f), 'utf8'), /from\s+['"]\.\.\/http/, `${f} imports HTTP`);
    }
  });
});
