-- Create habits table for habit tracking functionality
CREATE TABLE IF NOT EXISTS public.habits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text DEFAULT 'general',
  frequency text DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  target_count integer DEFAULT 1, -- How many times per frequency period
  streak_count integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  color text DEFAULT '#8B5CF6', -- Hex color for the habit
  is_active boolean DEFAULT true,
  rule_id integer, -- Links to life rules (1, 2, or 3)
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create habit_entries table for tracking individual habit completions
CREATE TABLE IF NOT EXISTS public.habit_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completion_date date NOT NULL,
  completion_count integer DEFAULT 1, -- How many times completed on this date
  notes text,
  mood_rating integer CHECK (mood_rating >= 1 AND mood_rating <= 5), -- 1-5 scale
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create unique constraint to ensure one entry per habit per date
CREATE UNIQUE INDEX IF NOT EXISTS habit_entries_habit_date_unique 
ON public.habit_entries(habit_id, completion_date);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_active ON public.habits(is_active);
CREATE INDEX IF NOT EXISTS idx_habit_entries_user_id ON public.habit_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_entries_habit_id ON public.habit_entries(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_entries_date ON public.habit_entries(completion_date);
CREATE INDEX IF NOT EXISTS idx_habit_entries_user_date ON public.habit_entries(user_id, completion_date);

-- Enable row level security
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can insert their own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can update their own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can delete their own habits" ON public.habits;

DROP POLICY IF EXISTS "Users can view their own habit entries" ON public.habit_entries;
DROP POLICY IF EXISTS "Users can insert their own habit entries" ON public.habit_entries;
DROP POLICY IF EXISTS "Users can update their own habit entries" ON public.habit_entries;
DROP POLICY IF EXISTS "Users can delete their own habit entries" ON public.habit_entries;

-- Habits policies
CREATE POLICY "Users can view their own habits" 
ON public.habits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits" 
ON public.habits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits" 
ON public.habits
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits" 
ON public.habits
FOR DELETE
USING (auth.uid() = user_id);

-- Habit entries policies
CREATE POLICY "Users can view their own habit entries" 
ON public.habit_entries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habit entries" 
ON public.habit_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habit entries" 
ON public.habit_entries
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit entries" 
ON public.habit_entries
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to automatically update the updated_at timestamp for habits
CREATE OR REPLACE FUNCTION update_habits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_habits_updated_at ON public.habits;
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION update_habits_updated_at();

-- Create function to update habit streaks when entries are added/removed
CREATE OR REPLACE FUNCTION update_habit_streak()
RETURNS TRIGGER AS $$
DECLARE
  current_streak integer := 0;
  max_streak integer := 0;
  check_date date;
  found_entry boolean;
BEGIN
  -- Calculate current streak for the habit
  check_date := CURRENT_DATE;
  
  -- Check if there's an entry for today or yesterday to start streak calculation
  SELECT EXISTS(
    SELECT 1 FROM habit_entries 
    WHERE habit_id = COALESCE(NEW.habit_id, OLD.habit_id) 
    AND completion_date IN (CURRENT_DATE, CURRENT_DATE - INTERVAL '1 day')
  ) INTO found_entry;
  
  IF found_entry THEN
    -- Count backwards to find current streak
    LOOP
      SELECT EXISTS(
        SELECT 1 FROM habit_entries 
        WHERE habit_id = COALESCE(NEW.habit_id, OLD.habit_id) 
        AND completion_date = check_date
      ) INTO found_entry;
      
      IF found_entry THEN
        current_streak := current_streak + 1;
        check_date := check_date - INTERVAL '1 day';
      ELSE
        EXIT;
      END IF;
      
      -- Prevent infinite loop
      IF current_streak > 365 THEN
        EXIT;
      END IF;
    END LOOP;
  END IF;
  
  -- Calculate best streak
  SELECT COALESCE(MAX(streak_count), current_streak) INTO max_streak
  FROM habits 
  WHERE id = COALESCE(NEW.habit_id, OLD.habit_id);
  
  max_streak := GREATEST(max_streak, current_streak);
  
  -- Update the habit with new streak information
  UPDATE habits 
  SET 
    streak_count = current_streak,
    best_streak = max_streak,
    updated_at = now()
  WHERE id = COALESCE(NEW.habit_id, OLD.habit_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create triggers to update streaks when habit entries change
DROP TRIGGER IF EXISTS update_habit_streak_on_insert ON public.habit_entries;
CREATE TRIGGER update_habit_streak_on_insert
  AFTER INSERT ON public.habit_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_habit_streak();

DROP TRIGGER IF EXISTS update_habit_streak_on_delete ON public.habit_entries;
CREATE TRIGGER update_habit_streak_on_delete
  AFTER DELETE ON public.habit_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_habit_streak();
