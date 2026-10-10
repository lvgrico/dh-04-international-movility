# IMAMS — Project Status for Evaluation 2
Risks · backlog updates · plan · readiness · review preparation

## 1. Designed / implemented / verified

Design status reflects `architecture-and-design.md`. **Implementation and validation columns must be completed by the team with the truth.**

| Concern | Design | Implementation | Validation |
|---|---|---|---|
| Opportunities + versioned requirements | Documented (ADR-001) | `[TEAM TO COMPLETE]` | T-VER-01 — not executed |
| Application submission + eligibility (SIS) | Documented (ADR-005) | `[TEAM TO COMPLETE]` | T-ELIG-01, T-INT-01 — not executed |
| Documents + versions + expiry | Documented (ADR-008) | `[TEAM TO COMPLETE]` | T-DOC-01/02 — not executed |
| Triage, academic review, routing | Documented (state machine) | `[TEAM TO COMPLETE]` | T-LIFE-01 — not executed |
| Nomination + quota + override | Documented (ADR-003) | `[TEAM TO COMPLETE]` | T-QUO-01…04 — not executed |
| Partner change, return for reapplication, reopened period, priority | Documented (ADR-010) | `[TEAM TO COMPLETE]` | T-CHG-01…03, T-PRI-01 — not executed |
| Student acceptance (one per term), offer window | Documented (ADR-011) | `[TEAM TO COMPLETE]` | T-ACC-01…03 — not executed |
| Partner selection | Documented — **interpretation pending (CL-023)** | `[TEAM TO COMPLETE]` | T-SEL-01 — not executed |
| Host decision + pre-departure | Documented (ADR-004) | `[TEAM TO COMPLETE]` | T-STAT-01 — not executed |
| Audit | Documented (ADR-006) | `[TEAM TO COMPLETE]` | T-AUD-01/02 — not executed |
| Notifications + reminders | Documented (ADR-007) | `[TEAM TO COMPLETE]` | T-NOT-01 — not executed |
| Reporting | Partially documented — **thresholds open (CL-016)** | `[TEAM TO COMPLETE]` | T-RPT-01 — blocked |
| Authentication / authorization | Documented (ADR-009) | `[TEAM TO COMPLETE]` | T-SEC-01…06 — not executed |

## 2. Risk register — update

Existing risks R-001…R-009 stay in the project workbook. Changes and additions proposed by the architecture:

| ID | Risk / update | Prob. | Impact | Mitigation (design link) | Owner | Status |
|---|---|---|---|---|---|---|
| R-001 | Partner changes after opening — **client rule now defined: material change returns all applications.** The risk moves from *inconsistent rules* to *large impact on students* (see R-017/R-018) | High | High | ADR-001/010: preview, confirmation, atomic return, notices, new period | Product Owner | Open — mitigation designed |
| R-002 | SIS/IdP unavailable — persist-first + retry (ADR-005/007) | Medium | High | T-INT-01/02 | Architect | Open — mitigation designed |
| R-004 | Override policy undefined — distinct permission + justification + audit (ADR-003/009); **role still unknown (CL-008)** | Medium | High | Confirm role with Coordinator | Product Owner | Open |
| R-010 *(new)* | Quota counting depends on whether refused/revoked/withdrawn nominations release places (CL-014) | Medium | High | Ask Coordinator; parametrize "active" statuses | Business Analyst | Open |
| R-011 *(new)* | Storing eligibility without raw GPA may conflict with auditors' needs (CL-017) | Low | Medium | Agree with Registrar/IT | Architect | Open |
| R-012 *(new)* | Reports blocked: "delayed"/"at-risk" undefined (CL-016) | High | Medium | Propose thresholds, validate | Business Analyst | Open |
| R-013 *(new)* | Single deployment/DB is one failure domain | Medium | Medium | Document; accept for course scope | Architect | Accepted |
| R-014 *(new)* | Module boundaries erode in a modular monolith | Medium | Medium | T-ARCH-01 in CI; code review | Technical lead | Open |
| R-015 *(new)* | Simulated partner portal/notification gateway hide real-provider behaviour (duplicates, ordering) | Medium | Medium | Contract tests; stable delivery keys; state the limit | Architect | Open |
| R-021 *(new)* | DB superuser can alter audit history | Low | High | Residual risk; production would need tamper-evident controls | QA/privacy owner | Accepted for demo |
| R-016 *(new)* | Scholarship representative (STK-07) has no requirements | Medium | Low | Define stories or record as out of scope (CL-018) | Product Owner | Open |
| R-017 *(new)* | A mistaken or forged confirmation returns every application of an opportunity and cannot be undone | Medium | High | Partner has no IMAMS account; impact preview; coordinator confirmation; ETag; audit (ADR-010) | Architect | Open |
| R-018 *(new)* | Returning students already **admitted or accepted** (CL-021) invalidates partner admissions, visa evidence and student plans | Medium | High | Confirm intent with Coordinator and partners; consider a stronger confirmation for such cases | Product Owner | Open |
| R-019 *(new)* | Cross-opportunity cascades (acceptance, return) risk deadlocks or inconsistent places | Medium | Medium | Documented lock order; T-ACC-01, T-CHG-02; PoC steps 5–7 | Technical lead | Open |
| R-020 *(new)* | Meaning of "priority" and of "term" is ambiguous (CL-020, CL-022) | Medium | Medium | Written definitions confirmed with the Coordinator | Business Analyst | Open |

## 3. Open clarifications that affect the design

| ID | Question | Design element waiting on it | Needed by |
|---|---|---|---|
| CL-006 | **Answered by the client:** a material partner change returns all applications, who reapply from scratch in a new period (priority for previously approved). **Record as closed in the workbook; reverse ASM-004; rewrite SC-10 and the STK-03 acceptance criterion.** | ADR-001/010, QS-02 | Now |
| CL-008 (open) | Which role may override | ADR-009, authorization matrix | Before US-023 |
| CL-014…CL-018 (new, section 2.3 of the design doc) | See design document | Quota count, submit behaviour, reports, privacy, notifications | `[DATE — TEAM TO COMPLETE]` |
| CL-019…CL-023 (new) | Material boundary (place reduction, shorter deadline); priority meaning; returning admitted/accepted students; meaning of term and offer window; partner selection vs quota | ADR-001/003/010/011 | `[DATE — TEAM TO COMPLETE]` |

## 4. Backlog and workbook reconciliation

Revision 1.1 of the Evaluation 1 documents ([`../evaluation-1/`](../evaluation-1/), described in [`change-log.md`](../evaluation-1/change-log.md)) applies the corrections below. Changed cells are highlighted in the workbooks.

| # | Finding | Status in revision 1.1 |
|---|---|---|
| 1 | Four *Must* stories missing from the Product Backlog: US-003, US-014, US-018, US-025 | **Applied** (added as *Proposed*; points and sprints to be re-estimated) |
| 2 | Vision objectives used reservation-system wording | **Applied** |
| 3 | R-007 cited ASM-006 instead of an equivalency-workflow assumption | **Applied** (new ASM-011) |
| 4 | STK-07 (scholarship representative) has no user story | **Gap now visible** in the traceability matrix; open as CL-018 / R-016 |
| 5 | US-012 (Sprint 2) depends on US-036 (Sprint 2, Draft) and the mock SIS | **Open scheduling decision** for the team |
| 6 | US-023 (override, *Should*) is outside the sprint plan, yet SC-03 and R-004 depend on its policy | **Open decision**: the backlog lists only *Must* stories; decide where the override lands (CL-008) |
| 7 | SC-09 needs definitions of *delayed* and *at-risk* | **Open** (CL-016, R-012) |
| 8 | US-037 (portal simulator) overlaps with US-024 (record host decision) | **Applied**: US-037 now covers decisions, selections and change proposals; the coordinator records the decision |
| 9 | Changes caused by the new rules: ASM-004 reversed; CL-006 closed; CL-007 refined; SC-10 and the STK-03 acceptance criterion rewritten; US-010, US-011, US-025, US-026 updated | **Applied** |
| 10 | New user stories US-038 to US-048 (partner change, reapplication, priority, acceptance, selection, several applications) | **Applied** (US-038, 039, 040, 041, 043, 045, 048 are *Must* and in the backlog as *Proposed*; US-042, 044, 046, 047 are *Should*) |

**Sprint load after the additions (story points, with the proposed estimates):** Sprint 1 = 39, Sprint 2 = 47, Sprint 3 = 47, Sprint 4 = 47, Sprint 5 = 52 (before: 31, 42, 42, 34, 16). Sprint 5 now concentrates the partner-change work (US-038 to US-041, US-045), which is the riskiest part of the design. Re-plan so that the spike ENB-08 and the first slice of the change workflow happen earlier.

**Proposed architecture-enabling items** (suggested sprint = proposal; adjust to the real plan):

| ID | Item | Why | Suggested sprint | Depends on |
|---|---|---|---|---|
| ENB-01 | DB schema, migrations, Unit of Work, audit appender | AD-04; all use cases | 1 | — |
| ENB-02 | Authorization framework with scope + simulated IdP adapter | AD-06; US-035 | 1 | — |
| ENB-03 | Mock SIS with fixtures and fault modes | US-036, T-INT-01 | 1–2 | — |
| ENB-04 | Quota concurrency spike (PoC step 4) | QS-01, T-QUO-01 | 2 | ENB-01 |
| ENB-05 | Outbox + worker + notification mock | ADR-007 | 3 | ENB-01 |
| ENB-06 | Document store + secure streaming | ADR-008, US-013 | 2 | ENB-02 |
| ENB-07 | Architecture dependency check in CI | ADR-002, T-ARCH-01 | 1–2 | — |
| ENB-08 | Change-management and acceptance cascades (atomic return, unique acceptance) as a spike | ADR-010/011, T-CHG-02, T-ACC-01 | 2–3 | ENB-01, ENB-04 |

## 5. Plan to the next review

| Work item | Linked evidence | Owner | Due | Completion evidence |
|---|---|---|---|---|
| Confirm CL-006, CL-008, CL-014…018 with stakeholders | R-001, R-004, R-010…R-012, R-016 | `[NAME]` | `[DATE]` | Answers recorded in Clarification Log; ADRs updated |
| Run PoC steps 1–6 | QS-01…04, T-QUO-01, T-VER-01, T-INT-01, T-AUD-01/02 | `[NAME]` | `[DATE]` | `validation/evidence/…` with commit, command, raw output |
| Review revision 1.1 of the Evaluation 1 documents and validate the decisions marked *validate with client* | Traceability, CL-006, CL-024, CL-025 | `[NAME]` | `[DATE]` | Confirmed answers in the Clarification Log; highlights cleared |
| Confirm authorization matrix with IT Services | QS-05, ADR-009 | `[NAME]` | `[DATE]` | Signed-off matrix |
| Reconcile diagrams, names and IDs | V-CONT, V-COMP, V-DATA | `[NAME]` | `[DATE]` | Consistency check |
| Dry-run the review defence | Section 7 | All | `[DATE]` | Every member explains one chain |

If a finding changes the design, update the affected ADR, view, interface, risk and test together.

## 6. Submission checklist

- [ ] Names, owners, dates and commit filled in (no `[TEAM TO COMPLETE]` left).
- [ ] Revision 1.1 of the Evaluation 1 documents reviewed by the team; items marked *validate with client* confirmed with the Mobility Coordinator.
- [ ] Mermaid diagrams render in your repository viewer (export to PNG if needed).
- [ ] Implementation and validation status reflect reality; no "executed" claim without evidence.
- [ ] README links only to files that exist.
- [ ] Every member can explain the chains in section 7.

## 7. Review preparation — suggested story (≈10 min) and likely questions

**Story.** (1) Problem and the three decisions that must not be confused. (2) The five drivers that shaped everything: versioned requirements, quota integrity, distinct decisions, audit, resilient integrations. (3) Why a modular monolith, one rejected alternative and its cost. (4) Context → container → the quota sequence. (5) What we validated or plan to validate, and what remains open (CL-006, CL-008).

**Trace you must be able to walk, forward and backward:**
- *Quota:* US-022/023 → SC-03 → QS-01 → AD-02 → ADR-003 → V-SEQ-02 + data model → T-QUO-01/02/03 → evidence or gap.
- *Versions:* US-002/004 → SC-10 → QS-02 → AD-01 → ADR-001 → V-SEQ-03 → T-VER-01.
- *Distinct decisions:* US-024/025 → SC-06 → R-003 → AD-03 → ADR-004 → V-STATE-NOM → T-STAT-01, T-UX-01.

- *Partner change:* client rule → BR-05/15/19 → QS-02 → AD-01 → ADR-001/010 → V-SEQ-03 + 6.4 → T-CHG-01/02/03 → evidence or gap.
- *Acceptance:* BR-16 → QS-08 → AD-08 → ADR-011 → V-SEQ-04 + 6.5 → T-ACC-01/02/03.

**Questions to rehearse:**
1. Why a lock instead of a counter or a UI check? What gets worse?
2. If the SIS is down, what exactly is saved and what does the student see?
3. What happens to old applications when a partner changes requirements? (Answer honestly: CL-006 is open; here is the provisional rule.)
4. Why is nomination a separate record from the application?
5. Who can override, and how do we prove it was justified? (Role pending CL-008.)
6. Why not microservices? When would you reconsider?
7. What is *not* proven by your mocks?
8. Which test has actually been executed, and with what result?
9. Why must the coordinator confirm a partner change instead of applying it automatically?
10. What happens if a student submits at the very moment a change is confirmed?
11. Why is "returned" a different state from "withdrawn"?
12. Two coordinators and one student are racing — which locks exist and in what order?
