import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, MapPin, Clock, Flag, CheckCircle, Circle, 
  Edit, Trash2, Brain, Shield, BarChart3, Sparkles, Repeat 
} from 'lucide-react';

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

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const getRuleInfo = (ruleId: number) => {
  switch (ruleId) {
    case 1:
      return {
        title: "Seek Truth with Relentless Curiosity",
        icon: Brain,
        color: "blue",
        description: "Learning, research, investigation"
      };
    case 2:
      return {
        title: "Live with Uncompromising Integrity",
        icon: Shield,
        color: "emerald",
        description: "Ethical actions, meaningful work"
      };
    case 3:
      return {
        title: "Grow Through Challenges as an Antifragile System",
        icon: BarChart3,
        color: "violet",
        description: "Difficult tasks, growth opportunities"
      };
    default:
      return {
        title: "General Task",
        icon: Brain,
        color: "gray",
        description: "Not aligned with specific rule"
      };
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'red';
    case 'high': return 'orange';
    case 'medium': return 'yellow';
    case 'low': return 'green';
    default: return 'gray';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'green';
    case 'in_progress': return 'blue';
    case 'cancelled': return 'red';
    case 'pending': return 'gray';
    default: return 'gray';
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete
}) => {
  const ruleInfo = getRuleInfo(task.rule_id);
  const RuleIcon = ruleInfo.icon;

  const handleStatusToggle = () => {
    if (task.status === 'completed') {
      onStatusChange(task.id, 'pending');
    } else if (task.status === 'pending') {
      onStatusChange(task.id, 'completed');
    }
  };
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null;
    try {
      // Handle time format "HH:MM" or "HH:MM:SS"
      const [hours, minutes] = timeString.split(':');
      const time = new Date();
      time.setHours(parseInt(hours), parseInt(minutes));
      return time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return timeString;
    }
  };

  const isOverdue = () => {
    if (!task.due_date || task.status === 'completed') return false;
    const today = new Date();
    const dueDate = new Date(task.due_date);
    return dueDate < today;
  };

  return (
    <Card className={`transition-all hover:shadow-md ${
      task.status === 'completed' ? 'opacity-75' : ''
    } ${isOverdue() ? 'border-red-200 bg-red-50/50' : ''} border-l-4`}
    style={{ 
      borderLeftColor: task.status === 'completed' ? '#10b981' : 
                      ruleInfo.color === 'blue' ? '#3b82f6' :
                      ruleInfo.color === 'emerald' ? '#10b981' :
                      ruleInfo.color === 'violet' ? '#8b5cf6' : '#6b7280'
    }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto"
              onClick={handleStatusToggle}
            >
              {task.status === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </Button>
            
            <div className="flex-1 space-y-1">
              <CardTitle className={`text-lg ${
                task.status === 'completed' ? 'line-through text-muted-foreground' : ''
              }`}>
                {task.title}
              </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {task.main_topic} → {task.sub_topic}
                </Badge>
                
                {task.is_habit && (
                  <Badge 
                    variant="outline" 
                    className="text-purple-600 border-purple-300 bg-purple-50"
                  >
                    <Repeat className="h-3 w-3 mr-1" />
                    Habit
                  </Badge>
                )}
                
                {task.is_holiday && task.holiday_name && (
                  <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                    🎉 {task.holiday_name}
                  </Badge>
                )}
                
                <Badge 
                  variant="outline" 
                  className={`text-${getPriorityColor(task.priority)}-600 border-${getPriorityColor(task.priority)}-300`}
                >
                  <Flag className="h-3 w-3 mr-1" />
                  {task.priority.toUpperCase()}
                </Badge>

                <Badge 
                  variant="outline"
                  className={`text-${getStatusColor(task.status)}-600 border-${getStatusColor(task.status)}-300`}
                >
                  {task.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(task)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-700"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        {task.description && (
          <CardDescription className={`${
            task.status === 'completed' ? 'line-through text-muted-foreground' : ''
          }`}>
            {task.description}
          </CardDescription>
        )}        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {/* Date & Time */}
          {(task.due_date || task.due_time) && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(task.due_date)}
                {task.due_time && ` at ${formatTime(task.due_time)}`}
                {isOverdue() && (
                  <span className="text-red-500 ml-1">(Overdue)</span>
                )}
              </span>
            </div>
          )}

          {/* Habit Frequency - Only show for habits */}
          {task.is_habit && task.habit_frequency && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Repeat className="h-4 w-4" />
              <span className="capitalize">{task.habit_frequency}</span>
              {task.habit_target_count && task.habit_target_count > 1 && (
                <span> • {task.habit_target_count}x</span>
              )}
            </div>
          )}

          {/* Location */}
          {task.location && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{task.location}</span>
            </div>
          )}

          {/* Rule Alignment */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <RuleIcon className={`h-4 w-4 text-${ruleInfo.color}-500`} />
            <span className="text-xs">Rule {task.rule_id}</span>
          </div>
        </div>        {/* AI Analysis Indicator */}
        {task.gemini_analysis && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
            <Sparkles className="h-3 w-3 text-purple-500" />
            <span>Analyzed by AI • Created {formatDate(task.created_at)}</span>
          </div>
        )}

        {/* Habit Streak Info - Only show for habits with streak data */}
        {task.is_habit && (task.habit_streak_count || task.habit_best_streak) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-4">
              {task.habit_streak_count && task.habit_streak_count > 0 && (
                <span className="flex items-center gap-1">
                  🔥 Current: {task.habit_streak_count} days
                </span>
              )}
              {task.habit_best_streak && task.habit_best_streak > 0 && (
                <span className="flex items-center gap-1">
                  🏆 Best: {task.habit_best_streak} days
                </span>
              )}
            </div>
            {task.habit_color && (
              <div 
                className="w-3 h-3 rounded-full border border-gray-300"
                style={{ backgroundColor: task.habit_color }}
                title={`Habit color: ${task.habit_color}`}
              />
            )}
          </div>
        )}

        {/* Multi-step process */}
        {task.gemini_analysis?.steps && task.gemini_analysis.steps.length > 1 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
              {task.gemini_analysis.steps.slice(0, 3).map((step: string, index: number) => (
                <li key={index} className={task.status === 'completed' ? 'line-through' : ''}>
                  {step}
                </li>
              ))}
              {task.gemini_analysis.steps.length > 3 && (
                <li className="text-muted-foreground">... and {task.gemini_analysis.steps.length - 3} more steps</li>
              )}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
