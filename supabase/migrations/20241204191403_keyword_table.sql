-- Create the keyword_suggestions table
create table public.keyword_suggestions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users not null,
    keyword text not null,
    search_volume int,
    difficulty float,
    relevance_score float,
    opportunity_score float,
    suggestion_type text,
    source text,
    status text default 'pending',
    created_at timestamp with time zone default now(),
    metadata jsonb default '{}'::jsonb
);

-- Enable RLS
alter table public.keyword_suggestions enable row level security;

-- Create indexes
create index keyword_suggestions_user_id_idx on public.keyword_suggestions(user_id);
create index keyword_suggestions_status_idx on public.keyword_suggestions(status);

-- Grant access to authenticated users
grant select, insert, update, delete on public.keyword_suggestions to authenticated;

-- RLS Policies

-- Allow users to view their own keyword suggestions
create policy "Users can view their own keyword suggestions"
    on public.keyword_suggestions
    for select
    to authenticated
    using (auth.uid() = user_id);

-- Allow users to create their own keyword suggestions
create policy "Users can create their own keyword suggestions"
    on public.keyword_suggestions
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Allow users to update their own keyword suggestions
create policy "Users can update their own keyword suggestions"
    on public.keyword_suggestions
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Allow users to delete their own keyword suggestions
create policy "Users can delete their own keyword suggestions"
    on public.keyword_suggestions
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- Allow service role to manage all keyword suggestions
create policy "Service role has full access to keyword suggestions"
    on public.keyword_suggestions
    for all
    to service_role
    using (true)
    with check (true);

-- Add comment to table
comment on table public.keyword_suggestions is 'Stores keyword suggestions generated from competitor analysis and business context';
