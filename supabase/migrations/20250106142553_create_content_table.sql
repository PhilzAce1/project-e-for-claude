-- Create the content table
create table "public"."content" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "url" text not null,
    "target_keyword" text not null,
    "secondary_keywords" text[] not null default '{}',
    "title" text not null,
    "status" text not null default 'draft',
    constraint "content_pkey" primary key ("id")
);

-- Set up Row Level Security (RLS)
alter table "public"."content" enable row level security;

-- Create policies
-- Allow users to view their own content
create policy "Users can view own content"
    on "public"."content"
    for select
    using (auth.uid() = user_id);

-- Allow users to insert their own content
create policy "Users can insert own content"
    on "public"."content"
    for insert
    with check (auth.uid() = user_id);

-- Allow users to update their own content
create policy "Users can update own content"
    on "public"."content"
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Allow users to delete their own content
create policy "Users can delete own content"
    on "public"."content"
    for delete
    using (auth.uid() = user_id);

-- Create indexes
create index "content_user_id_idx" on "public"."content" ("user_id");
create index "content_status_idx" on "public"."content" ("status");
