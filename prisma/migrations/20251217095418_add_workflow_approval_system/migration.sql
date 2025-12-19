-- Workflow Approval System
-- PostgreSQL + Prisma Migration

-- --------------------------------------------------
-- Extensions
-- --------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------
-- ENUM TYPES
-- --------------------------------------------------

DO $$ BEGIN
  CREATE TYPE workflow_status AS ENUM (
    'DRAFT',
    'IN_PROGRESS',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE workflow_step_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'SKIPPED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE workflow_action AS ENUM (
    'SUBMIT',
    'APPROVE',
    'REJECT',
    'SEND_BACK',
    'CANCEL'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE approver_strategy AS ENUM (
    'USER',
    'ROLE',
    'DYNAMIC',
    'MULTI'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE approval_mode AS ENUM (
    'ANY',
    'ALL'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE reject_target_type AS ENUM (
    'PREVIOUS',
    'SUBMITTER',
    'SPECIFIC'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- --------------------------------------------------
-- TABLE: workflow
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  code varchar(100) NOT NULL,
  name varchar(255) NOT NULL,
  version int NOT NULL,

  description text,
  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  updated_at timestamptz,
  updated_by uuid,

  CONSTRAINT uq_workflow_code_version UNIQUE (code, version)
);

-- Only ONE active workflow per code
CREATE UNIQUE INDEX IF NOT EXISTS uq_workflow_active_per_code
ON workflow (code)
WHERE is_active = true;

-- --------------------------------------------------
-- TABLE: workflow_step
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_step (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  workflow_id uuid NOT NULL REFERENCES workflow(id),

  step_key varchar(50) NOT NULL,
  step_order int NOT NULL,
  name varchar(255) NOT NULL,

  approver_strategy approver_strategy NOT NULL,
  approver_value varchar(255) NOT NULL,

  approval_mode approval_mode NOT NULL DEFAULT 'ANY',

  can_send_back boolean NOT NULL DEFAULT true,

  reject_target_type reject_target_type NOT NULL,
  -- intentionally NO FK to avoid cross-version / self-FK issues
  reject_target_step_id uuid,

  is_terminal boolean NOT NULL DEFAULT false,

  CONSTRAINT uq_workflow_step_key UNIQUE (workflow_id, step_key),
  CONSTRAINT uq_workflow_step_order UNIQUE (workflow_id, step_order)
);

-- --------------------------------------------------
-- TABLE: workflow_instance
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_instance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  workflow_id uuid NOT NULL REFERENCES workflow(id),
  workflow_version int NOT NULL,

  ref_type varchar(100) NOT NULL,
  ref_id varchar(255) NOT NULL,

  status workflow_status NOT NULL DEFAULT 'DRAFT',
  current_step_id uuid REFERENCES workflow_step(id),

  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_workflow_instance_ref UNIQUE (ref_type, ref_id)
);

-- --------------------------------------------------
-- TABLE: workflow_step_instance
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_step_instance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  workflow_instance_id uuid NOT NULL REFERENCES workflow_instance(id),
  step_id uuid NOT NULL REFERENCES workflow_step(id),

  status workflow_step_status NOT NULL DEFAULT 'PENDING',

  assigned_to jsonb NOT NULL DEFAULT '[]'::jsonb,
  acted_by uuid,
  acted_at timestamptz,
  comment text,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- --------------------------------------------------
-- TABLE: workflow_action_log
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_action_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  workflow_instance_id uuid NOT NULL REFERENCES workflow_instance(id),

  action workflow_action NOT NULL,

  from_step_id uuid REFERENCES workflow_step(id),
  to_step_id uuid REFERENCES workflow_step(id),

  actor_id uuid NOT NULL,
  comment text,
  metadata jsonb,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- --------------------------------------------------
-- INDEXES (Performance)
-- --------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_workflow_instance_status
ON workflow_instance(status);

CREATE INDEX IF NOT EXISTS idx_step_instance_pending
ON workflow_step_instance(status)
WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_action_log_instance
ON workflow_action_log(workflow_instance_id);

-- Optional but recommended for inbox performance
CREATE INDEX IF NOT EXISTS idx_step_instance_assigned_to
ON workflow_step_instance
USING GIN (assigned_to);


-- --------------------------------------------------
-- Extensions
-- --------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------
-- ENUM TYPES
-- --------------------------------------------------

DO $$ BEGIN
  CREATE TYPE workflow_status AS ENUM (
    'DRAFT',
    'IN_PROGRESS',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE workflow_step_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'SKIPPED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE workflow_action AS ENUM (
    'SUBMIT',
    'APPROVE',
    'REJECT',
    'SEND_BACK',
    'CANCEL'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE approver_strategy AS ENUM (
    'USER',
    'ROLE',
    'DYNAMIC',
    'MULTI'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE approval_mode AS ENUM (
    'ANY',
    'ALL'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE reject_target_type AS ENUM (
    'PREVIOUS',
    'SUBMITTER',
    'SPECIFIC'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- --------------------------------------------------
-- TABLE: workflow
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  code varchar(100) NOT NULL,
  name varchar(255) NOT NULL,
  version int NOT NULL,

  description text,
  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  updated_at timestamptz,
  updated_by uuid,

  CONSTRAINT uq_workflow_code_version UNIQUE (code, version)
);

-- Only ONE active workflow per code
CREATE UNIQUE INDEX IF NOT EXISTS uq_workflow_active_per_code
ON workflow (code)
WHERE is_active = true;

-- --------------------------------------------------
-- TABLE: workflow_step
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_step (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  workflow_id uuid NOT NULL REFERENCES workflow(id),

  step_key varchar(50) NOT NULL,
  step_order int NOT NULL,
  name varchar(255) NOT NULL,

  approver_strategy approver_strategy NOT NULL,
  approver_value varchar(255) NOT NULL,

  approval_mode approval_mode NOT NULL DEFAULT 'ANY',

  can_send_back boolean NOT NULL DEFAULT true,

  reject_target_type reject_target_type NOT NULL,
  -- intentionally NO FK to avoid cross-version / self-FK issues
  reject_target_step_id uuid,

  is_terminal boolean NOT NULL DEFAULT false,

  CONSTRAINT uq_workflow_step_key UNIQUE (workflow_id, step_key),
  CONSTRAINT uq_workflow_step_order UNIQUE (workflow_id, step_order)
);

-- --------------------------------------------------
-- TABLE: workflow_instance
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_instance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  workflow_id uuid NOT NULL REFERENCES workflow(id),
  workflow_version int NOT NULL,

  ref_type varchar(100) NOT NULL,
  ref_id varchar(255) NOT NULL,

  status workflow_status NOT NULL DEFAULT 'DRAFT',
  current_step_id uuid REFERENCES workflow_step(id),

  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_workflow_instance_ref UNIQUE (ref_type, ref_id)
);

-- --------------------------------------------------
-- TABLE: workflow_step_instance
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_step_instance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  workflow_instance_id uuid NOT NULL REFERENCES workflow_instance(id),
  step_id uuid NOT NULL REFERENCES workflow_step(id),

  status workflow_step_status NOT NULL DEFAULT 'PENDING',

  assigned_to jsonb NOT NULL DEFAULT '[]'::jsonb,
  acted_by uuid,
  acted_at timestamptz,
  comment text,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- --------------------------------------------------
-- TABLE: workflow_action_log
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_action_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  workflow_instance_id uuid NOT NULL REFERENCES workflow_instance(id),

  action workflow_action NOT NULL,

  from_step_id uuid REFERENCES workflow_step(id),
  to_step_id uuid REFERENCES workflow_step(id),

  actor_id uuid NOT NULL,
  comment text,
  metadata jsonb,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- --------------------------------------------------
-- INDEXES (Performance)
-- --------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_workflow_instance_status
ON workflow_instance(status);

CREATE INDEX IF NOT EXISTS idx_step_instance_pending
ON workflow_step_instance(status)
WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_action_log_instance
ON workflow_action_log(workflow_instance_id);

-- Optional but recommended for inbox performance
CREATE INDEX IF NOT EXISTS idx_step_instance_assigned_to
ON workflow_step_instance
USING GIN (assigned_to);
