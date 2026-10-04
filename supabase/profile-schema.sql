-- User profile data linked to Supabase Auth UID
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nickname text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  hsk_level integer default 0,
  words_learned integer default 0,
  lessons_completed integer default 0,
  updated_at timestamptz default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  theme text default 'system',
  language text default 'ru',
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.learning_progress enable row level security;
alter table public.user_settings enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can view own progress" on public.learning_progress for select using (auth.uid() = user_id);
create policy "Users can update own progress" on public.learning_progress for update using (auth.uid() = user_id);
create policy "Users can insert own progress" on public.learning_progress for insert with check (auth.uid() = user_id);

create policy "Users can view own settings" on public.user_settings for select using (auth.uid() = user_id);
create policy "Users can update own settings" on public.user_settings for update using (auth.uid() = user_id);
create policy "Users can insert own settings" on public.user_settings for insert with check (auth.uid() = user_id);


-- FSRS-6 cards: one card per user per Chinese word.
-- All timestamps are timestamptz (absolute instants, stored independently of device timezone).
create table if not exists public.fsrs_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  word text not null,
  due timestamptz not null,
  stability double precision not null default 0,
  difficulty double precision not null default 0,
  elapsed_days integer not null default 0,
  scheduled_days integer not null default 0,
  learning_steps integer not null default 0,
  reps integer not null default 0,
  lapses integer not null default 0,
  state smallint not null default 0,
  last_review timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, word)
);

create table if not exists public.fsrs_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  card_id uuid references public.fsrs_cards(id) on delete cascade not null,
  word text not null,
  answer text,
  rating smallint not null,
  state smallint not null,
  due timestamptz not null,
  stability double precision not null,
  difficulty double precision not null,
  elapsed_days integer not null,
  last_elapsed_days integer not null,
  scheduled_days integer not null,
  learning_steps integer not null,
  review timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists fsrs_cards_user_id_idx on public.fsrs_cards(user_id);
create index if not exists fsrs_cards_due_idx on public.fsrs_cards(user_id, due);
create index if not exists fsrs_reviews_user_id_idx on public.fsrs_reviews(user_id);
create index if not exists fsrs_reviews_card_id_idx on public.fsrs_reviews(card_id);
create index if not exists fsrs_reviews_review_idx on public.fsrs_reviews(user_id, review);

alter table public.fsrs_cards enable row level security;
alter table public.fsrs_reviews enable row level security;

create policy "Users can view own FSRS cards" on public.fsrs_cards
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own FSRS cards" on public.fsrs_cards
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own FSRS cards" on public.fsrs_cards
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own FSRS cards" on public.fsrs_cards
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can view own FSRS reviews" on public.fsrs_reviews
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own FSRS reviews" on public.fsrs_reviews
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can delete own FSRS reviews" on public.fsrs_reviews
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.fsrs_cards to authenticated;
grant select, insert, delete on public.fsrs_reviews to authenticated;
