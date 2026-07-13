-- ==========================
-- Profiles
-- ==========================
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text unique,
    username text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ==========================
-- User Scores
-- ==========================
create table public.user_scores (
    user_id uuid primary key references public.profiles(id) on delete cascade,
    score integer not null default 0,
    win_count integer not null default 0,
    lose_count integer not null default 0,
    draw_count integer not null default 0,
    win_streak integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ==========================
-- Games History
-- ==========================
create table public.games (
    id bigint generated always as identity primary key,
    user_id uuid not null
        references public.profiles(id)
        on delete cascade,
    result text not null
        check (result in ('WIN','LOSE','DRAW')),
    score_change integer not null,
    created_at timestamptz not null default now()
);

-- ==========================
-- Index
-- ==========================

create index idx_games_user
on public.games(user_id);

create index idx_games_created
on public.games(created_at desc);

create index idx_scores_score
on public.user_scores(score desc);