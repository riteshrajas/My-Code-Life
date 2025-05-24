-- Create diary_entries table for daily diary functionality
CREATE TABLE IF NOT EXISTS public.diary_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create unique constraint to ensure one entry per user per date
CREATE UNIQUE INDEX IF NOT EXISTS diary_entries_user_date_unique 
ON public.diary_entries(user_id, entry_date);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_id ON public.diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_entry_date ON public.diary_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_date ON public.diary_entries(user_id, entry_date);

-- Enable row level security
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own diary entries" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can insert their own diary entries" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can update their own diary entries" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can delete their own diary entries" ON public.diary_entries;

-- Create policy that allows users to view only their own diary entries
CREATE POLICY "Users can view their own diary entries" 
ON public.diary_entries
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy that allows users to insert their own diary entries
CREATE POLICY "Users can insert their own diary entries" 
ON public.diary_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own diary entries
CREATE POLICY "Users can update their own diary entries" 
ON public.diary_entries
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to delete their own diary entries
CREATE POLICY "Users can delete their own diary entries" 
ON public.diary_entries
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_diary_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_diary_entries_updated_at ON public.diary_entries;
CREATE TRIGGER update_diary_entries_updated_at
  BEFORE UPDATE ON public.diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_diary_entries_updated_at();
