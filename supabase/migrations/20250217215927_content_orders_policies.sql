-- Drop existing policies
drop policy if exists "Users can create their own content orders" on public.content_orders;
drop policy if exists "Users can view their own content orders" on public.content_orders;
drop policy if exists "Users can update their own content orders" on public.content_orders;

-- Enable RLS on content_orders table
alter table public.content_orders enable row level security;

-- Allow users to insert their own orders
create policy "Users can create their own content orders"
on public.content_orders
for insert
to authenticated
with check (auth.uid() = user_id);

-- Allow users to view their own orders
create policy "Users can view their own content orders"
on public.content_orders
for select
to authenticated
using (auth.uid() = user_id);

-- Allow users to update their own orders
create policy "Users can update their own content orders"
on public.content_orders
for update
to authenticated
using (auth.uid() = user_id); 