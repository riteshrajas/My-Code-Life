import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, MapPin, Clock, Flag, Brain, Shield, BarChart3, 
  Sparkles, CheckCircle, AlertTriangle, Edit, Trash2 
} from 'lucide-react';

interface TaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any; // Full task object with all details
  onStatusChange?: (taskId: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') => void;
  onEdit?: (task: any) => void;
  onDelete?: (taskId: string) => void;
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
    default: return 'gray';
  }
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Not specified';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTime = (timeString: string | null) => {
  if (!timeString) return 'Not specified';
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  open,
  onOpenChange,
  task,
  onStatusChange,
  onEdit,
  onDelete
}) => {
  if (!task) return null;

  const ruleInfo = getRuleInfo(task.rule_id);
  const RuleIcon = ruleInfo.icon;
  const geminiAnalysis = task.gemini_analysis || {};

  const handleStatusToggle = () => {
    if (onStatusChange) {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      onStatusChange(task.id, newStatus);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-xl mb-2 flex items-start flex-wrap gap-2">
                <span className="break-words">{task.title}</span>
                {task.is_holiday && (
                  <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 flex-shrink-0">
                    🎉 {task.holiday_name}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base break-words">
                {task.description}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:ml-4">
              <Badge 
                variant="outline" 
                className={`text-${getStatusColor(task.status)}-600 border-${getStatusColor(task.status)}-300 text-xs`}
              >
                {task.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge 
                variant="outline" 
                className={`text-${getPriorityColor(task.priority)}-600 border-${getPriorityColor(task.priority)}-300 text-xs`}
              >
                <Flag className="h-3 w-3 mr-1" />
                {task.priority.toUpperCase()}
              </Badge>
            </div>
          </div>
        </DialogHeader>        <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              onClick={handleStatusToggle}
              variant={task.status === 'completed' ? 'outline' : 'default'}
              size="sm"
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {task.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}
            </Button>
            {onEdit && (
              <Button
                onClick={() => onEdit(task)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={() => onDelete(task.id)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>

          {/* Task Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Date & Time */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="text-sm font-medium break-words">{formatDate(task.due_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Due Time</p>
                  <p className="text-sm font-medium">{formatTime(task.due_time)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium break-words">
                  {task.location || 'No location specified'}
                </p>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Main Topic</p>
                  <Badge variant="outline" className="text-xs break-words">
                    {task.main_topic || 'General'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sub Topic</p>
                  <Badge variant="outline" className="text-xs break-words">
                    {task.sub_topic || 'Task'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">
                    {new Date(task.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric', 
                      hour: 'numeric', minute: '2-digit'
                    })}
                  </p>
                </div>
                {task.completed_at && (
                  <div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="text-sm font-medium">
                      {new Date(task.completed_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric', 
                        hour: 'numeric', minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>          {/* Life Rule Alignment */}
          <Card className={`border-l-4 border-${ruleInfo.color}-500`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <RuleIcon className={`h-4 w-4 text-${ruleInfo.color}-500 flex-shrink-0`} />
                <span>Life Rule Alignment</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium text-sm break-words">Rule {task.rule_id}: {ruleInfo.title}</p>
                <p className="text-xs text-muted-foreground break-words">{ruleInfo.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Insights */}
          {geminiAnalysis.steps && geminiAnalysis.steps.length > 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <span>AI-Generated Steps</span>
                </CardTitle>
                <CardDescription>
                  Suggested breakdown from AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2">
                  {geminiAnalysis.steps.map((step: string, index: number) => (
                    <li key={index} className="text-sm break-words">{step}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Original AI Analysis */}
          {Object.keys(geminiAnalysis).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span>Original AI Analysis</span>
                </CardTitle>
                <CardDescription>
                  Raw insights from the AI task analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {geminiAnalysis.mainTopic && (
                    <div>
                      <p className="text-muted-foreground">Main Topic</p>
                      <p className="font-medium break-words">{geminiAnalysis.mainTopic}</p>
                    </div>
                  )}
                  {geminiAnalysis.subTopic && (
                    <div>
                      <p className="text-muted-foreground">Sub Topic</p>
                      <p className="font-medium break-words">{geminiAnalysis.subTopic}</p>
                    </div>
                  )}
                  {geminiAnalysis.ruleAlignment && (
                    <div>
                      <p className="text-muted-foreground">Rule Alignment</p>
                      <p className="font-medium">Rule {geminiAnalysis.ruleAlignment}</p>
                    </div>
                  )}
                  {geminiAnalysis.priority && (
                    <div>
                      <p className="text-muted-foreground">AI Priority</p>
                      <p className="font-medium capitalize">{geminiAnalysis.priority}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
