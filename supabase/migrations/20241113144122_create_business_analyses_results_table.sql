-- Create enum for business categories (if not exists)
do $$ begin
    create type business_category as enum (
      'marketPosition',
      'technicalSpecifics',
      'coreBusiness',
      'customerJourney'
    );
exception
    when duplicate_object then null;
end $$;

-- Create the answers table
create table if not exists business_analysis_answers (
  id uuid default uuid_generate_v4() primary key,
  analysis_id uuid references business_analyses(id) on delete cascade,
  category business_category not null,
  field_name varchar not null,
  section varchar not null check (section in ('verification', 'critical', 'recommended')),
  answer jsonb,
  confidence float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Add composite unique constraint
  unique(analysis_id, field_name)
);

-- Create index for efficient category querying
create index if not exists idx_analysis_answers_category on business_analysis_answers(analysis_id, category);

-- Add RLS policies
alter table business_analysis_answers enable row level security;

do $$ begin
    create policy "Users can view their own analysis answers"
      on business_analysis_answers for select
      using (
        analysis_id in (
          select id from business_analyses
          where user_id = auth.uid()
        )
      );
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create policy "Users can insert their own analysis answers"
      on business_analysis_answers for insert
      with check (
        analysis_id in (
          select id from business_analyses
          where user_id = auth.uid()
        )
      );
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create policy "Users can update their own analysis answers"
      on business_analysis_answers for update
      using (
        analysis_id in (
          select id from business_analyses
          where user_id = auth.uid()
        )
      );
exception
    when duplicate_object then null;
end $$;

-- Add updated_at trigger
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on business_analysis_answers;
create trigger set_updated_at
  before update on business_analysis_answers
  for each row
  execute function handle_updated_at();
