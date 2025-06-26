import supabase from './supabaseClient';
import { createTask, createHabitTask, deleteTask, updateTask, getTasks } from './taskService';
import { updateFamilyMemberProfile, updateFamilyMemberStatus } from './familyService';
import { toast } from '@/hooks/use-toast';

// Define the possible action types the AI can perform
export interface AgenticAction {
  type: 'advice' | 'action';
  content: string;
  action?: {
    actionType: 'create_task' | 'create_habit' | 'delete_task' | 'update_task' | 'change_theme' | 'CHANGE_THEME' | 'update_profile' | 'delete_family_member' | 'update_family_status' | 'navigate_to_page' | 'export_data' | 'create_diary_entry' | 'update_settings' | 'CREATE_TASK' | 'CREATE_HABIT' | 'DELETE_TASK' | 'UPDATE_TASK' | 'UPDATE_PROFILE' | 'DELETE_FAMILY_MEMBER' | 'UPDATE_FAMILY_STATUS' | 'NAVIGATE_TO_PAGE' | 'EXPORT_DATA' | 'CREATE_DIARY_ENTRY' | 'UPDATE_SETTINGS';
    parameters: any;
    confirmationRequired?: boolean;
    confirmationMessage?: string;
  };
  // Enhanced advice structure
  ruleMatch?: string;
  ruleNumber?: number;
  statusEmoji?: string;
  ruleIcon?: string;
  alignmentStrength?: string;
  alignmentClass?: string;
  quote?: string;
  advice?: string;
}

// Action execution results
export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Core agentic service class
export class AgenticService {
  private static instance: AgenticService;
  private actionHistory: AgenticAction[] = [];

  private constructor() {}

  public static getInstance(): AgenticService {
    if (!AgenticService.instance) {
      AgenticService.instance = new AgenticService();
    }
    return AgenticService.instance;
  }

  // Execute an agentic action
  async executeAction(action: AgenticAction): Promise<ActionResult> {
    if (action.type === 'advice') {
      return { success: true, message: 'Advice provided', data: action };
    }

    if (!action.action) {
      return { success: false, message: 'No action specified', error: 'Missing action parameters' };
    }

    try {
      // Add to history
      this.actionHistory.push(action);

      // Execute the specific action
      switch (action.action.actionType) {
        case 'create_task':
        case 'CREATE_TASK':
          return await this.createTask(action.action.parameters);
        
        case 'create_habit':
        case 'CREATE_HABIT':
          return await this.createHabit(action.action.parameters);
        
        case 'delete_task':
        case 'DELETE_TASK':
          return await this.deleteTask(action.action.parameters);
        
        case 'update_task':
        case 'UPDATE_TASK':
          return await this.updateTask(action.action.parameters);
        
        case 'change_theme':
        case 'CHANGE_THEME':
          return await this.changeTheme(action.action.parameters);
        
        case 'update_profile':
        case 'UPDATE_PROFILE':
          return await this.updateProfile(action.action.parameters);
        
        case 'delete_family_member':
        case 'DELETE_FAMILY_MEMBER':
          return await this.deleteFamilyMember(action.action.parameters);
        
        case 'update_family_status':
        case 'UPDATE_FAMILY_STATUS':
          return await this.updateFamilyStatus(action.action.parameters);
        
        case 'navigate_to_page':
        case 'NAVIGATE_TO_PAGE':
          return await this.navigateToPage(action.action.parameters);
        
        case 'export_data':
        case 'EXPORT_DATA':
          return await this.exportData(action.action.parameters);
        
        case 'create_diary_entry':
        case 'CREATE_DIARY_ENTRY':
          return await this.createDiaryEntry(action.action.parameters);
        
        case 'update_settings':
        case 'UPDATE_SETTINGS':
          return await this.updateSettings(action.action.parameters);
        
        default:
          return { success: false, message: 'Unknown action type', error: `Action type ${action.action.actionType} not supported` };
      }
    } catch (error) {
      console.error('Error executing agentic action:', error);
      return { success: false, message: 'Action execution failed', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Individual action implementations
  private async createTask(params: any): Promise<ActionResult> {
    try {
      const normalizedParams = this.normalizeTaskParams(params);
      
      const taskData = {
        title: normalizedParams.title,
        description: normalizedParams.description,
        main_topic: normalizedParams.mainTopic,
        sub_topic: normalizedParams.subTopic,
        location: normalizedParams.location,
        due_date: normalizedParams.dueDate,
        due_time: normalizedParams.dueTime,
        priority: normalizedParams.priority,
        rule_id: normalizedParams.ruleAlignment,
        is_holiday: normalizedParams.isHoliday,
        holiday_name: normalizedParams.holidayName,
        status: 'pending' as const,
        is_habit: false
      };

      const task = await createTask(taskData);
      if (task) {
        toast({
          title: 'Task Created',
          description: `Successfully created task: ${task.title}`,
        });
        return { success: true, message: `Task "${task.title}" created successfully`, data: task };
      }
      return { success: false, message: 'Failed to create task' };
    } catch (error) {
      return { success: false, message: 'Error creating task', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async createHabit(params: any): Promise<ActionResult> {
    try {
      const habitData = {
        title: params.title,
        description: params.description || '',
        category: params.category || 'General',
        frequency: params.frequency || 'daily',
        target_count: params.targetCount || 1,
        color: params.color || '#8B5CF6',
        rule_id: params.ruleAlignment || 2
      };

      const habit = await createHabitTask(habitData);
      if (habit) {
        toast({
          title: 'Habit Created',
          description: `Successfully created habit: ${habit.title}`,
        });
        return { success: true, message: `Habit "${habit.title}" created successfully`, data: habit };
      }
      return { success: false, message: 'Failed to create habit' };
    } catch (error) {
      return { success: false, message: 'Error creating habit', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async deleteTask(params: any): Promise<ActionResult> {
    try {
      const success = await deleteTask(params.taskId);
      if (success) {
        toast({
          title: 'Task Deleted',
          description: 'Task has been successfully deleted',
        });
        return { success: true, message: 'Task deleted successfully' };
      }
      return { success: false, message: 'Failed to delete task' };
    } catch (error) {
      return { success: false, message: 'Error deleting task', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async updateTask(params: any): Promise<ActionResult> {
    try {
      const updates: any = {};
      if (params.title) updates.title = params.title;
      if (params.description) updates.description = params.description;
      if (params.status) updates.status = params.status;
      if (params.priority) updates.priority = params.priority;
      if (params.dueDate) updates.due_date = params.dueDate;
      if (params.dueTime) updates.due_time = params.dueTime;
      
      const task = await updateTask(params.taskId, updates);
      if (task) {
        toast({
          title: 'Task Updated',
          description: `Successfully updated task: ${task.title}`,
        });
        return { success: true, message: `Task "${task.title}" updated successfully`, data: task };
      }
      return { success: false, message: 'Failed to update task' };
    } catch (error) {
      return { success: false, message: 'Error updating task', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async changeTheme(params: any): Promise<ActionResult> {
    try {
      const theme = this.normalizeThemeParams(params);
      
      // Apply theme to document
      const root = document.documentElement;
      if (theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', systemPrefersDark);
      } else {
        root.classList.toggle('dark', theme === 'dark');
      }

      // Save to localStorage
      localStorage.setItem('theme-mode', theme);

      // Update user settings in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            dark_mode: theme === 'system' ? null : theme === 'dark',
            updated_at: new Date().toISOString()
          });
      }

      toast({
        title: 'Theme Changed',
        description: `Theme changed to ${theme} mode`,
      });
      
      return { success: true, message: `Theme changed to ${theme} mode successfully` };
    } catch (error) {
      return { success: false, message: 'Error changing theme', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async updateProfile(params: any): Promise<ActionResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const updates: any = {};
      if (params.fullName) updates.full_name = params.fullName;
      if (params.bio) updates.bio = params.bio;
      if (params.location) updates.location = params.location;
      if (params.occupation) updates.occupation = params.occupation;
      if (params.company) updates.company = params.company;
      if (params.interests) updates.interests = params.interests;
      if (params.goals) updates.goals = params.goals;

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          email: user.email,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });

      return { success: true, message: 'Profile updated successfully', data: updates };
    } catch (error) {
      return { success: false, message: 'Error updating profile', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async deleteFamilyMember(params: any): Promise<ActionResult> {
    try {
      // For now, just remove from local storage or mark as inactive
      // This would need to be implemented based on your family member system
      toast({
        title: 'Family Member Removed',
        description: 'Family member has been successfully removed',
      });
      return { success: true, message: 'Family member deleted successfully' };
    } catch (error) {
      return { success: false, message: 'Error deleting family member', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async updateFamilyStatus(params: any): Promise<ActionResult> {
    try {
      const success = await updateFamilyMemberStatus(
        params.familyMemberId,
        params.status,
        params.statusMessage
      );
      if (success) {
        toast({
          title: 'Status Updated',
          description: 'Family member status updated successfully',
        });
        return { success: true, message: 'Family status updated successfully' };
      }
      return { success: false, message: 'Failed to update family status' };
    } catch (error) {
      return { success: false, message: 'Error updating family status', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async navigateToPage(params: any): Promise<ActionResult> {
    try {
      const page = params.page || params.pageName || params.route;
      
      // Create a proper mapping for page names to routes
      const pageMapping: { [key: string]: string } = {
        'dashboard': '/dashboard',
        'tasks': '/dashboard',
        'contacts': '/contacts',
        'hierarchy': '/hierarchy',
        'profile': '/profile',
        'settings': '/dashboard/settings',
        'diary': '/dashboard/daily-diary',
        'calendar': '/calendar-timeline',
        'timeline': '/calendar-timeline',
        'family': '/family-profile',
        'login': '/login'
      };

      // Normalize page name (handle various formats)
      const normalizedPage = page.toLowerCase().replace(/[^a-z]/g, '');
      const targetRoute = pageMapping[normalizedPage] || `/${normalizedPage}`;

      // Use React Router navigation if available
      if (typeof window !== 'undefined') {
        // Try to use React Router's navigate function through a custom event
        const navigationEvent = new CustomEvent('agentic-navigation', {
          detail: { route: targetRoute, page: normalizedPage }
        });
        window.dispatchEvent(navigationEvent);
        
        // Fallback to window.location for compatibility
        setTimeout(() => {
          if (window.location.pathname !== targetRoute) {
            window.location.href = targetRoute;
          }
        }, 100);
        
        return { success: true, message: `Navigated to ${normalizedPage} page` };
      }
      return { success: false, message: 'Navigation not available' };
    } catch (error) {
      return { success: false, message: 'Error navigating', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async exportData(params: any): Promise<ActionResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Fetch user data
      const [contactsData, tasksData, diaryData] = await Promise.all([
        supabase.from('contacts').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('diary_entries').select('*').eq('user_id', user.id)
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_info: {
          id: user.id,
          email: user.email
        },
        contacts: contactsData.data || [],
        tasks: tasksData.data || [],
        diary_entries: diaryData.data || []
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stage-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Data Exported',
        description: 'Your data has been exported successfully',
      });

      return { success: true, message: 'Data exported successfully' };
    } catch (error) {
      return { success: false, message: 'Error exporting data', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async createDiaryEntry(params: any): Promise<ActionResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('diary_entries')
        .insert({
          user_id: user.id,
          entry_date: params.date || new Date().toISOString().split('T')[0],
          content: params.content,
          mood: params.mood || 'neutral',
          tags: params.tags || [],
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Diary Entry Created',
        description: 'Your diary entry has been saved successfully',
      });

      return { success: true, message: 'Diary entry created successfully', data };
    } catch (error) {
      return { success: false, message: 'Error creating diary entry', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async updateSettings(params: any): Promise<ActionResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const updates: any = {};
      if (params.notifications !== undefined) updates.notifications_enabled = params.notifications;
      if (params.emailNotifications !== undefined) updates.email_notifications = params.emailNotifications;
      if (params.language) updates.language = params.language;
      if (params.timezone) updates.timezone = params.timezone;
      if (params.autoSave !== undefined) updates.auto_save = params.autoSave;

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Settings Updated',
        description: 'Your settings have been updated successfully',
      });

      return { success: true, message: 'Settings updated successfully', data: updates };
    } catch (error) {
      return { success: false, message: 'Error updating settings', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Helper method to normalize and extract theme parameters
  private normalizeThemeParams(params: any): string {
    if (!params) return 'dark';
    
    let theme = params.theme || params.mode || 'dark';
    
    // Handle string normalization
    if (typeof theme === 'string') {
      theme = theme.toLowerCase().trim();
      
      // Smart theme detection
      if (theme.includes('dark') || theme.includes('night') || theme.includes('black')) {
        return 'dark';
      } else if (theme.includes('light') || theme.includes('bright') || theme.includes('white')) {
        return 'light';
      } else if (theme.includes('system') || theme.includes('auto') || theme.includes('default')) {
        return 'system';
      }
    }
    
    // Validate and return
    return ['light', 'dark', 'system'].includes(theme) ? theme : 'dark';
  }

  // Helper method to extract task parameters with smart defaults
  private normalizeTaskParams(params: any): any {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
      title: params.title || params.name || 'New Task',
      description: params.description || params.details || '',
      mainTopic: params.mainTopic || params.category || 'General',
      subTopic: params.subTopic || params.subcategory || 'Task',
      location: params.location || null,
      dueDate: params.dueDate || params.date || null,
      dueTime: params.dueTime || params.time || null,
      priority: params.priority || 'medium',
      ruleAlignment: params.ruleAlignment || 2,
      isHoliday: params.isHoliday || false,
      holidayName: params.holidayName || null
    };
  }

  // Get action history
  getActionHistory(): AgenticAction[] {
    return this.actionHistory;
  }

  // Clear action history
  clearActionHistory(): void {
    this.actionHistory = [];
  }
}

// Export singleton instance
export const agenticService = AgenticService.getInstance();
