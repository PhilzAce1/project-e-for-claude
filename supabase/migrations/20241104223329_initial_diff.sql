
/**
* This trigger automatically creates a user entry when a new user signs up via Supabase Auth.
*/ 
create function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Store raw scraping responses
create table website_scrapes (
  id uuid default uuid_generate_v4() primary key,
  domain text not null,
  raw_html text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) not null,
  status text default 'pending'
);

-- Store analyzed business information
create table business_analyses (
  id uuid default uuid_generate_v4() primary key,
  domain text not null,
  scrape_id uuid references website_scrapes(id),
  initial_findings jsonb,
  information_needed jsonb,
  verification_questions jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) not null,
  status text default 'pending'
);

-- Create indexes for better query performance
create index website_scrapes_user_id_idx on website_scrapes(user_id);
create index website_scrapes_domain_idx on website_scrapes(domain);
create index business_analyses_user_id_idx on business_analyses(user_id);
create index business_analyses_domain_idx on business_analyses(domain);