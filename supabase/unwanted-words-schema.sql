-- Per-user words intentionally excluded from learning.
create table if not exists public.user_unwanted_words (
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, word)
);

alter table public.user_unwanted_words enable row level security;

create policy "Users can view own unwanted words" on public.user_unwanted_words
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can add own unwanted words" on public.user_unwanted_words
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own unwanted words" on public.user_unwanted_words
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can restore own unwanted words" on public.user_unwanted_words
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.user_unwanted_words to authenticated;
