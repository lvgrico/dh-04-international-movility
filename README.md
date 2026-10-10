# IMAMS — International Mobility Application Management System

**Horizon University · Digital Horizon Initiative · Software Design II** · Project **DH-04**

IMAMS manages the **outbound international mobility** lifecycle: opportunities published with partner universities, student applications, automatic eligibility validation against the Student Information System, document and academic review, nomination within a quota, the partner's host decision, the student's acceptance, and pre-departure preparation — with a complete audit trail.

> **Status:** design phase. See the table below for what is designed, implemented and verified. Nothing is claimed as executed without evidence.

## Team

| Name | Role / responsibility |
|---|---|
| Laura González Rico | `[ROLE]` |
| Jesús Marquez | `[ROLE]` |
| Daniel Oliveros | `[ROLE]` |
| Paulina Valencia | `[ROLE]` |

## Where is everything?

| I want to… | Go to |
|---|---|
| Understand the product, scope and requirements (Evaluation 1) | [`docs/evaluation-1/`](docs/evaluation-1/) |
| See what changed in the Evaluation 1 documents after Evaluation 2 | [`docs/evaluation-1/change-log.md`](docs/evaluation-1/change-log.md) |
| Review the architecture and design (Evaluation 2) | [`docs/evaluation-2/`](docs/evaluation-2/) — start with its [`README.md`](docs/evaluation-2/README.md) |
| Read the main design argument | [`docs/evaluation-2/architecture-and-design.md`](docs/evaluation-2/architecture-and-design.md) |
| Check tests and the proof-of-concept plan | [`docs/evaluation-2/validation/test-plan.md`](docs/evaluation-2/validation/test-plan.md) |
| See risks, backlog changes and the plan | [`docs/evaluation-2/project-status.md`](docs/evaluation-2/project-status.md) |

## Repository structure

```text
.
├── README.md                          # this file: project overview and map
├── docs/
│   ├── evaluation-1/                  # vision, requirements and product definition (revision 1.1)
│   │   ├── README.md
│   │   ├── change-log.md              # what changed after Evaluation 2 and why
│   │   ├── Product_Vision_and_Scope.docx
│   │   ├── requirements-backlog-risks.xlsx
│   │   └── stakeholders-clarifications-assumptions.xlsx
│   └── evaluation-2/                  # Architecture and Design Review
│       ├── README.md                  # evidence index and manifest
│       ├── architecture-and-design.md # connected design argument (views, ADRs, interfaces, security)
│       ├── project-status.md          # risks, backlog, plan, review preparation
│       └── validation/
│           └── test-plan.md           # tests and proof-of-concept proposal
└── prototype/                         # add only when a proof of concept exists
```

## Status by evaluation

| Evaluation | Content | Design | Implementation | Validation |
|---|---|---|---|---|
| 1 — Vision and requirements | Vision, requirements, backlog, risks, stakeholders, clarifications | Documented — revision 1.1 after Evaluation 2 | — | Items pending client validation: [`change-log.md`](docs/evaluation-1/change-log.md) |
| 2 — Architecture and design | Quality scenarios, drivers, 11 ADRs, views, data and state model, interfaces, security, test plan | Documented (draft) | `[TEAM TO COMPLETE]` | Tests specified — **NOT EXECUTED** |

## Key design decisions (summary)

- **Modular monolith + background worker** over one PostgreSQL database; separate encrypted document store; ports/adapters for the simulated identity provider, SIS, partner portal and notification gateway.
- **Quota integrity** is enforced by a database transaction with a per-opportunity lock, not by the screen.
- **Partner changes:** a *material* change, once confirmed by the coordinator, returns **every active application** for reapplication in a new period; students are notified and previously approved ones get priority.
- **Four separate records:** application, nomination, host decision and student acceptance — so "nominated" is never shown as "admitted".
- **One accepted mobility per student per term**, enforced by a unique constraint; accepting withdraws the student's other applications of that term.
- **Audit** is written in the same transaction as every change; **SIS stays the master** of academic data.

## Conventions

- **IDs:** `US-` user stories · `SC-` success criteria · `R-` risks · `STK-` stakeholders · `CL-` clarifications · `ASM-` assumptions · `QS-` quality scenarios · `E2-ADR-` decisions · `BR-` business rules · `T-` tests.
- **Diagrams** are Mermaid blocks; GitHub renders them directly in the Markdown files.
- **Data** in examples is synthetic. Do not commit real student data or documents.
- **Honesty rule:** every feature is labelled *designed*, *implemented* or *verified*; a diagram or a test plan does not establish that behaviour works.
