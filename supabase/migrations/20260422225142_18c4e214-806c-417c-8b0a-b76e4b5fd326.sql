create table if not exists public.deason_usage (
  user_id uuid not null,
  usage_date date not null default (now() at time zone 'utc')::date,
  message_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.deason_usage enable row level security;

create policy "Users can view their own deason usage"
on public.deason_usage for select
to authenticated
using (auth.uid() = user_id);

create policy "Service role manages deason usage"
on public.deason_usage for all
to public
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create or replace function public.increment_deason_usage(_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
  today date := (now() at time zone 'utc')::date;
begin
  insert into public.deason_usage (user_id, usage_date, message_count, updated_at)
  values (_user_id, today, 1, now())
  on conflict (user_id, usage_date)
  do update set message_count = public.deason_usage.message_count + 1,
                updated_at = now()
  returning message_count into new_count;
  return new_count;
end;
$$;