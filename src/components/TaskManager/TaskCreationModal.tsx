import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Sparkles, Calendar, MapPin, Clock, Flag, Brain, Shield, BarChart3, Mic, PenTool, Target, Repeat, Palette } from 'lucide-react';
import { analyzeTaskWithGemini } from '@/lib/gemini-config';
import VoiceInput from '@/components/VoiceInput';
import { analyzeVoiceTranscript } from '@/lib/voiceAnalysis';
import { createHabitTask } from '@/lib/taskService';
import { Switch } from '@/components/ui/switch';

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
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [isRecurring, setIsRecurring] = useState(false);

  // Editable fields
  const [editableTitle, setEditableTitle] = useState('');
  const [editableDescription, setEditableDescription] = useState('');
  const [editableLocation, setEditableLocation] = useState('');
  const [editableDueDate, setEditableDueDate] = useState('');
  const [editableDueTime, setEditableDueTime] = useState('');
  const [editablePriority, setEditablePriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  // Habit-specific fields
  const [habitFrequency, setHabitFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [habitTargetCount, setHabitTargetCount] = useState(1);
  const [habitColor, setHabitColor] = useState('#8B5CF6');
  const [habitCategory, setHabitCategory] = useState('General');

  // Check for #habit trigger
  useEffect(() => {
    if (taskInput.toLowerCase().includes('#habit')) {
      setIsRecurring(true);
    }
  }, [taskInput]);

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
  const handleCreateTask = async () => {
    if (!analysis) return;

    try {
      if (isRecurring) {
        // Create habit task
        const habitData = {
          title: editableTitle,
          description: editableDescription,
          category: habitCategory,
          frequency: habitFrequency,
          target_count: habitTargetCount,
          color: habitColor,
          rule_id: analysis.ruleAlignment
        };
        
        const habitTask = await createHabitTask(habitData);
        if (habitTask) {
          onTaskCreate(habitTask);
        }
      } else {
        // Create regular task
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
          status: 'pending',
          is_habit: false
        };

        onTaskCreate(taskData);
      }
      
      handleClose();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };  const handleClose = () => {
    setTaskInput('');
    setAnalysis(null);
    setIsEditing(false);
    setIsRecurring(false);
    setHabitFrequency('daily');
    setHabitTargetCount(1);
    setHabitColor('#8B5CF6');
    setHabitCategory('General');
    onOpenChange(false);
  };

  const ruleInfo = analysis ? getRuleInfo(analysis.ruleAlignment) : null;
  const RuleIcon = ruleInfo?.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isRecurring ? (
              <Repeat className="h-5 w-5 text-purple-500" />
            ) : (
              <Sparkles className="h-5 w-5 text-purple-500" />
            )}
            {isRecurring ? 'AI-Powered Habit Creator' : 'AI-Powered Task Creator'}
          </DialogTitle>
          <DialogDescription>
            {isRecurring 
              ? "Create recurring habits that help you build positive routines. Our AI will extract details and set up tracking."
              : "Describe your task or activity in natural language. Our AI will intelligently extract details like dates, locations, and holiday recognition."
            }
          </DialogDescription>
        </DialogHeader><div className="space-y-4">
          {/* Input Section */}          <div className="space-y-2">
            <Label htmlFor="task-input">Describe your task</Label>
            
            {/* Task Type Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2">
                {isRecurring ? (
                  <Repeat className="h-4 w-4 text-purple-500" />
                ) : (
                  <Target className="h-4 w-4 text-blue-500" />
                )}
                <span className="text-sm font-medium">
                  {isRecurring ? 'Recurring Habit/Task' : 'One-time Task'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">One-time</span>
                <Switch
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
                <span className="text-xs text-muted-foreground">Recurring</span>
              </div>
            </div>            {/* Habit Type Hint */}
            {taskInput.toLowerCase().includes('#habit') && !isRecurring && (
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200 rounded-lg">
                <Target className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-purple-700">
                  Habit detected! Enable "Recurring" mode above to create a habit.
                </span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsRecurring(true)}
                  className="ml-auto border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  Enable Recurring
                </Button>
              </div>
            )}

            {/* Voice Input Section */}
            <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as 'text' | 'voice')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <PenTool className="h-4 w-4" />
                  Text Input
                </TabsTrigger>
                <TabsTrigger value="voice" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Voice Input
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="text" className="space-y-2">                <Textarea
                  id="task-input"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder={isRecurring 
                    ? "Example: 'Read for 30 minutes every day' or 'Exercise 3 times per week' or 'Meditate every morning'"
                    : "Example: 'I need to play golf on Independence Day at the country club at 2 PM' or 'Set up a meeting with the team next Tuesday'. Type '#habit' or toggle 'Recurring' for habit creation!"
                  }
                  className="min-h-[80px]"
                />
              </TabsContent>
              
              <TabsContent value="voice" className="space-y-2">
                <VoiceInput
                  onTranscript={(transcript: string) => setTaskInput(transcript)}
                  mode="task"
                />
              </TabsContent>
            </Tabs>
            
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
                  </div>                  {/* Priority */}
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

                  {/* Habit Configuration - Only show when recurring is enabled */}
                  {isRecurring && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Repeat className="h-4 w-4 text-purple-500" />
                        <Label className="text-sm font-medium text-purple-700">Habit Configuration</Label>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Frequency */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Frequency</Label>
                          <Select value={habitFrequency} onValueChange={(value) => setHabitFrequency(value as 'daily' | 'weekly' | 'monthly' | 'custom')}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Target Count */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Target Count</Label>
                          <Input
                            type="number"
                            min="1"
                            value={habitTargetCount}
                            onChange={(e) => setHabitTargetCount(parseInt(e.target.value) || 1)}
                            className="text-sm"
                          />
                        </div>

                        {/* Category */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Category</Label>
                          <Select value={habitCategory} onValueChange={setHabitCategory}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Health & Fitness">Health & Fitness</SelectItem>
                              <SelectItem value="Mindfulness">Mindfulness</SelectItem>
                              <SelectItem value="Learning">Learning</SelectItem>
                              <SelectItem value="Productivity">Productivity</SelectItem>
                              <SelectItem value="Social">Social</SelectItem>
                              <SelectItem value="Creative">Creative</SelectItem>
                              <SelectItem value="Financial">Financial</SelectItem>
                              <SelectItem value="Environmental">Environmental</SelectItem>
                              <SelectItem value="General">General</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Color */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Color</Label>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: habitColor }}
                            />
                            <Input
                              type="color"
                              value={habitColor}
                              onChange={(e) => setHabitColor(e.target.value)}
                              className="w-16 h-8 p-1 border-0"
                            />
                            <span className="text-xs text-muted-foreground">{habitColor}</span>
                          </div>
                        </div>
                      </div>
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
        </div>        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {analysis && (
            <Button onClick={handleCreateTask}>
              {isRecurring ? 'Create Habit' : 'Create Task'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
