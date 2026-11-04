# Traceability — requirement → decision → component → implementation → test

IDs come from Evaluation 1/2 (`US-`, `SC-`, `BR-`, `QS-`, `E2-ADR-`, `E3-ADR-`). Test IDs are in `tests/`; the run is in `evidence/test-run.txt`.
"Part." = only part of the requirement is built (see `limitations-and-risks.md`).

| Requirement / rule | Driver | Decision | Component (src/) | Implementation | Test(s) | Status |
|---|---|---|---|---|---|---|
| US-002/003 publish opportunity with requirements | AD-01 | E2-ADR-001 | application/opportunities.ts | `publishOpportunity`, tables `requirement_version`, `application_period` | T-LIFE-01…05 | Verified (publish only) |
| US-004 requirement versions immutable | AD-01 | E2-ADR-001, E3-ADR-004 | db/schema.sql | `REVOKE UPDATE,DELETE` on `requirement_version`; composite FK pins version | T-AUD-01, T-LIFE-01 (pinnedVersionNo=1) | Part. (no v2 flow) |
| Application creation and submission; period open | US-008/009, BR-17 part | — | application/applications.ts | `createDraft`, `submitApplication` (FOR SHARE on opportunity) | T-LIFE-01, T-LIFE-03 | Verified |
| US-012/036 eligibility from SIS; BR-06; CL-017 | AD-05 | E2-ADR-005, E3-ADR-002 | domain/eligibility.ts, application/eligibility-service.ts, adapters/mock-sis.ts | pure rule + port; pass/fail stored only | T-ELIG-01/02, T-LIFE-02, T-DATA-01 | Verified (SIS simulated) |
| CL-015 failing eligibility cannot pass triage | — | — | application/review.ts | `triage` → `ELIGIBILITY_NOT_CONFIRMED` | T-LIFE-02, T-INT-01 | Verified |
| QS-03 / BR-11 SIS outage does not lose submission | AD-05 | E3-ADR-002 | eligibility-service.ts, offers/worker | `PENDING_VALIDATION` + `retryPendingEligibility` | T-INT-01/02/03 | Verified |
| US-017…020 triage and academic review, scoped | AD-06 | E2-ADR-009 | application/review.ts, authz.ts | adviser assignment, programme scope | T-LIFE-04, T-SEC-05/06 | Verified |
| BR-02 nomination needs validated application | — | — | application/nominations.ts | state guard `READY_FOR_NOMINATION` | T-LIFE-04 | Part. (documents missing) |
| BR-04 / SC-03 / QS-01 quota | AD-02 | E2-ADR-003 | application/nominations.ts | `FOR UPDATE` on opportunity + count + insert, one transaction | T-QUO-01, 02, 04, 05 | Verified (100 trials) |
| US-023 / CL-008 override with justification | AD-02 | E2-ADR-003 | nominations.ts | permission `nomination.override` + justification, audited | T-QUO-03 | Verified (who may override still open: CL-008) |
| BR-03 / US-025 / SC-06 nomination ≠ admission | AD-03 | E2-ADR-004 | domain/states.ts, applications.ts#getStatus | separate tables + labels | T-STAT-01, T-LIFE-01 | Verified (text only; no UX test) |
| US-024 host decision; CL-014 release place | AD-03 | E2-ADR-004 | nominations.ts#recordHostDecision | status + `host_decision` row | T-LIFE-01, T-QUO-04 | Verified |
| BR-16 / QS-08 single acceptance per term | AD-08 | E2-ADR-011, E3-ADR-003 | application/acceptance.ts | unique partial index + cascade | T-ACC-01, 02, 03, 05 | Verified (50 trials) |
| QS-09 offer window | AD-08 | E2-ADR-011 | acceptance.ts, offers.ts | server-time check + worker job | T-ACC-04, 06 | Verified |
| BR-10 / US-033 / QS-04 audit | AD-04 | E2-ADR-006, E3-ADR-004 | db/unit-of-work.ts, schema.sql | `appendAudit` in same tx; DB grants | T-LIFE-01, T-QUO-02, T-AUD-01/02 | Verified |
| QS-07 / BR-11 notification failure | AD-05 | E2-ADR-007, E3-ADR-006 | application/outbox-worker.ts | outbox + retry/dead-letter | T-NOT-01 | Verified (gateway simulated) |
| BR-14 / QS-05 server-side authorization | AD-06 | E2-ADR-009, E3-ADR-005 | application/authz.ts, http/app.ts | default deny, role+scope from DB | T-SEC-01…08 | Verified (part.: no CSRF/OIDC) |
| E2-ADR-002 layering | AD-07 | E2-ADR-002 | src/domain, application, infrastructure, http | folder boundaries | T-ARCH-01/02 | Verified |
| BR-05/15/19, QS-02 partner change | AD-01 | E2-ADR-010 | — | — | — | **Not built** |
| BR-07/08 documents | AD-06 | E2-ADR-008 | — | — | — | **Not built** |
| BR-18 partner selection, pre-departure, reports, reminders | — | — | — | — | — | **Not built** |
