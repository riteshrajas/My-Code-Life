import supabase from './supabaseClient';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  target_count: number;
  streak_count: number;
  best_streak: number;
  color: string;
  is_active: boolean;
  rule_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface HabitEntry {
  id: string;
  user_id: string;
  habit_id: string;
  completion_date: string;
  completion_count: number;
  notes: string | null;
  mood_rating: number | null;
  created_at: string;
}

export interface HabitWithEntries extends Habit {
  entries: HabitEntry[];
  completedToday: boolean;
  completionPercentage: number;
}

export async function createHabit(habitData: Partial<Habit>): Promise<Habit | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('habits')
      .insert({
        ...habitData,
        user_id: user.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating habit:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating habit:', error);
    return null;
  }
}

export async function getHabits(): Promise<Habit[] | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching habits:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching habits:', error);
    return null;
  }
}

export async function getHabitsWithEntries(date?: string): Promise<HabitWithEntries[] | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('No authenticated user');

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get habits
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (habitsError) {
      console.error('Error fetching habits:', habitsError);
      return null;
    }

    if (!habits || habits.length === 0) return [];

    // Get entries for the target date
    const { data: entries, error: entriesError } = await supabase
      .from('habit_entries')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('completion_date', targetDate);

    if (entriesError) {
      console.error('Error fetching habit entries:', entriesError);
      return null;
    }

    // Combine habits with their entries
    const habitsWithEntries: HabitWithEntries[] = habits.map(habit => {
      const habitEntries = (entries || []).filter(entry => entry.habit_id === habit.id);
      const completedToday = habitEntries.length > 0;
      const completionCount = habitEntries.reduce((sum, entry) => sum + entry.completion_count, 0);
      const completionPercentage = Math.min((completionCount / habit.target_count) * 100, 100);

      return {
        ...habit,
        entries: habitEntries,
        completedToday,
        completionPercentage
      };
    });

    return habitsWithEntries;
  } catch (error) {
    console.error('Error fetching habits with entries:', error);
    return null;
  }
}

export async function updateHabit(habitId: string, updates: Partial<Habit>): Promise<Habit | null> {
  try {
    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', habitId)
      .select()
      .single();

    if (error) {
      console.error('Error updating habit:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating habit:', error);
    return null;
  }
}

export async function deleteHabit(habitId: string): Promise<boolean> {
  try {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('habits')
      .update({ is_active: false })
      .eq('id', habitId);

    if (error) {
      console.error('Error deleting habit:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting habit:', error);
    return false;
  }
}

export async function createHabitEntry(entryData: Partial<HabitEntry>): Promise<HabitEntry | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('habit_entries')
      .insert({
        ...entryData,
        user_id: user.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating habit entry:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating habit entry:', error);
    return null;
  }
}

export async function updateHabitEntry(entryId: string, updates: Partial<HabitEntry>): Promise<HabitEntry | null> {
  try {
    const { data, error } = await supabase
      .from('habit_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();

    if (error) {
      console.error('Error updating habit entry:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating habit entry:', error);
    return null;
  }
}

export async function deleteHabitEntry(entryId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('habit_entries')
      .delete()
      .eq('id', entryId);

    if (error) {
      console.error('Error deleting habit entry:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting habit entry:', error);
    return false;
  }
}

export async function toggleHabitCompletion(habitId: string, date?: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('No authenticated user');

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Check if entry already exists for this date
    const { data: existingEntry, error: fetchError } = await supabase
      .from('habit_entries')
      .select('*')
      .eq('habit_id', habitId)
      .eq('completion_date', targetDate)
      .eq('user_id', user.user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing entry:', fetchError);
      return false;
    }

    if (existingEntry) {
      // Entry exists, remove it (toggle off)
      const { error: deleteError } = await supabase
        .from('habit_entries')
        .delete()
        .eq('id', existingEntry.id);

      if (deleteError) {
        console.error('Error deleting habit entry:', deleteError);
        return false;
      }
    } else {
      // Entry doesn't exist, create it (toggle on)
      const { error: insertError } = await supabase
        .from('habit_entries')
        .insert({
          habit_id: habitId,
          user_id: user.user.id,
          completion_date: targetDate,
          completion_count: 1
        });

      if (insertError) {
        console.error('Error creating habit entry:', insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error toggling habit completion:', error);
    return false;
  }
}

export async function getHabitStats(habitId: string, days: number = 30): Promise<{
  totalEntries: number;
  averageCompletions: number;
  consistency: number;
  recentEntries: HabitEntry[];
} | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('No authenticated user');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateString = startDate.toISOString().split('T')[0];

    const { data: entries, error } = await supabase
      .from('habit_entries')
      .select('*')
      .eq('habit_id', habitId)
      .eq('user_id', user.user.id)
      .gte('completion_date', startDateString)
      .order('completion_date', { ascending: false });

    if (error) {
      console.error('Error fetching habit stats:', error);
      return null;
    }

    const totalEntries = entries?.length || 0;
    const totalCompletions = entries?.reduce((sum, entry) => sum + entry.completion_count, 0) || 0;
    const averageCompletions = totalEntries > 0 ? totalCompletions / totalEntries : 0;
    const consistency = (totalEntries / days) * 100;

    return {
      totalEntries,
      averageCompletions,
      consistency,
      recentEntries: entries || []
    };
  } catch (error) {
    console.error('Error getting habit stats:', error);
    return null;
  }
}

export async function getHabitInsights(): Promise<{
  totalHabits: number;
  activeStreaks: number;
  completedToday: number;
  bestStreak: number;
} | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('No authenticated user');

    const { data: habits, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching habit insights:', error);
      return null;
    }

    const totalHabits = habits?.length || 0;
    const activeStreaks = habits?.filter(h => h.streak_count > 0).length || 0;
    const bestStreak = Math.max(...(habits?.map(h => h.best_streak) || [0]));

    // Get today's completions
    const today = new Date().toISOString().split('T')[0];
    const { data: todayEntries, error: todayError } = await supabase
      .from('habit_entries')
      .select('habit_id')
      .eq('user_id', user.user.id)
      .eq('completion_date', today);

    if (todayError) {
      console.error('Error fetching today\'s entries:', todayError);
      return null;
    }

    const completedToday = new Set(todayEntries?.map(e => e.habit_id) || []).size;

    return {
      totalHabits,
      activeStreaks,
      completedToday,
      bestStreak
    };
  } catch (error) {
    console.error('Error getting habit insights:', error);
    return null;
  }
}
