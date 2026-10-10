# IMAMS — Evaluation 2: Architecture and Design Review

[← Back to project README](../../README.md)

**Project:** International Mobility Application Management System (Horizon University)
**Project:** DH-04 · **Team:** Laura González Rico, Jesús Marquez, Daniel Oliveros, Paulina Valencia · **Reviewed version:** `[VERSION / COMMIT]` · **Date:** `[DATE]`

> Can our team justify how the proposed system should be structured?

## Evidence index

| Element | File |
|---|---|
| Architecture and design document (scope, requirements, quality scenarios, drivers, alternatives, 11 ADRs, views, data/state, interactions, interfaces, security, deployment, traceability) | [`architecture-and-design.md`](architecture-and-design.md) |
| Test strategy, proof-of-concept proposal, test catalog, evidence template | [`validation/test-plan.md`](validation/test-plan.md) |
| Risks, backlog reconciliation, plan, readiness, review preparation | [`project-status.md`](project-status.md) |
| Project requirements, backlog, risks, success criteria, traceability (source of truth, revision 1.1) | [`../evaluation-1/requirements-backlog-risks.xlsx`](../evaluation-1/requirements-backlog-risks.xlsx) |
| Stakeholders, clarifications, assumptions (source of truth, revision 1.1) | [`../evaluation-1/stakeholders-clarifications-assumptions.xlsx`](../evaluation-1/stakeholders-clarifications-assumptions.xlsx) |
| Product vision and scope | [`../evaluation-1/Product_Vision_and_Scope.docx`](../evaluation-1/Product_Vision_and_Scope.docx) |

## Architecture in one paragraph
A **modular monolith** (web, API, background worker) over one **PostgreSQL** database that enforces the critical invariants — quota, versioned requirements, audit — inside local transactions; a **separate encrypted document store**; and **ports/adapters** for the simulated identity provider, SIS, partner portal and notification gateway. Application, nomination, host decision and student acceptance are **separate records**. A confirmed **material partner change returns every active application** atomically; a student can **accept only one mobility per term**.

## Actual readiness (edit honestly)

| Area | Design | Implementation | Validation |
|---|---|---|---|
| See table in [`project-status.md`](project-status.md) §1 | Documented | `[TEAM TO COMPLETE]` | **Not executed** until `findings.md` / evidence says otherwise |

## Open decisions that affect the design
CL-008 (who may override) · CL-014…CL-023 (new questions raised by this design, including returning already-admitted students, the meaning of priority and term, and partner selection vs. quota). CL-006 is answered by the client rule and should be recorded as closed.

## Submission manifest

```yaml
project: DH-04 - IMAMS
team: [Laura González Rico, Jesús Marquez, Daniel Oliveros, Paulina Valencia]
milestone: Evaluation 2 - Architecture and Design Review
document_version: null
source_commit: null
entry_point: README.md
architecture_document: architecture-and-design.md
validation_plan: validation/test-plan.md
project_status: project-status.md
implementation:
  implemented_use_cases: []        
  designed_not_implemented: []     
  simulated_integrations: [identity-provider, sis, partner-portal, notification-gateway]
  real_integrations: []
evidence:
  passed: []
  failed: []
  not_executed: [all tests in test-plan.md]
limitations:
  - single-host demonstration, not high availability
  - all external systems simulated
  - synthetic data only
```
