-- Drop existing policy if it exists
drop policy if exists "Users can view websites they have access to" on public.business_information;

-- Create updated policy that includes agency ownership
create policy "Users can view websites they have access to"
  on public.business_information for select
  using (
    exists (
      select 1 from public.user_website_access
      where user_id = auth.uid()
      and business_id = id::text
    ) 
    or auth.uid() = user_id
    or exists (
      select 1 from public.agencies
      where id = business_information.agency_id
      and owner_id = auth.uid()
    )
  ); 