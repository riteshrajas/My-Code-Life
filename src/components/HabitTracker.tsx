import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { 
  Target, Flame, TrendingUp, Calendar as CalendarIcon, Plus, 
  CheckCircle, Circle, Zap, Award, BarChart3, Brain, Shield,
  Edit, Trash2, Star, Sparkles, Timer, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getHabitsWithEntries, 
  createHabit, 
  toggleHabitCompletion, 
  updateHabit, 
  deleteHabit,
  getHabitInsights,
  type HabitWithEntries 
} from '@/lib/habitService';
import { HabitSuggestionsModal } from '@/components/HabitSuggestionsModal';
import { toast } from '@/hooks/use-toast';

interface HabitTrackerProps {
  isActive: boolean;
  onClose: () => void;
}

const HABIT_COLORS = [
  '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', 
  '#8B5A2B', '#EC4899', '#06B6D4', '#84CC16', '#F97316'
];

const HABIT_CATEGORIES = [
  'Health & Fitness', 'Mindfulness', 'Learning', 'Productivity', 
  'Social', 'Creative', 'Financial', 'Environmental', 'General'
];

const getRuleInfo = (ruleId: number | null) => {
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
        title: "General Habit",
        icon: Target,
        color: "gray",
        description: "Personal development"
      };
  }
};

export const HabitTracker: React.FC<HabitTrackerProps> = ({ isActive, onClose }) => {
  const [habits, setHabits] = useState<HabitWithEntries[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('today');  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithEntries | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Form state
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    category: 'General',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly' | 'custom',
    target_count: 1,
    color: HABIT_COLORS[0],
    rule_id: null as number | null
  });

  useEffect(() => {
    if (isActive) {
      loadHabits();
      loadInsights();
    }
  }, [isActive, selectedDate]);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const dateString = selectedDate.toISOString().split('T')[0];
      const habitsData = await getHabitsWithEntries(dateString);
      if (habitsData) {
        setHabits(habitsData);
      }
    } catch (error) {
      console.error('Error loading habits:', error);
      toast({
        title: 'Error',
        description: 'Failed to load habits',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    try {
      const insightsData = await getHabitInsights();
      setInsights(insightsData);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const handleCreateHabit = async () => {
    if (!newHabit.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a habit name',
        variant: 'destructive'
      });
      return;
    }

    try {
      const habitData = await createHabit(newHabit);
      if (habitData) {
        await loadHabits();
        await loadInsights();
        setShowCreateForm(false);
        setNewHabit({
          name: '',
          description: '',
          category: 'General',
          frequency: 'daily',
          target_count: 1,
          color: HABIT_COLORS[0],
          rule_id: null
        });
        toast({
          title: 'Success',
          description: 'Habit created successfully!',
        });
      }
    } catch (error) {
      console.error('Error creating habit:', error);
      toast({
        title: 'Error',
        description: 'Failed to create habit',
        variant: 'destructive'
      });
    }
  };

  const handleToggleCompletion = async (habitId: string) => {
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const success = await toggleHabitCompletion(habitId, dateString);
      if (success) {
        await loadHabits();
        await loadInsights();
      }
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      toast({
        title: 'Error',
        description: 'Failed to update habit',
        variant: 'destructive'
      });
    }
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '⚡';
    if (streak >= 7) return '✨';
    if (streak >= 3) return '🌟';
    return '💪';
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border"
      >
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  AI Habit Tracker
                  <Sparkles className="h-5 w-5 text-purple-500" />
                </h2>
                <p className="text-muted-foreground">
                  Build lasting habits aligned with your life rules
                </p>
              </div>
            </div>            <Button variant="ghost" onClick={onClose} size="sm">
              ✕
            </Button>
            <Button 
              onClick={() => setShowSuggestions(true)}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Suggestions
            </Button>
          </div>

          {/* Insights Cards */}
          {insights && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-200/50">
                <CardContent className="p-4 text-center">
                  <Target className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold text-blue-600">{insights.totalHabits}</div>
                  <div className="text-xs text-muted-foreground">Active Habits</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-200/50">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold text-green-600">{insights.completedToday}</div>
                  <div className="text-xs text-muted-foreground">Completed Today</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-200/50">
                <CardContent className="p-4 text-center">
                  <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <div className="text-2xl font-bold text-orange-600">{insights.activeStreaks}</div>
                  <div className="text-xs text-muted-foreground">Active Streaks</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-200/50">
                <CardContent className="p-4 text-center">
                  <Award className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold text-purple-600">{insights.bestStreak}</div>
                  <div className="text-xs text-muted-foreground">Best Streak</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <TabsContent value="today" className="mt-4 space-y-4">
                {/* Add Habit Button */}
                <Card className="border-dashed border-2 hover:border-purple-300 transition-colors">
                  <CardContent className="p-6">
                    {!showCreateForm ? (
                      <Button
                        variant="ghost"
                        onClick={() => setShowCreateForm(true)}
                        className="w-full h-20 text-muted-foreground hover:text-purple-600"
                      >
                        <Plus className="h-8 w-8 mr-2" />
                        Add New Habit
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Habit Name</Label>
                            <Input
                              value={newHabit.name}
                              onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                              placeholder="e.g., Morning meditation"
                            />
                          </div>
                          <div>
                            <Label>Category</Label>
                            <Select value={newHabit.category} onValueChange={(value) => setNewHabit({ ...newHabit, category: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {HABIT_CATEGORIES.map(cat => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Frequency</Label>
                            <Select value={newHabit.frequency} onValueChange={(value) => setNewHabit({ ...newHabit, frequency: value as any })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Life Rule Alignment</Label>
                            <Select value={newHabit.rule_id?.toString() || ''} onValueChange={(value) => setNewHabit({ ...newHabit, rule_id: value ? parseInt(value) : null })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rule" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">No specific rule</SelectItem>
                                <SelectItem value="1">Rule 1: Seek Truth</SelectItem>
                                <SelectItem value="2">Rule 2: Live with Integrity</SelectItem>
                                <SelectItem value="3">Rule 3: Antifragile Growth</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {/* Color Picker */}
                        <div>
                          <Label>Color</Label>
                          <div className="flex gap-2 mt-2">
                            {HABIT_COLORS.map(color => (
                              <button
                                key={color}
                                onClick={() => setNewHabit({ ...newHabit, color })}
                                className={`w-8 h-8 rounded-full border-2 ${
                                  newHabit.color === color ? 'border-gray-900 dark:border-gray-100' : 'border-gray-300'
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={handleCreateHabit} className="flex-1">
                            Create Habit
                          </Button>
                          <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Habits List */}
                <div className="space-y-3">
                  <AnimatePresence>
                    {habits.map((habit) => {
                      const ruleInfo = getRuleInfo(habit.rule_id);
                      const RuleIcon = ruleInfo.icon;
                      
                      return (
                        <motion.div
                          key={habit.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                        >
                          <Card className="hover:shadow-lg transition-shadow border-l-4" style={{ borderLeftColor: habit.color }}>
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                  <Button
                                    variant={habit.completedToday ? "default" : "outline"}
                                    size="lg"
                                    onClick={() => handleToggleCompletion(habit.id)}
                                    className={`rounded-full w-16 h-16 ${
                                      habit.completedToday 
                                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                                        : ''
                                    }`}
                                  >
                                    {habit.completedToday ? (
                                      <CheckCircle className="h-8 w-8 text-white" />
                                    ) : (
                                      <Circle className="h-8 w-8" />
                                    )}
                                  </Button>

                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold text-lg">{habit.name}</h3>
                                      {habit.streak_count > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          {getStreakEmoji(habit.streak_count)} {habit.streak_count} day streak
                                        </Badge>
                                      )}
                                      {habit.rule_id && (
                                        <Badge variant="outline" className="text-xs">
                                          <RuleIcon className="h-3 w-3 mr-1" />
                                          Rule {habit.rule_id}
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <span className="capitalize">{habit.category}</span>
                                      <span>•</span>
                                      <span className="capitalize">{habit.frequency}</span>
                                      <span>•</span>
                                      <span>Best: {habit.best_streak} days</span>
                                    </div>

                                    {habit.completionPercentage > 0 && habit.completionPercentage < 100 && (
                                      <div className="mt-2">
                                        <Progress value={habit.completionPercentage} className="h-2" />
                                        <span className="text-xs text-muted-foreground">
                                          {Math.round(habit.completionPercentage)}% complete
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {habits.length === 0 && !showCreateForm && (
                  <Card className="text-center p-12">
                    <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No habits yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start building positive habits that align with your life rules
                    </p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Habit
                    </Button>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="calendar" className="mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        Select Date
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        className="rounded-md border"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Habits for {selectedDate.toLocaleDateString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {habits.map((habit) => (
                          <div key={habit.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: habit.color }}
                              />
                              <span className="font-medium">{habit.name}</span>
                            </div>
                            <Button
                              variant={habit.completedToday ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleToggleCompletion(habit.id)}
                            >
                              {habit.completedToday ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Circle className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        Overall Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Completion Rate</span>
                          <span className="font-bold">
                            {insights ? Math.round((insights.completedToday / Math.max(insights.totalHabits, 1)) * 100) : 0}%
                          </span>
                        </div>
                        <Progress 
                          value={insights ? (insights.completedToday / Math.max(insights.totalHabits, 1)) * 100 : 0} 
                          className="h-3"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        Habit Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {HABIT_CATEGORIES.slice(0, 5).map(category => {
                          const count = habits.filter(h => h.category === category).length;
                          return (
                            <div key={category} className="flex justify-between text-sm">
                              <span>{category}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        Streak Leaders
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {habits
                          .sort((a, b) => b.streak_count - a.streak_count)
                          .slice(0, 5)
                          .map((habit) => (
                            <div key={habit.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: habit.color }}
                                />
                                <span className="text-sm font-medium truncate">{habit.name}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {getStreakEmoji(habit.streak_count)} {habit.streak_count}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>          </Tabs>
        </div>

        {/* AI Suggestions Modal */}
        <HabitSuggestionsModal
          open={showSuggestions}
          onOpenChange={setShowSuggestions}
          onHabitCreated={() => {
            loadHabits();
            loadInsights();
            setShowSuggestions(false);
          }}
        />
      </motion.div>
    </div>
  );
};
