-- IMAMS schema, increment 1 (Evaluation 3). Synthetic data only.
-- Invariants live here on purpose (E2-ADR-003/004/006/011): the UI cannot be the guard.

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'imams_app') THEN
    CREATE ROLE imams_app LOGIN PASSWORD 'imams_app';
  END IF;
END $$;

-- ---- Simulated identity directory (stands in for the institutional IdP, E2-ADR-009)
CREATE TABLE app_user (
  subject      text PRIMARY KEY,
  display_name text NOT NULL,
  role         text NOT NULL CHECK (role IN ('student','adviser','coordinator','academic_coordinator','it')),
  programme    text,                                  -- academic_coordinator scope
  permissions  text[] NOT NULL DEFAULT '{}'           -- e.g. nomination.override
);
CREATE TABLE session (
  token      text PRIMARY KEY,
  subject    text NOT NULL REFERENCES app_user(subject),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE adviser_assignment (                     -- ASM-006: adviser -> opportunities
  subject        text NOT NULL REFERENCES app_user(subject),
  opportunity_id text NOT NULL,
  PRIMARY KEY (subject, opportunity_id)
);

-- ---- Opportunities, immutable requirement versions, application periods (E2-ADR-001)
CREATE TABLE opportunity (
  opportunity_id     text PRIMARY KEY,
  destination        text NOT NULL,
  term               text NOT NULL,
  current_version_no int  NOT NULL DEFAULT 1,
  row_version        int  NOT NULL DEFAULT 1
);
CREATE TABLE requirement_version (
  opportunity_id       text NOT NULL REFERENCES opportunity(opportunity_id),
  version_no           int  NOT NULL,
  min_gpa              numeric(3,2) NOT NULL,
  min_credits          int  NOT NULL,
  places               int  NOT NULL CHECK (places >= 0),
  horizon_deadline     date NOT NULL,
  material_fingerprint text NOT NULL,
  PRIMARY KEY (opportunity_id, version_no)
);
CREATE TABLE application_period (
  opportunity_id text NOT NULL REFERENCES opportunity(opportunity_id),
  period_no      int  NOT NULL,
  opens_on       date NOT NULL,
  closes_on      date NOT NULL,
  reason         text NOT NULL DEFAULT 'initial',
  PRIMARY KEY (opportunity_id, period_no)
);

-- ---- Application (workflow state only; SIS stays master of academic data, E2-ADR-005)
CREATE TABLE application (
  application_id     text PRIMARY KEY,
  opportunity_id     text NOT NULL REFERENCES opportunity(opportunity_id),
  student_subject    text NOT NULL REFERENCES app_user(subject),
  statement          text NOT NULL DEFAULT '',
  workflow_state     text NOT NULL CHECK (workflow_state IN
    ('DRAFT','SUBMITTED','CORRECTION_REQUESTED','IN_ACADEMIC_REVIEW','READY_FOR_NOMINATION',
     'NOMINATED','REJECTED','WITHDRAWN','RETURNED_FOR_REAPPLICATION')),
  pinned_version_no  int,
  period_no          int,
  programme          text,                            -- routing attribute copied from SIS at validation time
  withdrawn_reason   text,
  row_version        int NOT NULL DEFAULT 1,
  created_at         timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (opportunity_id, pinned_version_no) REFERENCES requirement_version(opportunity_id, version_no),
  FOREIGN KEY (opportunity_id, period_no) REFERENCES application_period(opportunity_id, period_no)
);
CREATE INDEX application_student_idx ON application(student_subject);

-- Pass/fail per criterion + SIS reference only, never raw GPA/credits (CL-017)
CREATE TABLE eligibility_check (
  check_id         bigserial PRIMARY KEY,
  application_id   text NOT NULL REFERENCES application(application_id),
  outcome          text NOT NULL CHECK (outcome IN ('ELIGIBLE','INELIGIBLE','PENDING_VALIDATION')),
  criteria_results jsonb,
  sis_reference    text,
  attempt_count    int NOT NULL DEFAULT 0,
  next_attempt_at  timestamptz NOT NULL DEFAULT now(),
  checked_at       timestamptz
);

-- ---- Three decisions, three records (E2-ADR-004) + acceptance (E2-ADR-011)
CREATE TABLE nomination (
  nomination_id          text PRIMARY KEY,
  application_id         text NOT NULL REFERENCES application(application_id),
  opportunity_id         text NOT NULL REFERENCES opportunity(opportunity_id),
  status                 text NOT NULL CHECK (status IN
    ('AWAITING_HOST_DECISION','ADMITTED','ACCEPTED','DECLINED','OFFER_EXPIRED','REFUSED','REVOKED')),
  offer_expires_at       timestamptz,
  override_justification text,
  override_by            text,
  created_at             timestamptz NOT NULL DEFAULT now()
);
-- one ACTIVE nomination per application
CREATE UNIQUE INDEX nomination_one_active_per_application
  ON nomination(application_id) WHERE status IN ('AWAITING_HOST_DECISION','ADMITTED','ACCEPTED');
CREATE INDEX nomination_active_per_opportunity
  ON nomination(opportunity_id) WHERE status IN ('AWAITING_HOST_DECISION','ADMITTED','ACCEPTED');

CREATE TABLE host_decision (
  nomination_id text PRIMARY KEY REFERENCES nomination(nomination_id),
  outcome       text NOT NULL CHECK (outcome IN ('ADMITTED','REFUSED')),
  recorded_by   text NOT NULL,
  recorded_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE mobility_acceptance (
  acceptance_id   text PRIMARY KEY,
  nomination_id   text NOT NULL REFERENCES nomination(nomination_id),
  student_subject text NOT NULL REFERENCES app_user(subject),
  term            text NOT NULL,
  status          text NOT NULL CHECK (status IN ('ACTIVE','RELEASED')),
  accepted_at     timestamptz NOT NULL DEFAULT now()
);
-- BR-16: at most ONE accepted mobility per student per term
CREATE UNIQUE INDEX mobility_acceptance_one_per_student_term
  ON mobility_acceptance(student_subject, term) WHERE status = 'ACTIVE';

-- ---- Audit (E2-ADR-006): written in the business transaction, append-only for the app role
CREATE TABLE audit_event (
  audit_id       bigserial PRIMARY KEY,
  application_id text,
  target_type    text NOT NULL,
  target_id      text NOT NULL,
  actor_subject  text NOT NULL,
  action         text NOT NULL,
  before_after   jsonb,
  reason         text,
  correlation_id text,
  occurred_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_application_idx ON audit_event(application_id);

-- ---- Transactional outbox (E2-ADR-007)
CREATE TABLE outbox_event (
  event_id        bigserial PRIMARY KEY,
  event_type      text NOT NULL,
  payload         jsonb NOT NULL,
  state           text NOT NULL DEFAULT 'PENDING' CHECK (state IN ('PENDING','DELIVERED','RETRY_WAIT','DEAD_LETTER')),
  attempt_count   int NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---- Least privilege for the runtime role
GRANT USAGE ON SCHEMA public TO imams_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO imams_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO imams_app;
REVOKE UPDATE, DELETE, TRUNCATE ON audit_event FROM imams_app;
REVOKE UPDATE, DELETE, TRUNCATE ON requirement_version FROM imams_app;   -- versions are immutable (BR-07/ADR-001)
