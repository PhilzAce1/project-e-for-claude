-- Drop existing function and trigger
drop trigger if exists on_subscription_created on subscriptions;
drop function if exists public.handle_new_subscription();


-- Create function to handle new subscriptions
create function public.handle_new_subscription()
returns trigger as $$
declare
  credits_to_add int;
  product_metadata jsonb;
begin
  -- Get product info and log it
  select p.metadata into product_metadata
  from prices pr
  join products p on pr.product_id = p.id
  where pr.id = new.price_id;

  raise notice 'Product metadata: %', product_metadata;
  
  -- Extract and log credits
  credits_to_add := (product_metadata->>'content_credits')::int;
  raise notice 'Credits to add: %', credits_to_add;

  -- Update user credits
  update public.users
  set content_credits = coalesce(content_credits, 0) + coalesce(credits_to_add, 0)
  where id = new.user_id;
  
  raise notice 'Updated credits for user %', new.user_id;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to run on new subscription
create trigger on_subscription_created
  after insert on subscriptions
  for each row
  execute procedure public.handle_new_subscription();
