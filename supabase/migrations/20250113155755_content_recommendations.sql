-- Create content_recommendations table
do $$ 
begin
  if not exists (select from pg_tables where schemaname = 'public' and tablename = 'content_recommendations') then
    create table content_recommendations (
      id uuid default uuid_generate_v4() primary key,
      keyword text not null,
      serp_urls text[] not null,
      analysis jsonb not null,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      user_id uuid references auth.users(id) not null,
      status analysis_status default 'pending'::analysis_status,
      error_message text,
      last_updated timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- Enable RLS
    alter table content_recommendations enable row level security;

    -- Create indexes
    create index content_recommendations_user_id_idx on content_recommendations(user_id);
    create index content_recommendations_keyword_idx on content_recommendations(keyword);
    create index content_recommendations_created_at_idx on content_recommendations(created_at);

    -- Create RLS policies
    create policy "Users can view their own content recommendations"
      on content_recommendations for select
      using (auth.uid() = user_id);

    create policy "Users can insert their own content recommendations"
      on content_recommendations for insert
      with check (auth.uid() = user_id);

    create policy "Users can update their own content recommendations"
      on content_recommendations for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);

    create policy "Users can delete their own content recommendations"
      on content_recommendations for delete
      using (auth.uid() = user_id);

    -- Create last_updated trigger
    create trigger update_content_recommendations_last_updated
      before update on content_recommendations
      for each row
      execute function update_last_updated_column();
  end if;
end $$;

-- Grant permissions
grant all on content_recommendations to authenticated;
