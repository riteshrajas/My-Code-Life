import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Brain, Sparkles, CheckCircle, Plus, Target, Lightbulb, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { detectHabitsFromContent, createHabitFromSuggestion, type DetectedHabit } from '@/lib/habitDetectionService';
import { toast } from '@/hooks/use-toast';
import supabase from '@/lib/supabaseClient';

interface HabitSuggestionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHabitCreated: () => void;
}

const getRuleInfo = (ruleId: number | null) => {
  switch (ruleId) {
    case 1:
      return {
        title: "Seek Truth with Relentless Curiosity",
        color: "blue",
        description: "Learning, research, investigation"
      };
    case 2:
      return {
        title: "Live with Uncompromising Integrity",
        color: "emerald",
        description: "Ethical actions, meaningful work"
      };
    case 3:
      return {
        title: "Grow Through Challenges as an Antifragile System",
        color: "violet",
        description: "Difficult tasks, growth opportunities"
      };
    default:
      return {
        title: "General Habit",
        color: "gray",
        description: "Personal development"
      };
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 90) return 'green';
  if (confidence >= 80) return 'blue';
  if (confidence >= 70) return 'yellow';
  return 'orange';
};

const getConfidenceLabel = (confidence: number) => {
  if (confidence >= 90) return 'Very High';
  if (confidence >= 80) return 'High';
  if (confidence >= 70) return 'Medium';
  return 'Low';
};

export const HabitSuggestionsModal: React.FC<HabitSuggestionsModalProps> = ({
  open,
  onOpenChange,
  onHabitCreated
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    detectedHabits: DetectedHabit[];
    analysis: string;
    recommendations: string[];
  } | null>(null);
  const [creatingHabits, setCreatingHabits] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open && !suggestions) {
      loadSuggestions();
    }
  }, [open]);

  const loadSuggestions = async () => {
    setIsAnalyzing(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('No authenticated user');

      const result = await detectHabitsFromContent(user.user.id, 30);
      setSuggestions(result);
    } catch (error) {
      console.error('Error loading habit suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze your content for habit suggestions',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateHabit = async (habit: DetectedHabit, index: number) => {
    setCreatingHabits(prev => new Set(prev).add(index));
    
    try {
      const habitId = await createHabitFromSuggestion(habit);
      if (habitId) {
        toast({
          title: 'Habit Created!',
          description: `"${habit.name}" has been added to your habits`,
        });
        onHabitCreated();
      } else {
        throw new Error('Failed to create habit');
      }
    } catch (error) {
      console.error('Error creating habit:', error);
      toast({
        title: 'Error',
        description: 'Failed to create habit',
        variant: 'destructive'
      });
    } finally {
      setCreatingHabits(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            AI Habit Suggestions
            <Sparkles className="h-5 w-5 text-purple-400" />
          </DialogTitle>
          <DialogDescription>
            Based on your diary entries and tasks, our AI has analyzed your patterns to suggest personalized habits
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
                  <Brain className="absolute inset-0 m-auto h-6 w-6 text-purple-500 animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Analyzing Your Patterns</h3>
                  <p className="text-muted-foreground">
                    Our AI is reviewing your diary entries and tasks to find potential habits...
                  </p>
                </div>
              </div>
            ) : suggestions ? (
              <>
                {/* Analysis Summary */}
                <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                      <TrendingUp className="h-5 w-5" />
                      Pattern Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-purple-600 dark:text-purple-400 mb-4">
                      {suggestions.analysis}
                    </p>
                    
                    {suggestions.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Recommendations
                        </h4>
                        <ul className="text-sm space-y-1">
                          {suggestions.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2 text-purple-600 dark:text-purple-400">
                              <span className="text-purple-400 mt-1">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Detected Habits */}
                {suggestions.detectedHabits.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-500" />
                      Suggested Habits ({suggestions.detectedHabits.length})
                    </h3>
                    
                    <AnimatePresence>
                      {suggestions.detectedHabits.map((habit, index) => {
                        const ruleInfo = getRuleInfo(habit.rule_id);
                        const isCreating = creatingHabits.has(index);
                        
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card className="hover:shadow-lg transition-all duration-200 border-l-4" style={{ borderLeftColor: habit.color }}>
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 space-y-3">
                                    {/* Header */}
                                    <div className="flex items-start gap-3">
                                      <div 
                                        className="w-3 h-3 rounded-full mt-2 flex-shrink-0" 
                                        style={{ backgroundColor: habit.color }}
                                      />
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-lg">{habit.name}</h4>
                                        <p className="text-muted-foreground text-sm mt-1">
                                          {habit.description}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="outline" className="text-xs">
                                        {habit.category}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {habit.frequency}
                                      </Badge>
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs text-${getConfidenceColor(habit.confidence)}-600 border-${getConfidenceColor(habit.confidence)}-300`}
                                      >
                                        {getConfidenceLabel(habit.confidence)} Confidence ({habit.confidence}%)
                                      </Badge>
                                      {habit.rule_id && (
                                        <Badge 
                                          variant="outline" 
                                          className={`text-xs text-${ruleInfo.color}-600 border-${ruleInfo.color}-300`}
                                        >
                                          Rule {habit.rule_id}
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Evidence */}
                                    {habit.evidence.length > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="text-sm font-medium text-muted-foreground">
                                          Based on your patterns:
                                        </h5>
                                        <ul className="text-xs space-y-1">
                                          {habit.evidence.slice(0, 3).map((evidence, evidenceIndex) => (
                                            <li key={evidenceIndex} className="flex items-start gap-2 text-muted-foreground">
                                              <span className="text-purple-400 mt-0.5">•</span>
                                              {evidence}
                                            </li>
                                          ))}
                                          {habit.evidence.length > 3 && (
                                            <li className="text-xs text-muted-foreground italic">
                                              ... and {habit.evidence.length - 3} more patterns
                                            </li>
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                  </div>

                                  {/* Action Button */}
                                  <Button
                                    onClick={() => handleCreateHabit(habit, index)}
                                    disabled={isCreating}
                                    className="ml-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                                  >
                                    {isCreating ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Creating...
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Habit
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Card className="border-dashed border-2">
                    <CardContent className="p-8 text-center">
                      <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Habit Patterns Detected</h3>
                      <p className="text-muted-foreground mb-4">
                        We couldn't find strong patterns in your recent activity. Here are some tips:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
                        <li>• Write more detailed diary entries about your daily activities</li>
                        <li>• Create tasks for things you do regularly</li>
                        <li>• Be specific about your routines and goals</li>
                        <li>• Use the app for at least a week to build pattern data</li>
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Failed to load suggestions. Please try again.</p>
                <Button onClick={loadSuggestions} className="mt-4">
                  Retry Analysis
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
