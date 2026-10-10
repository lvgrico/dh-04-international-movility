# IMAMS — Initial Test Plan and Proof-of-Concept Proposal

**Status of every test below: NOT EXECUTED** (unless the team records otherwise in `findings.md`). "Expected" is an assertion to verify, not a result. Targets are proposed values from `architecture-and-design.md` §3.

## 1. Proposed proof of concept (smallest experiment that challenges the riskiest assumptions)

**Claims to challenge:** the relational transaction + row lock protects the quota (ADR-003); a confirmed material partner change returns **all** active applications atomically and consistently with racing submissions (ADR-010); one student can accept only one mobility per term even under concurrency (ADR-011); submission survives a SIS outage (ADR-005/007); every accepted change is audited (ADR-006).

**Scenario (synthetic data only):**
1. Seed `OPP-2027-03` with **1 place**, requirement version 1 (min GPA 3.0, 60 credits); two students whose mock-SIS records are eligible; one not eligible.
2. Stop the mock SIS → student submits → expect `PENDING_VALIDATION`; restart SIS → expect automatic validation.
3. Adviser accepts documents; academic coordinator approves both eligible applications.
4. **Two coordinators nominate simultaneously** (independent DB connections, synchronized start) → one `201`, one `409`.
5. Publish a **non-material** version (more places) → nobody is returned. Then confirm a **material** change (higher GPA) with a new period → all active applications returned in one transaction, nominations revoked, places released, notices queued, drafts kept. Run submissions concurrently with the confirmation.
6. The student submits a **new** application in the new period → priority flag set for previously approved students; the new application starts empty.
7. One student with three active applications is admitted twice and **accepts both offers simultaneously** → one `201`, one `409`; other applications withdrawn.
8. Inspect audit rows for every step; attempt `UPDATE/DELETE` on audit with the application DB role.


Use the **real database** that the design relies on — an in-memory fake cannot exercise the concurrency claim. Label every branch that stays "designed but not implemented".

**Team's actual PoC status:** `[TEAM TO COMPLETE: not started / partial / done — link to prototype/README.md]`

## 2. Test catalog

### 2.1 Quota, versions, eligibility

| ID | Setup and procedure | Expected assertions | Links |
|---|---|---|---|
| T-QUO-01 | 100 fixture-isolated, coordinated races: two coordinators nominate two validated applicants for the last place; independent connections | Per trial: one 201, one 409 `QUOTA_EXCEEDED`; active nominations ≤ places; only the winner has audit/outbox rows | QS-01, SC-03, ADR-003 |
| T-QUO-02 | Nominate beyond places: (a) without permission, (b) with permission but empty justification, (c) with permission and justification | (a) 403 `OVERRIDE_NOT_PERMITTED`; (b) 422; (c) 201 with `override=true`, justification and actor in audit | US-023, R-004, CL-008 |
| T-QUO-03 | Nominate an application that is not eligible / has rejected documents / lacks academic approval; nominate the same application twice | `409 NOT_NOMINATABLE`; second active nomination rejected by unique index; no side effects | BR-02, SC-07 |
| T-QUO-04 | Refused, declined, expired, revoked, returned and withdrawn nominations; acceptance of another mobility; then nominate another applicant | Place released in every case (CL-014); next nomination succeeds; the decision used is recorded | CL-014 |
| T-VER-01 | Submit 5 applications; publish a **non-material** version (more places, text change) | Nobody returned; places read from the current version; eligibility still evaluated against the pinned version | QS-02, ADR-001 |
| T-CHG-01 | Active applications in each state (submitted, correction, review, ready, nominated, admitted, accepted) + drafts; confirm a **material** change with new period | All non-draft active applications `RETURNED_FOR_REAPPLICATION` in **one** transaction; nominations revoked; places and acceptances released; checklists cancelled; one audit per application and one for the change; drafts kept; notices queued for student, adviser, academic coordinator, coordinator | QS-02, BR-05/19 |
| T-CHG-02 | 100 coordinated races: submissions vs. change confirmation | Every submission is either returned (landed before) or pinned to the new version (landed after); none ends pinned to superseded material rules | ADR-010 |
| T-CHG-03 | Failure before COMMIT; notification failure after commit; stale ETag; material change without new period; unauthorized user | Nothing returned on failure; return stands if notices fail and they are retried; `412`, `422`, `403` as specified | QS-02, QS-07 |
| T-PRI-01 | Returned students who had reached academic approval vs. those who had not; submit new applications | New application starts **empty** (no copied data); linked to the old one; priority only for the first group; queue order reflects priority; partner view shows the flag | BR-15, CL-020 |
| T-ACC-01 | 100 coordinated races: one student accepts two offers of the same term | One `200`, one `409 TERM_ALREADY_ACCEPTED`; one active acceptance; winner-only side effects | QS-08, ADR-011 |
| T-ACC-02 | Accept one of three active applications | Others of that term `WITHDRAWN` (actor system, reason `ACCEPTED_ANOTHER`); nominations revoked; places released and re-nominable; checklist created; audit and notices | BR-16 |
| T-ACC-03 | Decline; offer expiry; accept exactly at expiry; accept vs. worker expiry race | One consistent outcome; expired/declined offer releases the place; `409 OFFER_EXPIRED` | QS-09, CL-022 |
| T-SEL-01 | Valid candidates > places; nominate selected and non-selected candidates; candidates ≤ places | Non-selected → `409 NOT_PARTNER_SELECTED`; quota still enforced; behaviour when no selection is needed follows the confirmed CL-023 | BR-18 |
| T-ELIG-01 | Table of fixtures at boundaries: GPA = min, min−0.01; credits = min, min−1; language level present/absent | Exact ELIGIBLE/NOT_ELIGIBLE per criterion; non-eligible is flagged automatically | SC-02, US-012 |

### 2.2 Lifecycle, documents, status

| ID | Setup and procedure | Expected assertions | Links |
|---|---|---|---|
| T-LIFE-01 | Attempt each illegal transition (e.g., DRAFT→NOMINATED, NOMINATED→IN_ACADEMIC_REVIEW); skip academic review | Only transitions of the state machine accepted; others `409 INVALID_STATE`; history preserved | BR-02, V-STATE-APP |
| T-LIFE-02 | Student applies to a second opportunity (formerly "destination change") | New independent application; both active; the first is unaffected unless withdrawn | BR-09 |
| T-LIFE-03 | Academic rejection, then correction and resubmission with the period open; same after the period closed | Open: accepted, eligibility/review repeated, history kept. Closed: `409 PERIOD_CLOSED` | BR-17 |
| T-DOC-01 | Upload v1, replace with v2; upload a document expiring before mobility start | v1 retained; reviewer decision linked to the exact version; expiry flag raised and correction requested | SC-05, BR-07/08 |
| T-DOC-02 | Request a file as another student; use a guessed storage key; upload oversized/disallowed type | Denied via API only; no public URL; limits enforced; hash recorded | R-005 |
| T-STAT-01 | Query status for: submitted, nominated-awaiting-host, admitted, refused | Nomination and host decision are separate objects; "admitted" never derived from nomination | SC-06, ADR-004 |
| T-UX-01 | Five-person task study using synthetic screens (QS-06) | Record actual answers; claim the target only if ≥ 4/5 answer all questions correctly | R-003 |
| T-RPT-01 | Report fixtures for pending, incomplete, delayed, at-risk, withdrawals by destination, place utilisation | Counts match fixtures; scope filtering applied. **Blocked until CL-016 defines thresholds** | SC-09 |

### 2.3 Audit, security, integrations, operations

| ID | Setup and procedure | Expected assertions | Links |
|---|---|---|---|
| T-AUD-01 | Execute each accepted mutation; inject failure before COMMIT in a nomination | Audit has actor, time, reason, before/after, correlation id; rolled-back command leaves no success record | QS-04, SC-08 |
| T-AUD-02 | With the application DB role attempt UPDATE/DELETE on audit | Denied. *(Does not cover a superuser — R-021)* | ADR-006 |
| T-SEC-01 | Negative matrix incl. a positive control: unauthenticated, wrong role, forged owner/state in body | All denied; zero protected writes; positive control succeeds | QS-05, BR-14 |
| T-SEC-02 | Student reads another student's application/documents/audit | Denied or concealed; no field leakage | AD-06 |
| T-SEC-03 | Adviser on unassigned opportunity; academic coordinator of another programme | Denied; assigned actor succeeds | ASM-006 |
| T-SEC-04 | Missing/invalid CSRF token; expired session; invalid login callback | Documented failure codes; no unintended action | ADR-009 |
| T-SEC-05 | Script/SQL-like strings and oversized inputs in free-text fields | Parameterized storage, safe output, size validation | threat model |
| T-SEC-06 | Inspect logs, errors, screenshots, config | No secrets, tokens, or document contents | R-005 |
| T-INT-01 | Mock SIS down during submission; restore | Submission/documents persisted; `PENDING_VALIDATION`; validated ≤ 60 s after restore; no duplicate checks | QS-03, CL-011 |
| T-INT-02 | Mock IdP unavailable | New login fails safely; existing sessions behave as documented; no invented identity | R-002 |
| T-NOT-01 | Notification gateway down after a nomination; worker crash after provider accepted | Nomination committed; retries with stable key; stale lease cannot acknowledge; dead-letter visible | QS-07, ASM-008 |
| T-CONTRACT-01 | Validate adapters/mocks: malformed SIS payload, unknown subject, GPA out of range, duplicate delivery key | Rejected/quarantined; never mapped to success | ADR-005 |
| T-ARCH-01 | Inspect imports/dependencies | Domain has no HTTP/SQL/provider imports; diagrams match entry points | ADR-002 |
| T-ENV-01 | Start demo from clean environment with seed | One vertical slice works; DB/doc store not publicly exposed; mocks clearly marked | AD-07 |
| T-REC-01 | Restart API and worker keeping volumes | Committed state retained; pending work resumes; no claim of data-loss recovery | QS-03/07 |

## 3. Evidence record template (use for every load-bearing test)

```yaml
test_id: T-QUO-01
status: NOT_EXECUTED        # NOT_EXECUTED | PASSED | FAILED | BLOCKED
source_commit: null
executed_at: null
executor: null
environment: {os: null, runtime: null, database_version: null, config_profile: null}
fixture: {version: null, reset_procedure: null}
execution: {command: null, independent_connections: null, trials: null, raw_output: null}
assertions:
  expected: "One 201 and one 409 per trial; active nominations <= places"
  observed: null
limitations: []
related: {requirements: [US-022, US-023], qualities: [QS-01], decisions: [E2-ADR-003]}
```

A specified test is not a passing test: change `status` only after a real execution, and keep failed results.
