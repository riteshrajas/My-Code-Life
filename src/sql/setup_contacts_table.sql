-- Create contacts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  company text,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  last_interaction timestamp with time zone,
  tags text[] DEFAULT '{}'::text[],
  user_id uuid REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON public.contacts(name);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);

-- Enable row level security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own contacts" ON public.contacts;

-- Create policy that allows users to see only their own contacts
CREATE POLICY "Users can manage their own contacts" 
ON public.contacts
FOR ALL
USING (auth.uid() = user_id);

-- Create policy that allows users to insert their own contacts
CREATE POLICY "Users can insert their own contacts"
ON public.contacts
FOR INSERT
WITH CHECK (auth.uid() = user_id);
