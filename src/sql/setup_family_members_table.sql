-- SQL for setting up the family_members table in Supabase

-- Create family_members table
create table public.family_members (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password_hash text not null,
  name text not null,
  profile_picture_url text,
  grade text,
  age integer,
  school text,
  hobbies text[],
  favorite_color text,
  bio text,
  relationship text not null, -- e.g., 'brother', 'sister', 'cousin', etc.
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  last_login timestamp with time zone,
  is_active boolean default true
);

-- Create status table for family members
create table public.family_member_status (
  id uuid default gen_random_uuid() primary key,
  family_member_id uuid references public.family_members(id) on delete cascade,
  status text not null default 'available', -- 'busy', 'available', 'do_not_disturb'
  status_message text,
  updated_at timestamp with time zone default now() not null
);

-- Create call_requests table for scheduling calls
create table public.call_requests (
  id uuid default gen_random_uuid() primary key,
  from_family_member_id uuid references public.family_members(id) on delete cascade,
  to_user_id uuid references auth.users(id) on delete cascade, -- Ritesh's user ID
  requested_time timestamp with time zone not null,
  message text,
  status text default 'pending', -- 'pending', 'accepted', 'declined', 'completed'
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.family_members enable row level security;
alter table public.family_member_status enable row level security;
alter table public.call_requests enable row level security;

-- RLS policies for family_members (allow all family members to read each other's info)
create policy "Family members can view all family member profiles"
on family_members for select
using (true);

create policy "Family members can update their own profile"
on family_members for update
using (true);

-- Allow anyone to register as a new family member (insert)
create policy "Anyone can register as a family member"
on family_members for insert
with check (true);

-- RLS policies for family_member_status
create policy "Family members can view all statuses"
on family_member_status for select
using (true);

create policy "Family members can update their own status"
on family_member_status for all
using (true);

-- RLS policies for call_requests
create policy "Family members can manage their own call requests"
on call_requests for all
using (true);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_family_members_updated_at
  before update on family_members
  for each row execute function update_updated_at_column();

create trigger update_family_member_status_updated_at
  before update on family_member_status
  for each row execute function update_updated_at_column();

create trigger update_call_requests_updated_at
  before update on call_requests
  for each row execute function update_updated_at_column();

-- Insert some sample family members (you can customize these)
insert into family_members (username, password_hash, name, relationship, grade, age, bio) values
('sister123', '$2a$10$example_hash_1', 'Priya', 'sister', '10th Grade', 16, 'Loves to paint and read books'),
('bro_cool', '$2a$10$example_hash_2', 'Arjun', 'brother', '8th Grade', 14, 'Sports enthusiast and video game lover'),
('cousin_sam', '$2a$10$example_hash_3', 'Samira', 'cousin', '12th Grade', 18, 'Preparing for college, loves music');

-- Insert default status for family members
insert into family_member_status (family_member_id, status, status_message)
select id, 'available', 'Online and ready to chat!'
from family_members;