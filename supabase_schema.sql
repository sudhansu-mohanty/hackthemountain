-- =====================================================================
-- BIOFORM AI - DATABASE SCHEMA MIGRATION
-- Database: Supabase PostgreSQL
-- =====================================================================

-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
    id uuid primary key, -- UUID generated client-side or from auth.users
    username text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

-- Policies for Profiles
create policy "Allow public read access on profiles"
    on public.profiles for select
    using (true);

create policy "Allow insert access on profiles"
    on public.profiles for insert
    with check (true);

create policy "Allow update access on profiles"
    on public.profiles for update
    using (true);


-- 2. POSTS TABLE
create table if not exists public.posts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    description text,
    media_url text not null,
    media_type text not null check (media_type in ('video', 'audio')),
    likes_count integer default 0 not null,
    dislikes_count integer default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Posts
alter table public.posts enable row level security;

-- Policies for Posts
create policy "Allow public read access on posts"
    on public.posts for select
    using (true);

create policy "Allow insert access on posts"
    on public.posts for insert
    with check (true);

create policy "Allow update access on posts"
    on public.posts for update
    using (true);


-- 3. COMMENTS TABLE
create table if not exists public.comments (
    id uuid primary key default gen_random_uuid(),
    post_id uuid references public.posts(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    text text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Comments
alter table public.comments enable row level security;

-- Policies for Comments
create policy "Allow public read access on comments"
    on public.comments for select
    using (true);

create policy "Allow insert access on comments"
    on public.comments for insert
    with check (true);


-- 4. AI REVIEWS TABLE
create table if not exists public.ai_reviews (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    exercise_type text not null,
    score integer not null,
    feedback_markdown text not null,
    media_url text, -- Link to the media scored by AI
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for AI Reviews
alter table public.ai_reviews enable row level security;

-- Policies for AI Reviews
create policy "Allow public read access on ai_reviews"
    on public.ai_reviews for select
    using (true);

create policy "Allow insert access on ai_reviews"
    on public.ai_reviews for insert
    with check (true);


-- =====================================================================
-- 5. STORAGE BUCKET CONFIGURATION ('community-media')
-- =====================================================================

-- Insert bucket into storage.buckets table
insert into storage.buckets (id, name, public)
values ('community-media', 'community-media', true)
on conflict (id) do nothing;

-- Set up policies for the community-media storage bucket
create policy "Allow public read access on community-media storage"
    on storage.objects for select
    using (bucket_id = 'community-media');

create policy "Allow public insert access on community-media storage"
    on storage.objects for insert
    with check (bucket_id = 'community-media');

create policy "Allow public delete access on community-media storage"
    on storage.objects for delete
    using (bucket_id = 'community-media');
