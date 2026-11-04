# Experiment: does the lock order in `acceptOffer` matter?

**Hypothesis (design time).** If the nomination row is locked *before* inserting the `mobility_acceptance` row,
two simultaneous acceptances by the same student deadlock, because each transaction's cascade needs the other offer's
nomination row (E2-ADR-011 only said "student/term first, then application rows").

**Method.** On 2026-11-04 the line `SELECT 1 FROM nomination WHERE nomination_id=$1 FOR UPDATE` was temporarily
inserted before the acceptance insert in `src/application/acceptance.ts`, and
`ACCEPT_TRIALS=30 node --import tsx --test --test-concurrency=1 tests/acceptance.test.ts` was run against PostgreSQL 16.

**Observed.** `T-ACC-01` failed with PostgreSQL error `deadlock detected` (code `40P01`, `deadlock.c`); the loser
request surfaced as an unexpected error instead of `409 TERM_ALREADY_ACCEPTED`.

**Action.** The temporary line was removed and the file restored byte-for-byte. The production order
(insert acceptance first -> lock nomination -> lock other application rows) passes T-ACC-01 for 50 consecutive
concurrent trials. This order is now part of the architecture documentation (E3-ADR-003) and is guarded by T-ACC-01.

**Limits.** One run of 30 trials with the wrong order was observed to fail; the exact trial index at which the
deadlock first appeared was not recorded.
