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
