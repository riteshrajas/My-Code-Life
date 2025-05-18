// filepath: p:\PERSONAL\Stage\stage\src\pages\DashboardPage.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, RefreshCw, 
  Clock, Calendar, CheckCircle, AlertTriangle, 
  BarChart2, Zap, Brain 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface Rule {
  id: number;
  title: string;
  explanation: string;
  application: string;
  why: string;
}

interface Activity {
  id: number;
  title: string;
  date: string;
  rule_id: number;
  completed: boolean;
}

const initialRules: Rule[] = [
  {
    id: 1,
    title: "Seek Truth with Relentless Curiosity",
    explanation: "Anchor every decision and belief in evidence, logic, and reality, as inspired by Marcus Aurelius' pursuit of truth as a path to clarity and growth. Acknowledge cognitive biases, as Daniel Kahneman notes, and question assumptions rigorously. Balance honesty with empathy to foster trust without causing harm.",
    application: "In computer science and robotics, validate hypotheses through experiments and datadebug code until it aligns with reality. In teaching, model intellectual honesty by admitting uncertainties and explaining concepts clearly. Keep a journal to log and review assumptions, treating feedback as a tool to refine your mental models.",
    why: "Truth is the foundation of progress in engineering and personal integrity. Acting on reality prevents errors akin to bugs in code, ensuring reliable outcomes. Psychological research confirms that aligning with values like honesty enhances well-being."
  },
  {
    id: 2,
    title: "Live with Uncompromising Integrity",
    explanation: "Let your actions consistently reflect your values, as Marcus Aurelius advises: \"If it is not right, do not do it; if it is not true, do not say it.\" Integrity means aligning words, code, and conduct, even when inconvenient, to build trust and self-respect. Take full responsibility for your commitments, owning outcomes without excuses.",
    application: "Write clear, documented code and avoid shortcuts like unaddressed \"TODO\" comments. In teaching, present material truthfully and credit others' ideas. Meet deadlines reliably; if delays occur, communicate honestly. In robotics, reject unsafe hacks, prioritizing ethical design.",
    why: "Integrity fosters trust and self-esteem, as psychology research highlights. Like a system that fails gracefully, admitting mistakes builds reliability. In your collaborative and technical work, consistent integrity ensures you're a trusted contributor."
  },
  {
    id: 3,
    title: "Grow Through Challenges as an Antifragile System",
    explanation: "Embrace adversity as a catalyst for growth, drawing on Nassim Taleb's concept of antifragility and Carol Dweck's growth mindset. Treat failures as feedback, like debugging a program, and iterate to improve. Systematically reflect on outcomes to refine your \"life algorithm,\" ensuring continuous learning and resilience.",
    application: "In robotics, iterate relentlessly on failed designs, analyzing sensor data or algorithm flaws like version-controlled code. In teaching, tackle new topics to handle tough questions, and journal reflections to identify patterns in setbacks. Seek voluntary challenges, like solving a coding problem solo, to build self-reliance.",
    why: "Challenges strengthen you, just as stress tests improve robust systems. Psychological research links resilience to success and well-being. By treating setbacks as data, you stay adaptable in fast-evolving fields like AI and robotics, ensuring you thrive amid uncertainty."
  }
];

const mockActivities: Activity[] = [
  { id: 1, title: "Debugged sensor integration issue", date: "2025-05-17", rule_id: 1, completed: true },
  { id: 2, title: "Documented code for team handover", date: "2025-05-16", rule_id: 2, completed: true },
  { id: 3, title: "Learned new animation framework", date: "2025-05-18", rule_id: 3, completed: false },
  { id: 4, title: "Submitted research findings", date: "2025-05-15", rule_id: 1, completed: true },
  { id: 5, title: "Communicated project delay to stakeholders", date: "2025-05-14", rule_id: 2, completed: true },
  { id: 6, title: "Tackled complex algorithm challenge", date: "2025-05-13", rule_id: 3, completed: true }
];

const DashboardPage = () => {
  const [expandedRule, setExpandedRule] = useState<number | null>(null);
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [activeTab, setActiveTab] = useState('today');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalCompleted: 0,
    ruleDistribution: [0, 0, 0]
  });

  useEffect(() => {
    // In a real app, fetch rules and activities from Supabase
    // For now, we'll use the mock data
    
    // Calculate statistics
    const completed = activities.filter(a => a.completed).length;
    const distribution = [1, 2, 3].map(ruleId => 
      activities.filter(a => a.rule_id === ruleId).length
    );
    
    setStats({
      totalCompleted: completed,
      ruleDistribution: distribution
    });
  }, [activities]);

  const toggleRuleExpansion = (ruleId: number) => {
    setExpandedRule(expandedRule === ruleId ? null : ruleId);
  };

  const toggleActivityCompletion = (activityId: number) => {
    setActivities(activities.map(activity => 
      activity.id === activityId 
        ? { ...activity, completed: !activity.completed } 
        : activity
    ));
  };

  const getFilteredActivities = () => {
    const today = new Date().toISOString().split('T')[0];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekStart = oneWeekAgo.toISOString().split('T')[0];
    
    switch (activeTab) {
      case 'today':
        return activities.filter(a => a.date === today);
      case 'week':
        return activities.filter(a => a.date >= weekStart);
      default:
        return activities;
    }
  };

  const getRuleColor = (ruleId: number) => {
    switch (ruleId) {
      case 1: return "blue";
      case 2: return "emerald";
      case 3: return "violet";
      default: return "gray";
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto pb-20">
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 sticky top-0 bg-background/95 backdrop-blur-sm pb-4 z-10">
            <div>
              <h1 className="text-3xl font-bold">My Life Code</h1>
              <p className="text-muted-foreground mt-1">
                Three powerful rules to guide your journey
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button 
                size="sm" 
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => setLoading(true)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Activities Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                {stats.totalCompleted} / {activities.length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rule Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                {stats.ruleDistribution.map((count, idx) => (
                  <div key={idx} className="flex items-center">
                    <div 
                      className={`h-3 w-3 rounded-full bg-${getRuleColor(idx+1)}-500 mr-1`}
                    />
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-500" />
                {new Date().toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rules Section */}
        <h2 className="text-2xl font-semibold mb-4">My Rules</h2>
        <div className="space-y-4 mb-8">
          {rules.map((rule) => (
            <Card key={rule.id} className="overflow-hidden">
              <div 
                className={`border-l-4 border-${getRuleColor(rule.id)}-500`}
                style={{ borderLeftWidth: '4px', borderLeftColor: rule.id === 1 ? '#3b82f6' : rule.id === 2 ? '#10b981' : '#8b5cf6' }}
              >
                <CardHeader 
                  className="cursor-pointer" 
                  onClick={() => toggleRuleExpansion(rule.id)}
                >
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg md:text-xl">
                      <span className="mr-2">{rule.id}.</span>
                      {rule.title}
                    </CardTitle>
                    <div>
                      {expandedRule === rule.id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                  <CardDescription className="mt-2 line-clamp-2">
                    {rule.explanation}
                  </CardDescription>
                </CardHeader>

                <AnimatePresence>
                  {expandedRule === rule.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                              Explanation
                            </h4>
                            <p>{rule.explanation}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                              Application
                            </h4>
                            <p>{rule.application}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                              Why This Matters
                            </h4>
                            <p>{rule.why}</p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t bg-muted/40 py-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Brain className="h-4 w-4 mr-2" />
                          <span>
                            Associated with {activities.filter(a => a.rule_id === rule.id).length} activities
                          </span>
                        </div>
                      </CardFooter>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          ))}
        </div>

        {/* Activities Section */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">My Activities</h2>
          <Tabs defaultValue="today" onValueChange={(value) => setActiveTab(value)}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {getFilteredActivities().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <h3 className="font-medium mb-1">No activities found</h3>
                      <p className="text-sm">
                        {activeTab === 'today' 
                          ? "You don't have any activities scheduled for today." 
                          : "No activities found for the selected period."}
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {getFilteredActivities().map((activity) => (
                        <li 
                          key={activity.id} 
                          className={`p-3 rounded-md border flex items-center justify-between ${
                            activity.completed ? 'bg-muted/30' : 'bg-white dark:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center">
                            <div 
                              className="cursor-pointer" 
                              onClick={() => toggleActivityCompletion(activity.id)}
                            >
                              {activity.completed ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 mr-3" />
                              )}
                            </div>
                            <div>
                              <p className={`font-medium ${activity.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {activity.title}
                              </p>
                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>
                                  {new Date(activity.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge 
                            variant="outline"
                            className={`text-xs ml-2 border-${getRuleColor(activity.rule_id)}-500 text-${getRuleColor(activity.rule_id)}-500`}
                            style={{
                              borderColor: activity.rule_id === 1 ? '#3b82f6' : activity.rule_id === 2 ? '#10b981' : '#8b5cf6',
                              color: activity.rule_id === 1 ? '#3b82f6' : activity.rule_id === 2 ? '#10b981' : '#8b5cf6'
                            }}
                          >
                            Rule {activity.rule_id}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
