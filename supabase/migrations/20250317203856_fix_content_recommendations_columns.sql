-- Drop existing functions
drop function if exists get_user_content_recommendations(uuid);
drop function if exists get_user_content_recommendations();

-- Create function with business_id parameter
create or replace function get_user_content_recommendations(business_id_param uuid)
returns table (
    id uuid,
    created_at timestamptz,
    keyword text,
    title text,
    outline text,
    status text,
    business_id uuid,
    user_id uuid
) 
language plpgsql
security definer
as $$
begin
    return query
    select 
        cr.id,
        cr.created_at,
        cr.keyword,
        cr.title,
        cr.outline,
        cr.status,
        cr.business_id,
        cr.user_id
    from content_recommendations cr
    where cr.business_id = business_id_param
    order by cr.created_at desc;
end;
$$;

-- Create function without parameters (uses auth.uid())
create or replace function get_user_content_recommendations()
returns table (
    id uuid,
    created_at timestamptz,
    keyword text,
    title text,
    outline text,
    status text,
    business_id uuid,
    user_id uuid
) 
language plpgsql
security definer
as $$
begin
    return query
    select 
        cr.id,
        cr.created_at,
        cr.keyword,
        cr.title,
        cr.outline,
        cr.status,
        cr.business_id,
        cr.user_id
    from content_recommendations cr
    where cr.user_id = auth.uid()
    order by cr.created_at desc;
end;
$$; 