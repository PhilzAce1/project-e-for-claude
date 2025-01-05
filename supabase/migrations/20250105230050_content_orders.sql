create table if not exists public.content_orders (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    keyword text not null,
    competition_level text not null,
    search_volume text not null,
    search_intent text not null,
    status text not null default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.content_orders enable row level security;

-- Allow users to view their own content orders
create policy "Users can view their own content orders"
on public.content_orders for select
using (auth.uid() = user_id);

-- Allow service role to create content orders
create policy "Service role can create content orders"
on public.content_orders for insert
to service_role
with check (true);

-- Allow service role to update content orders
create policy "Service role can update content orders"
on public.content_orders for update
to service_role
using (true);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Add trigger to automatically update updated_at
create trigger handle_content_orders_updated_at
    before update on public.content_orders
    for each row
    execute function public.handle_updated_at();

-- Add indexes
create index content_orders_user_id_idx on public.content_orders(user_id);
create index content_orders_status_idx on public.content_orders(status);