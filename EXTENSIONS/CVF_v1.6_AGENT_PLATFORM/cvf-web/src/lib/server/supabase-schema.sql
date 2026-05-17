-- CVF Runtime Events - Supabase schema
-- Run once: Supabase Dashboard -> SQL Editor -> New Query -> paste -> Run

create table if not exists runtime_events (
  id             bigserial    primary key,
  job_id         text         not null,
  event_type     text         not null,
  status         text         not null,
  provider_lane  text,
  cwd_label      text         not null default '',
  correlation_id text         not null,
  evidence_refs  jsonb        not null default '[]',
  cost_quota     jsonb,
  requested_at   timestamptz  not null,
  recorded_at    timestamptz  not null default now()
);

create index if not exists runtime_events_recorded_at_idx
  on runtime_events (recorded_at desc);

alter table runtime_events enable row level security;

create policy "anon_read" on runtime_events
  for select using (true);

-- Optional: enable INSERT for service_role (agent/CI hooks)
-- create policy "service_insert" on runtime_events
--   for insert with check (true);
