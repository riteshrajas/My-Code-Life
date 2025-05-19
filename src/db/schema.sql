-- Contact stories table to store interaction histories
create table public.contact_stories (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  formatted_content text,
  created_at timestamp with time zone default now() not null
);

-- Set up RLS (Row Level Security) for the contact_stories table
alter table public.contact_stories enable row level security;

-- Create policy to allow users to see only their own contact stories
create policy "Users can view their own contact stories"
  on public.contact_stories
  for select
  using (auth.uid() = user_id);

-- Create policy to allow users to insert their own contact stories
create policy "Users can insert their own contact stories"
  on public.contact_stories
  for insert
  with check (auth.uid() = user_id);

-- Create policy to allow users to update their own contact stories
create policy "Users can update their own contact stories"
  on public.contact_stories
  for update
  using (auth.uid() = user_id);

-- Create policy to allow users to delete their own contact stories
create policy "Users can delete their own contact stories"
  on public.contact_stories
  for delete
  using (auth.uid() = user_id);

-- Create index for faster lookups by contact_id
create index contact_stories_contact_id_idx on public.contact_stories (contact_id);

-- Create index for faster lookups by user_id
create index contact_stories_user_id_idx on public.contact_stories (user_id);

-- Add hierarchy fields to the contacts table

-- Add hierarchy column to identify which category the contact belongs to
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS hierarchy VARCHAR(50);

-- Add hierarchy_order column to allow ordering within a hierarchy
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS hierarchy_order INTEGER;

-- Create index on hierarchy column for faster filtering
CREATE INDEX IF NOT EXISTS contacts_hierarchy_idx ON contacts (hierarchy);

-- Create index on user_id and hierarchy for filtering by user and hierarchy
CREATE INDEX IF NOT EXISTS contacts_user_hierarchy_idx ON contacts (user_id, hierarchy);
