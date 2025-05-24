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
}

export async function createTask(taskData: Partial<Task>): Promise<Task | null> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Insert task
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
