-- Check and create website_scrapes table if it doesn't exist
do $$ 
begin
  if not exists (select from pg_tables where schemaname = 'public' and tablename = 'website_scrapes') then
    create table website_scrapes (
      id uuid default uuid_generate_v4() primary key,
      domain text not null,
      raw_html text,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      user_id uuid references auth.users(id) not null,
      status text default 'pending',
      error_message text,
      last_updated timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- Enable RLS
    alter table website_scrapes enable row level security;

    -- Create indexes
    create index website_scrapes_user_id_idx on website_scrapes(user_id);
    create index website_scrapes_domain_idx on website_scrapes(domain);
  end if;
end $$;

-- Check and create business_analyses table if it doesn't exist
do $$ 
begin
  if not exists (select from pg_tables where schemaname = 'public' and tablename = 'business_analyses') then
    create table business_analyses (
      id uuid default uuid_generate_v4() primary key,
      domain text not null,
      scrape_id uuid references website_scrapes(id),
      initial_findings jsonb,
      information_needed jsonb,
      verification_questions jsonb,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      user_id uuid references auth.users(id) not null,
      status text default 'pending',
      error_message text,
      last_updated timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- Enable RLS
    alter table business_analyses enable row level security;

    -- Create indexes
    create index business_analyses_user_id_idx on business_analyses(user_id);
    create index business_analyses_domain_idx on business_analyses(domain);
  end if;
end $$;

-- Check and create RLS policies if they don't exist
do $$ 
begin
  -- Website scrapes policies
  if not exists (select from pg_policies where tablename = 'website_scrapes' and policyname = 'Users can view their own website scrapes') then
    create policy "Users can view their own website scrapes"
      on website_scrapes for select
      using (auth.uid() = user_id);
  end if;

  if not exists (select from pg_policies where tablename = 'website_scrapes' and policyname = 'Users can insert their own website scrapes') then
    create policy "Users can insert their own website scrapes"
      on website_scrapes for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (select from pg_policies where tablename = 'website_scrapes' and policyname = 'Users can update their own website scrapes') then
    create policy "Users can update their own website scrapes"
      on website_scrapes for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (select from pg_policies where tablename = 'website_scrapes' and policyname = 'Users can delete their own website scrapes') then
    create policy "Users can delete their own website scrapes"
      on website_scrapes for delete
      using (auth.uid() = user_id);
  end if;

  -- Business analyses policies
  if not exists (select from pg_policies where tablename = 'business_analyses' and policyname = 'Users can view their own business analyses') then
    create policy "Users can view their own business analyses"
      on business_analyses for select
      using (auth.uid() = user_id);
  end if;

  if not exists (select from pg_policies where tablename = 'business_analyses' and policyname = 'Users can insert their own business analyses') then
    create policy "Users can insert their own business analyses"
      on business_analyses for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (select from pg_policies where tablename = 'business_analyses' and policyname = 'Users can update their own business analyses') then
    create policy "Users can update their own business analyses"
      on business_analyses for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (select from pg_policies where tablename = 'business_analyses' and policyname = 'Users can delete their own business analyses') then
    create policy "Users can delete their own business analyses"
      on business_analyses for delete
      using (auth.uid() = user_id);
  end if;
end $$;

-- Check and create last_updated function if it doesn't exist
create or replace function update_last_updated_column()
returns trigger as $$
begin
  new.last_updated = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Check and create triggers if they don't exist
do $$
begin
  if not exists (select from pg_trigger where tgname = 'update_website_scrapes_last_updated') then
    create trigger update_website_scrapes_last_updated
      before update on website_scrapes
      for each row
      execute function update_last_updated_column();
  end if;

  if not exists (select from pg_trigger where tgname = 'update_business_analyses_last_updated') then
    create trigger update_business_analyses_last_updated
      before update on business_analyses
      for each row
      execute function update_last_updated_column();
  end if;
end $$;

-- Check and create analysis_status type if it doesn't exist
do $$
begin
  if not exists (select from pg_type where typname = 'analysis_status') then
    create type analysis_status as enum ('pending', 'processing', 'completed', 'failed');
    
    -- First remove the default value if it exists
    alter table website_scrapes alter column status drop default;
    alter table business_analyses alter column status drop default;
    
    -- Then convert the column type
    alter table website_scrapes alter column status type analysis_status using status::text::analysis_status;
    alter table business_analyses alter column status type analysis_status using status::text::analysis_status;
    
    -- Finally, set the default value with the new type
    alter table website_scrapes alter column status set default 'pending'::analysis_status;
    alter table business_analyses alter column status set default 'pending'::analysis_status;
  end if;
end $$;

-- Add constraints if they don't exist
do $$
begin
  if not exists (select from pg_constraint where conname = 'valid_domain' and conrelid = 'website_scrapes'::regclass) then
    alter table website_scrapes 
      add constraint valid_domain check (domain ~* '^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$');
  end if;

  if not exists (select from pg_constraint where conname = 'valid_domain' and conrelid = 'business_analyses'::regclass) then
    alter table business_analyses
      add constraint valid_domain check (domain ~* '^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$');
  end if;
end $$;

-- Grant permissions
grant usage on schema public to authenticated;
grant all on website_scrapes to authenticated;
grant all on business_analyses to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Create cleanup function
create or replace function cleanup_old_analyses()
returns void as $$
begin
  delete from website_scrapes
  where created_at < now() - interval '30 days';
end;
$$ language plpgsql;

-- Uncomment to schedule cleanup (requires pg_cron extension)
-- select cron.schedule('0 0 * * *', $$select cleanup_old_analyses()$$);