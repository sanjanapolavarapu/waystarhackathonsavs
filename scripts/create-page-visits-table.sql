create table if not exists public.page_visits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid null,
  page_id uuid null,
  page_slug text not null,
  visited_at timestamptz not null default now()
);

create index if not exists page_visits_org_idx on public.page_visits (organization_id);
create index if not exists page_visits_slug_idx on public.page_visits (page_slug);
create index if not exists page_visits_visited_at_idx on public.page_visits (visited_at desc);
