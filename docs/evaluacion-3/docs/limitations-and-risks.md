# What works, what is simulated, what is only designed — and open risks

## 1. Classification

| Class | Items |
|---|---|
| **Implemented and verified** | Publish opportunity; draft/submit; eligibility rule; triage; academic decision; nomination with quota lock and audited override; host decision; acceptance with single-per-term rule and cascade; offer expiry job; status and audit queries; outbox delivery with retry; role/scope authorization; append-only audit via DB grants |
| **Simulated** | SIS (`MockSis`: fixtures for 4 synthetic students, outage and malformed modes); notification gateway (`SimulatedNotifier`); institutional identity (login by synthetic subject); partner host decisions (entered by the coordinator through the API) |
| **Designed, not built** | Partner change flow (ADR-010) and application return/reapplication; documents and expiry (ADR-008); partner selection (BR-18); decline, student withdrawal, resubmission of rejected applications (BR-17); pre-departure checklist; deadline reminders; operational reports; `If-Match`/`Idempotency-Key`; web UI connected to the API (only a static prototype exists in `frontend/`) |
| **Pending decisions with the client** | CL-008 (who may override), CL-016 (delayed/at-risk thresholds), CL-019…CL-025 (see E2), **CL-026 (new)**: may IMAMS store the student's programme copied from the SIS as a routing attribute? |

## 2. Known limitations (L) and defects (D)

| ID | Description | Impact | Next step |
|---|---|---|---|
| L-1 | Web UI is a static prototype (`frontend/`, hard-coded data) not connected to the API; the increment is exercised through HTTP, `scripts/demo.ts` and tests | QS-06 (status clarity) not tested with users | Build the student status screen on `GET /applications/{id}/status` |
| L-2 | Login has no password, no token expiry, no CSRF protection | Acceptable only with synthetic data and no browser client | Add expiry + CSRF when the UI exists (R-E3-04) |
| L-3 | Nomination does not check documents (BR-02 partly built) | A nomination can be made without document review | Implement Documents module (ADR-008) |
| L-4 | Concurrency tests run on one machine against one PostgreSQL; "100 trials" is a sample, not a proof | Residual risk of rare interleavings | Keep trials configurable (`QUOTA_TRIALS`, `ACCEPT_TRIALS`) and run in CI |
| L-5 | `row_version` columns are maintained but unused | No optimistic concurrency on edits | Use as ETag (E2 §8.1) |
| L-6 | Outbox delivery holds a DB row lock while calling the notifier | Slow gateway would hold locks; fine at 5–8 users | Move to lease states if volume grows |
| L-7 | Worker retry interval is 5 s fixed for eligibility; QS-03 target of 60 s is not measured | Target unverified | Add a timing test |
| L-8 | The standalone `npm run worker` uses its own `MockSis`/notifier instances, so it cannot see the API process's simulator switches | Demo uses `POST /sim/worker/run` instead | Irrelevant with a real SIS/gateway |
| L-9 | No performance or load testing; no test of the 200–300 applications/year peak | QS targets for load are not claimed | Out of scope for this increment |
| D-0 | No open known defects at submission. Two defects found during the build (F-2, F-3 in `architecture-update.md`) were fixed and are covered by tests | — | — |

## 3. Risks

| ID | Risk | Likelihood / impact | Mitigation / status |
|---|---|---|---|
| R-001 | Partner changes requirements mid-cycle | High / High | **Still open:** the confirmed client rule (ADR-010) has no running code yet. First item of the next iteration |
| R-E3-01 | Large batch return under the exclusive opportunity lock could hold it long | Low (tens/hundreds of rows) / Medium | Lock order already documented; chunking if volume grows |
| R-E3-02 | Lock-order mistakes reintroduce deadlocks as new commands are added | Medium / High | Rule written in E3-ADR-003; T-ACC-01 and T-QUO-01 must stay in the suite and run on every change |
| R-E3-03 | Eligibility criteria are only GPA/credits/enrolled; real rules also vary by language level, programme, destination | High / Medium | `evaluateEligibility` is a pure function with a small vocabulary; extend per ADR-001 |
| R-E3-04 | Simulated login mistaken for real security | Low / High | Clearly labelled (E3-ADR-005, L-2); synthetic data only |
| R-021 | DB superuser can alter audit | Low / High | Unchanged from E2 |

## 4. Assumptions not validated by running software
The 14-day offer window (`OFFER_WINDOW_DAYS`) and the "active = awaiting/admitted/accepted" definition of an occupied place are team proposals (CL-014, CL-022) pending client confirmation.
