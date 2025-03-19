-- Skip agencies table creation since it already exists

-- Add agency_id to existing business_information table
alter table public.business_information 
add column agency_id uuid references public.agencies(id) on delete cascade,
add column name text;

-- Create user_website_access table for managing access
create table public.user_website_access (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  business_id text not null,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, business_id)
);

-- Add RLS policies
alter table public.user_website_access enable row level security;

-- Update business_information policies
create policy "Users can view websites they have access to"
  on public.business_information for select
  using (
    exists (
      select 1 from public.user_website_access
      where user_id = auth.uid()
      and business_id = id::text
    ) or auth.uid() = user_id
  );

-- Access policies
create policy "Users can view their access roles"
  on public.user_website_access for select
  using (auth.uid() = user_id);
