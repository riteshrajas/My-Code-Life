import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Plus, Search, Filter, Calendar, CheckCircle, Clock, 
  AlertTriangle, Sparkles, Brain, Shield, BarChart3 
} from 'lucide-react';
import { TaskCreationModal } from './TaskCreationModal';
import { TaskCard } from './TaskCard';
import { createTask, getTasks, updateTask, deleteTask } from '@/lib/taskService';
import supabase from '@/lib/supabaseClient';

interface Task {
  id: string;
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
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  // Habit-specific fields
  is_habit?: boolean;
  habit_frequency?: 'daily' | 'weekly' | 'monthly' | 'custom';
  habit_target_count?: number;
  habit_streak_count?: number;
  habit_best_streak?: number;
  habit_color?: string;
  habit_category?: string;
}

export const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRule, setFilterRule] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await getTasks();
      setTasks(
        (tasksData || []).filter((t): t is Task => typeof t.id === 'string')
      );
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      const newTask = await createTask(taskData);
      if (newTask && typeof newTask.id === 'string') {
        setTasks(prev => [newTask as Task, ...prev]);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    try {
      const updatedTask = await updateTask(taskId, { status });
      if (updatedTask) {
        setTasks(prev => prev.map(task => 
          task.id === taskId && updatedTask && typeof updatedTask.id === 'string'
            ? (updatedTask as Task)
            : task
        ));
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleEditTask = (task: Task) => {
    // TODO: Implement edit modal
    console.log('Edit task:', task);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.main_topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.sub_topic.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    // Rule filter
    if (filterRule !== 'all') {
      filtered = filtered.filter(task => task.rule_id === parseInt(filterRule));
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }

    // Tab filter
    switch (activeTab) {
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(task => task.due_date === today);
        break;
      case 'upcoming':
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        filtered = filtered.filter(task => 
          task.due_date && new Date(task.due_date) >= tomorrow
        );
        break;
      case 'overdue':
        const todayDate = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(task => 
          task.due_date && 
          task.due_date < todayDate && 
          task.status !== 'completed'
        );
        break;
      case 'completed':
        filtered = filtered.filter(task => task.status === 'completed');
        break;
    }

    return filtered;
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.due_date === today).length;
    const overdue = tasks.filter(t => 
      t.due_date && 
      t.due_date < today && 
      t.status !== 'completed'
    ).length;

    return { total, completed, pending, todayTasks, overdue };
  };

  const stats = getTaskStats();
  const filteredTasks = getFilteredTasks();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            AI Task Manager
          </h2>
          <p className="text-muted-foreground">
            Intelligent task creation with holiday recognition and life rule alignment
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.todayTasks}</div>
            <p className="text-xs text-muted-foreground">Due Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Selects */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterRule} onValueChange={setFilterRule}>
              <SelectTrigger>
                <SelectValue placeholder="Life Rule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rules</SelectItem>
                <SelectItem value="1">Rule 1: Truth</SelectItem>
                <SelectItem value="2">Rule 2: Integrity</SelectItem>
                <SelectItem value="3">Rule 3: Growth</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setFilterRule('all');
                setFilterPriority('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                <p className="text-muted-foreground mb-4">
                  {tasks.length === 0 
                    ? "Get started by creating your first AI-powered task"
                    : "No tasks match your current filters"
                  }
                </p>
                {tasks.length === 0 && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Task
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Task Creation Modal */}
      <TaskCreationModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onTaskCreate={handleCreateTask}
      />
    </div>
  );
};
