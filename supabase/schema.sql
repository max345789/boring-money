create table if not exists public.subscribers (
  id bigserial primary key,
  first_name text,
  email text not null,
  source text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscribers_email_unique_idx
  on public.subscribers ((lower(email)));

create or replace function public.set_subscribers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscribers_touch_updated_at on public.subscribers;
create trigger subscribers_touch_updated_at
before update on public.subscribers
for each row
execute function public.set_subscribers_updated_at();

create table if not exists public.inquiries (
  id bigserial primary key,
  name text not null,
  email text not null,
  company text,
  message text not null,
  source text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx
  on public.inquiries (created_at desc);
