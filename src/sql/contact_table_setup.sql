-- Check if contacts table exists and create if not
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

-- Check if user_id column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'contacts'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.contacts ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Make sure RLS is enabled
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can manage their own contacts" ON public.contacts;

-- Create the policy with the proper user_id reference
CREATE POLICY "Users can manage their own contacts"
ON public.contacts
FOR ALL
USING (auth.uid() = user_id);

-- Create index for performance on user_id lookups
CREATE INDEX IF NOT EXISTS contacts_user_id_idx ON public.contacts (user_id);
