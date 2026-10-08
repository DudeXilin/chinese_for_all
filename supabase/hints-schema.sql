-- Personal and developer learning-item hints.
-- item_key is intentionally unified: it can be one character or a multi-character word.

create table if not exists public.user_hints (
  user_id uuid references auth.users(id) on delete cascade not null,
  item_key text not null,
  hint text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

alter table public.user_hints enable row level security;

drop policy if exists "Users can view own hints" on public.user_hints;
create policy "Users can view own hints"
  on public.user_hints for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own hints" on public.user_hints;
create policy "Users can insert own hints"
  on public.user_hints for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own hints" on public.user_hints;
create policy "Users can update own hints"
  on public.user_hints for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own hints" on public.user_hints;
create policy "Users can delete own hints"
  on public.user_hints for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.user_hints to authenticated;
