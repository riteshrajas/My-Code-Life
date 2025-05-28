-- Add habit support to the tasks table
-- This allows tasks to be flagged as habits and track habit-specific data

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS is_habit boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS habit_frequency text CHECK (habit_frequency IN ('daily', 'weekly', 'monthly', 'custom')) DEFAULT 'daily',
ADD COLUMN IF NOT EXISTS habit_target_count integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS habit_streak_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS habit_best_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS habit_color text DEFAULT '#8B5CF6',
ADD COLUMN IF NOT EXISTS habit_category text DEFAULT 'General';

-- Create habit_completions table for tracking daily habit completions
-- This is separate from the main tasks table because habits can be completed multiple times
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  completion_date date NOT NULL,
  completion_count integer DEFAULT 1,
  notes text,
  mood_rating integer CHECK (mood_rating >= 1 AND mood_rating <= 5),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create unique constraint to ensure one entry per habit-task per date
CREATE UNIQUE INDEX IF NOT EXISTS habit_completions_task_date_unique 
ON public.habit_completions(task_id, completion_date);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON public.habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_task_id ON public.habit_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON public.habit_completions(completion_date);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON public.habit_completions(user_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_tasks_is_habit ON public.tasks(is_habit);
CREATE INDEX IF NOT EXISTS idx_tasks_user_habit ON public.tasks(user_id, is_habit);

-- Enable row level security for habit_completions
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for habit_completions
DROP POLICY IF EXISTS "Users can view their own habit completions" ON public.habit_completions;
DROP POLICY IF EXISTS "Users can insert their own habit completions" ON public.habit_completions;
DROP POLICY IF EXISTS "Users can update their own habit completions" ON public.habit_completions;
DROP POLICY IF EXISTS "Users can delete their own habit completions" ON public.habit_completions;

CREATE POLICY "Users can view their own habit completions" 
ON public.habit_completions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habit completions" 
ON public.habit_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habit completions" 
ON public.habit_completions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit completions" 
ON public.habit_completions
FOR DELETE
USING (auth.uid() = user_id);

-- Function to update habit streaks when a completion is added
CREATE OR REPLACE FUNCTION update_habit_streak()
RETURNS TRIGGER AS $$
DECLARE
  current_streak integer := 0;
  best_streak integer := 0;
  check_date date;
  completion_found boolean;
BEGIN
  -- Only process for habit tasks
  IF (SELECT is_habit FROM public.tasks WHERE id = NEW.task_id) = false THEN
    RETURN NEW;
  END IF;

  -- Calculate current streak by going backwards from today
  check_date := CURRENT_DATE;
  current_streak := 0;
  
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.habit_completions 
      WHERE task_id = NEW.task_id 
      AND completion_date = check_date
      AND completion_count >= (SELECT habit_target_count FROM public.tasks WHERE id = NEW.task_id)
    ) INTO completion_found;
    
    IF completion_found THEN
      current_streak := current_streak + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
    
    -- Safety break to prevent infinite loop
    IF current_streak > 365 THEN
      EXIT;
    END IF;
  END LOOP;

  -- Get current best streak
  SELECT habit_best_streak INTO best_streak 
  FROM public.tasks 
  WHERE id = NEW.task_id;

  -- Update best streak if current is higher
  IF current_streak > best_streak THEN
    best_streak := current_streak;
  END IF;

  -- Update the task with new streak values
  UPDATE public.tasks 
  SET 
    habit_streak_count = current_streak,
    habit_best_streak = best_streak,
    updated_at = now()
  WHERE id = NEW.task_id;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update habit streaks
DROP TRIGGER IF EXISTS update_habit_streak_trigger ON public.habit_completions;
CREATE TRIGGER update_habit_streak_trigger
  AFTER INSERT OR UPDATE ON public.habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_habit_streak();

-- Function to clean up old habit completions (optional - keeps last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_habit_completions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.habit_completions 
  WHERE completion_date < CURRENT_DATE - INTERVAL '90 days';
END;
$$ language 'plpgsql';
