insert into storage.buckets (id, name, public)
values ('cheetah-exports', 'cheetah-exports', true)
on conflict (id) do nothing;

create policy "Public read cheetah exports"
on storage.objects for select
to public
using (bucket_id = 'cheetah-exports');

create policy "Service role writes cheetah exports"
on storage.objects for insert
to public
with check (bucket_id = 'cheetah-exports' and auth.role() = 'service_role');