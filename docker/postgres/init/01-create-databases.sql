SELECT 'CREATE DATABASE collab'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'collab')\gexec

\connect collab

CREATE TABLE IF NOT EXISTS collab_workspace_state (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
