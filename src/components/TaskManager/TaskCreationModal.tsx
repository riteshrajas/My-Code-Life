import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Sparkles, Calendar, MapPin, Clock, Flag, Brain, Shield, BarChart3, Mic, PenTool } from 'lucide-react';
import { analyzeTaskWithGemini } from '@/lib/gemini-config';
import VoiceInput from '@/components/VoiceInput';
import { analyzeVoiceTranscript } from '@/lib/voiceAnalysis';

interface TaskAnalysis {
  title: string;
  description: string;
  mainTopic: string;
  subTopic: string;
  location: string | null;
  dueDate: string | null;
  dueTime: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  ruleAlignment: number;
  isHoliday: boolean;
  holidayName: string | null;
  steps: string[];
}

interface TaskCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreate: (taskData: any) => void;
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

export const TaskCreationModal: React.FC<TaskCreationModalProps> = ({
  open,
  onOpenChange,
  onTaskCreate
}) => {
  const [taskInput, setTaskInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TaskAnalysis | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [editableTitle, setEditableTitle] = useState('');
  const [editableDescription, setEditableDescription] = useState('');
  const [editableLocation, setEditableLocation] = useState('');
  const [editableDueDate, setEditableDueDate] = useState('');
  const [editableDueTime, setEditableDueTime] = useState('');
  const [editablePriority, setEditablePriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const handleAnalyze = async () => {
    if (!taskInput.trim()) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeTaskWithGemini(taskInput);
      setAnalysis(result);
      
      // Set editable fields
      setEditableTitle(result.title);
      setEditableDescription(result.description);
      setEditableLocation(result.location || '');
      setEditableDueDate(result.dueDate || '');
      setEditableDueTime(result.dueTime || '');
      setEditablePriority(result.priority);
    } catch (error) {
      console.error('Error analyzing task:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateTask = () => {
    if (!analysis) return;

    const taskData = {
      title: editableTitle,
      description: editableDescription,
      main_topic: analysis.mainTopic,
      sub_topic: analysis.subTopic,
      location: editableLocation || null,
      due_date: editableDueDate || null,
      due_time: editableDueTime || null,
      priority: editablePriority,
      rule_id: analysis.ruleAlignment,
      is_holiday: analysis.isHoliday,
      holiday_name: analysis.holidayName,
      gemini_analysis: analysis,
      status: 'pending'
    };

    onTaskCreate(taskData);
    handleClose();
  };

  const handleClose = () => {
    setTaskInput('');
    setAnalysis(null);
    setIsEditing(false);
    onOpenChange(false);
  };

  const ruleInfo = analysis ? getRuleInfo(analysis.ruleAlignment) : null;
  const RuleIcon = ruleInfo?.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI-Powered Task Creator
          </DialogTitle>
          <DialogDescription>
            Describe your task or activity in natural language. Our AI will intelligently extract details like dates, locations, and holiday recognition.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Input Section */}
          <div className="space-y-2">
            <Label htmlFor="task-input">Describe your task</Label>
            <Textarea
              id="task-input"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Example: 'I need to play golf on Independence Day at the country club at 2 PM' or 'Set up a meeting with the team next Tuesday to discuss the new project requirements'"
              className="min-h-[80px]"
            />
            <Button 
              onClick={handleAnalyze} 
              disabled={!taskInput.trim() || isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze Task
                </>
              )}
            </Button>
          </div>

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Analysis Results</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'View Mode' : 'Edit Details'}
                </Button>
              </div>

              {/* Task Overview Card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      {isEditing ? (
                        <Input
                          value={editableTitle}
                          onChange={(e) => setEditableTitle(e.target.value)}
                          className="font-semibold text-lg"
                        />
                      ) : (
                        <CardTitle className="text-lg">{editableTitle}</CardTitle>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {analysis.mainTopic} → {analysis.subTopic}
                        </Badge>
                        {analysis.isHoliday && (
                          <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                            🎉 {analysis.holidayName}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-${getPriorityColor(editablePriority)}-600 border-${getPriorityColor(editablePriority)}-300`}
                    >
                      <Flag className="h-3 w-3 mr-1" />
                      {editablePriority.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    {isEditing ? (
                      <Textarea
                        value={editableDescription}
                        onChange={(e) => setEditableDescription(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm mt-1">{editableDescription}</p>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Date */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due Date
                      </Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editableDueDate}
                          onChange={(e) => setEditableDueDate(e.target.value)}
                          className="text-sm"
                        />
                      ) : (
                        <p className="text-sm">{editableDueDate || 'Not specified'}</p>
                      )}
                    </div>

                    {/* Time */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due Time
                      </Label>
                      {isEditing ? (
                        <Input
                          type="time"
                          value={editableDueTime}
                          onChange={(e) => setEditableDueTime(e.target.value)}
                          className="text-sm"
                        />
                      ) : (
                        <p className="text-sm">{editableDueTime || 'Not specified'}</p>
                      )}
                    </div>

                    {/* Location */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Location
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editableLocation}
                          onChange={(e) => setEditableLocation(e.target.value)}
                          placeholder="Enter location"
                          className="text-sm"
                        />
                      ) : (
                        <p className="text-sm">{editableLocation || 'Not specified'}</p>
                      )}
                    </div>
                  </div>

                  {/* Priority */}
                  {isEditing && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Priority</Label>
                      <Select value={editablePriority} onValueChange={(value) => setEditablePriority(value as 'low' | 'medium' | 'high' | 'urgent')}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Rule Alignment */}
              {ruleInfo && (
                <Card className={`border-l-4 border-${ruleInfo.color}-500`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {RuleIcon && <RuleIcon className={`h-4 w-4 text-${ruleInfo.color}-500`} />}
                      Life Rule Alignment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Rule {analysis.ruleAlignment}: {ruleInfo.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {ruleInfo.description}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Multi-step process */}
              {analysis.steps && analysis.steps.length > 1 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Suggested Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="list-decimal list-inside space-y-1">
                      {analysis.steps.map((step, index) => (
                        <li key={index} className="text-sm">{step}</li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {analysis && (
            <Button onClick={handleCreateTask}>
              Create Task
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
