/// <reference types="vite/client" />

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://tjpaxrhqikqlhhvbzzyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcGF4cmhxaWtxbGhodmJ6enl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1ODczMDMsImV4cCI6MjA2MzE2MzMwM30.MfNDGS-GnfQq6nVMZ_cCsOqMiQHRgYdtOU7oteGastI';

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase

// SQL for setting up the contacts table in Supabase:
/*
create table public.contacts (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  phone text,
  address text,
  company text,
  notes text,
  created_at timestamp with time zone default now() not null,
  last_interaction timestamp with time zone,
  tags text[] default '{}'::text[]
);

-- Set up RLS policies
alter table public.contacts enable row level security;

-- Create a policy that allows authenticated users to see only their own contacts
create policy "Users can manage their own contacts"
on contacts for all
using (auth.uid() = user_id);

-- Add user_id column to link contacts to specific users
alter table public.contacts add column user_id uuid references auth.users(id);
*/
