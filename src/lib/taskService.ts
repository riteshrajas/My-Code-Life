import supabase from './supabaseClient';

export interface Task {
  id?: string;
  user_id?: string;
  title: string;
  description: string;
  main_topic: string;
  sub_topic: string;
  location: string | null;
  due_date: string | null;
  due_time: string | null;
  is_holiday: boolean;
  holiday_name: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  rule_id: number;
  gemini_analysis: any;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  // Habit-specific fields
  is_habit?: boolean;
  habit_frequency?: 'daily' | 'weekly' | 'monthly' | 'custom';
  habit_target_count?: number;
  habit_streak_count?: number;
  habit_best_streak?: number;
  habit_color?: string;
  habit_category?: string;
}

export interface HabitCompletion {
  id?: string;
  user_id: string;
  task_id: string;
  completion_date: string;
  completion_count: number;
  notes?: string;
  mood_rating?: number;
  created_at?: string;
}

export interface TaskWithHabitData extends Task {
  completedToday?: boolean;
  completionPercentage?: number;
  recentCompletions?: HabitCompletion[];
}

export async function createTask(taskData: Partial<Task>): Promise<Task | null> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // If it's a recurring habit, create multiple tasks
    if (taskData.is_habit && taskData.habit_frequency === 'daily' && taskData.due_date) {
        const tasksToCreate = [];
        const startDate = new Date();
        const endDate = new Date(taskData.due_date);
        
        // Extract details from gemini_analysis if available
        const analysis = taskData.gemini_analysis || {};
        const description = analysis.description || taskData.description || '';

        const taskDetails = {
            ...taskData,
            priority: analysis.priority || taskData.priority || 'medium',
            main_topic: analysis.category?.split('→')[0]?.trim() || taskData.main_topic || 'Habit',
            sub_topic: analysis.category?.split('→')[1]?.trim() || taskData.sub_topic || 'General',
            location: analysis.location || taskData.location || null,
            user_id: user.id,
        };

        // Create a task for each day from today until the due date
        for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
            // Create tasks for each time slot
            const timeSlots = description.match(/(\d{1,2}:\d{2}\s?[AP]M\s?to\s?\d{1,2}:\d{2}\s?[AP]M)/g) || [];
            
            if (timeSlots.length > 0) {
                for (const slot of timeSlots) {
                    const [startTime, endTime] = slot.split(' to ');
                    tasksToCreate.push({
                        ...taskDetails,
                        title: `${taskData.title} - Study Session`,
                        description: `Study from ${startTime} to ${endTime}`,
                        due_date: new Date(d).toISOString().split('T')[0],
                        due_time: startTime.trim(),
                    });
                }
            } else {
                tasksToCreate.push({
                    ...taskDetails,
                    title: `${taskData.title}`,
                    description: description,
                    due_date: new Date(d).toISOString().split('T')[0],
                });
            }
        }
        
        // Create a separate task for the final exam
        if (analysis.due_date && analysis.due_time) {
             tasksToCreate.push({
                ...taskDetails,
                title: `${taskData.title} - FINAL EXAM`,
                description: `Check-in at ${analysis.due_time} for the exam from 9:00 AM to 12:00 PM.`,
                due_date: analysis.due_date,
                due_time: analysis.due_time,
                is_habit: false, // This is a one-time event
             });
        }


      const { data, error } = await supabase.from('tasks').insert(tasksToCreate).select();
      
      if (error) {
        console.error('Error creating recurring tasks:', error);
        throw error;
      }
      return data?.[0] ?? null; // Return the first created task

    } else {
        // Insert single task
        const { data, error } = await supabase
          .from('tasks')
          .insert([
            {
              ...taskData,
              user_id: user.id
            }
          ])
          .select()
          .single();

        if (error) {
          console.error('Error creating task:', error);
          throw error;
        }
        return data;
    }
  } catch (error) {
    console.error('Error in createTask:', error);
    return null;
  }
}

export async function getTasks(): Promise<Task[] | null> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Fetch tasks
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getTasks:', error);
    return null;
  }
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Update task
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateTask:', error);
    return null;
  }
}

export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Delete task
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteTask:', error);
    return false;
  }
}

export async function getTasksByRule(ruleId: number): Promise<Task[] | null> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Fetch tasks by rule
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('rule_id', ruleId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks by rule:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getTasksByRule:', error);
    return null;
  }
}

export async function getTasksDueToday(): Promise<Task[] | null> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const today = new Date().toISOString().split('T')[0];

    // Fetch tasks due today
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('due_date', today)
      .neq('status', 'completed')
      .order('due_time', { ascending: true });

    if (error) {
      console.error('Error fetching tasks due today:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getTasksDueToday:', error);
    return null;
  }
}

export async function getOverdueTasks(): Promise<Task[] | null> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const today = new Date().toISOString().split('T')[0];

    // Fetch overdue tasks
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .lt('due_date', today)
      .neq('status', 'completed')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching overdue tasks:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getOverdueTasks:', error);
    return null;
  }
}

export async function getTaskStats(): Promise<{
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  overdue: number;
} | null> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const today = new Date().toISOString().split('T')[0];

    // Fetch all user tasks
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('status, due_date')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching task stats:', error);
      throw error;
    }

    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      overdue: tasks.filter(t => 
        t.due_date && 
        t.due_date < today && 
        t.status !== 'completed'
      ).length
    };

    return stats;
  } catch (error) {
    console.error('Error in getTaskStats:', error);
    return null;
  }
}

// Habit-specific functions

export async function createHabitTask(habitData: {
  title: string;
  description: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  target_count: number;
  color: string;
  rule_id: number | null;
}): Promise<Task | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const taskData = {
      title: habitData.title,
      description: habitData.description,
      main_topic: 'Habit',
      sub_topic: habitData.category,
      location: null,
      due_date: null,
      due_time: null,
      is_holiday: false,
      holiday_name: null,
      status: 'pending' as const,
      priority: 'medium' as const,
      rule_id: habitData.rule_id || 0,
      gemini_analysis: { type: 'habit', category: habitData.category },
      // Habit-specific fields
      is_habit: true,
      habit_frequency: habitData.frequency,
      habit_target_count: habitData.target_count,
      habit_streak_count: 0,
      habit_best_streak: 0,
      habit_color: habitData.color,
      habit_category: habitData.category,
      user_id: user.id
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating habit task:', error);
    return null;
  }
}

export async function getHabitTasks(date?: string): Promise<TaskWithHabitData[] | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get habit tasks
    const { data: habits, error: habitsError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_habit', true)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    if (habitsError) throw habitsError;
    if (!habits) return [];

    // Get completions for the target date
    const { data: completions, error: completionsError } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', user.id)
      .eq('completion_date', targetDate);

    if (completionsError) throw completionsError;

    // Combine habits with completion data
    const habitsWithData: TaskWithHabitData[] = habits.map(habit => {
      const habitCompletions = (completions || []).filter(c => c.task_id === habit.id);
      const completedToday = habitCompletions.length > 0;
      const completionCount = habitCompletions.reduce((sum, c) => sum + c.completion_count, 0);
      const completionPercentage = Math.min((completionCount / (habit.habit_target_count || 1)) * 100, 100);

      return {
        ...habit,
        completedToday,
        completionPercentage,
        recentCompletions: habitCompletions
      };
    });

    return habitsWithData;
  } catch (error) {
    console.error('Error fetching habit tasks:', error);
    return null;
  }
}

export async function toggleHabitCompletion(taskId: string, date?: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Check if completion already exists
    const { data: existingCompletion, error: fetchError } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('task_id', taskId)
      .eq('completion_date', targetDate)
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingCompletion) {
      // Remove completion (toggle off)
      const { error: deleteError } = await supabase
        .from('habit_completions')
        .delete()
        .eq('id', existingCompletion.id);

      if (deleteError) throw deleteError;
    } else {
      // Add completion (toggle on)
      const { error: insertError } = await supabase
        .from('habit_completions')
        .insert({
          task_id: taskId,
          user_id: user.id,
          completion_date: targetDate,
          completion_count: 1
        });

      if (insertError) throw insertError;
    }

    return true;
  } catch (error) {
    console.error('Error toggling habit completion:', error);
    return false;
  }
}

export async function getHabitInsights(): Promise<{
  totalHabits: number;
  activeStreaks: number;
  completedToday: number;
  bestStreak: number;
} | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get habit tasks
    const { data: habits, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_habit', true)
      .neq('status', 'cancelled');

    if (error) throw error;

    const totalHabits = habits?.length || 0;
    const activeStreaks = habits?.filter(h => (h.habit_streak_count || 0) > 0).length || 0;
    const bestStreak = Math.max(...(habits?.map(h => h.habit_best_streak || 0) || [0]));

    // Get today's completions
    const today = new Date().toISOString().split('T')[0];
    const { data: todayCompletions, error: todayError } = await supabase
      .from('habit_completions')
      .select('task_id')
      .eq('user_id', user.id)
      .eq('completion_date', today);

    if (todayError) throw todayError;

    const completedToday = new Set(todayCompletions?.map(c => c.task_id) || []).size;

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
