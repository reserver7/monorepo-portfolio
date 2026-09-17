create table if not exists public.collab_workspace_state (
  id smallint primary key check (id = 1),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.collab_workspace_state enable row level security;
