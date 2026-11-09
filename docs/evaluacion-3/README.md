# IMAMS — Evaluation 3: architecture update + first executable increment

**Team:** Laura González Rico · Jesús Marquez · Daniel Oliveros · Paulina Valencia — **Project DH-04** (International Mobility Application Management System), Software Design II, Horizon University.
**Version:** increment 1 (v0.3.0). **Commit:** tag `evaluation-3`. **Video:** see `evidence/evaluation-3-video-link.md`.

**Use case implemented:** outbound mobility application, end to end —
`publish opportunity → draft → submit → eligibility (simulated SIS) → triage → academic decision → nomination against quota → host decision → student acceptance (one per term)` — with audit trail, role/scope authorization, SIS-outage and notification-failure handling.
All data is synthetic. SIS, notification gateway and identity are simulated (see `docs/limitations-and-risks.md`).

## Where is everything

| I want to… | Go to |
|---|---|
| Read the updated architecture, views, ADR review, design-vs-real findings | `docs/architecture-update.md` |
| See requirement → decision → component → code → test | `docs/traceability.md` |
| See what is implemented / simulated / designed / pending, defects and risks | `docs/limitations-and-risks.md` |
| Run the system | below |
| See test and demo results | `evidence/` (`test-run.txt`, `demo-run.txt`, `lock-order-experiment.md`, `evaluation-3-video-link.md`) |

```
evaluacion-3/
├── README.md  package.json  tsconfig.json  docker-compose.yml  .env.example
├── db/        schema.sql (invariants live here)  seed.sql (synthetic)
├── src/       domain/  application/  infrastructure/  http/  main.ts  worker.ts
├── tests/     37 tests (node:test) — real PostgreSQL, real HTTP
├── scripts/   demo.ts
├── docs/      architecture-update.md  traceability.md  limitations-and-risks.md
└── evidence/  test-run.txt  demo-run.txt  lock-order-experiment.md  evaluation-3-video-link.md
```

## 1. Preparation
Requirements: **Node.js ≥ 20** and **PostgreSQL 16** (or Docker).

```bash
npm install
docker compose up -d db          # or use your own PostgreSQL 16 with a superuser `postgres` / password `imams`
cp .env.example .env             # defaults already match docker-compose.yml
export $(grep -v '^#' .env | xargs)
createdb -h localhost -U postgres imams_test   # only needed for tests; with docker: docker compose exec db createdb -U postgres imams_test
npm run db:reset                 # creates schema, role imams_app, synthetic seed
```

## 2. Run
```bash
npm start                        # API on http://localhost:3000 (ENABLE_SIMULATORS=true exposes /sim/*)
npm run demo                     # in a second terminal: scripted walkthrough (re-run `npm run db:reset` before repeating it)
npm run worker                   # optional separate worker process
```
Synthetic users (log in with `POST /api/v1/auth/login {"subject": "..."}` → Bearer token):
`stu-0001`, `stu-0002` (ENG, eligible) · `stu-0003` (BUS) · `stu-0004` (ENG, GPA too low) · `adv-01` · `coord-01` · `coord-senior` (has `nomination.override`) · `acad-eng` · `acad-bus` · `it-01`.
Seed opportunities: `OPP-2027-01` (1 place), `OPP-2027-02` (2 places, GPA ≥ 3.3), `OPP-2027-03` (1 place, term 2027-S2).

Main endpoints (all under `/api/v1`): `POST /opportunities` · `POST /applications` · `POST /applications/{id}/submissions` · `POST /applications/{id}/triage` · `POST /applications/{id}/academic-decisions` · `POST /applications/{id}/nominations` · `POST /nominations/{id}/host-decisions` · `POST /nominations/{id}/acceptances` · `GET /applications/{id}/status` · `GET /applications/{id}/audit` · `GET /opportunities/{id}/places`.

## 3. Verify
```bash
npm run typecheck
npm test                                              # 37 tests, ~10 s
QUOTA_TRIALS=100 ACCEPT_TRIALS=50 npm test            # the evidence run
```
Expected: `pass 37, fail 0`. Tests use database `imams_test` (reset at the start of each file) and connect as the least-privilege role `imams_app`. Override URLs with `TEST_DATABASE_URL` / `TEST_DATABASE_ADMIN_URL`.
Run recorded in `evidence/test-run.txt` (2026-11-04, Node 22, PostgreSQL 18.01).

## 4. Known limitations (short)
Web UI is a **static clickable prototype** (`../../frontend/`, open `index.html`; hard-coded synthetic data, demo login, **not connected to the API**) · API login is simulated (no password/CSRF) · documents, partner-change flow, partner selection, pre-departure, reports and reminders are **designed, not built** · concurrency evidence comes from 100/50 trials on one machine. Details and open risks: `docs/limitations-and-risks.md`.
