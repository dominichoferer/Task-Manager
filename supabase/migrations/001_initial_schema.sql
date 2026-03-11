-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Companies table
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  abbreviation text not null check (char_length(abbreviation) <= 6),
  color text not null default '#6366f1',
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz not null default now()
);

-- Tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  due_date timestamptz,
  status text not null default 'open' check (status in ('open', 'in-progress', 'done')),
  category text not null default 'work' check (category in ('work', 'private')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_due_date_idx on public.tasks(due_date);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_category_idx on public.tasks(category);
create index if not exists companies_user_id_idx on public.companies(user_id);

-- Row Level Security (RLS)
alter table public.companies enable row level security;
alter table public.tasks enable row level security;

-- RLS Policies: Users can only access their own data
create policy "Users can view own companies"
  on public.companies for select
  using (auth.uid() = user_id);

create policy "Users can insert own companies"
  on public.companies for insert
  with check (auth.uid() = user_id);

create policy "Users can update own companies"
  on public.companies for update
  using (auth.uid() = user_id);

create policy "Users can delete own companies"
  on public.companies for delete
  using (auth.uid() = user_id);

create policy "Users can view own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);
