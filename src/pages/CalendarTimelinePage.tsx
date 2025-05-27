import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Value } from 'react-calendar/dist/esm/shared/types.js';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  Circle,
  MapPin, 
  Flag, 
  Brain, 
  Shield, 
  BarChart3,
  ArrowLeft,
  Filter,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Sparkles,
  Target,
  Users,
  Heart,
  History as Timeline
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import supabase from '@/lib/supabaseClient';
import { getTasks } from '@/lib/taskService';
import { toast } from '@/hooks/use-toast';

interface DiaryEntry {
  id: string;
  user_id: string;
  entry_date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: string;
  user_id: string;
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
}

interface TimelineEvent {
  id: string;
  date: string;
  time?: string;
  type: 'diary' | 'task';
  title: string;
  content: string;
  status?: string;
  priority?: string;
  rule_id?: number;
  location?: string;
  is_holiday?: boolean;
  holiday_name?: string;
}

const CalendarTimelinePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeView, setActiveView] = useState<'calendar' | 'timeline'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'diary' | 'tasks'>('all');
  const [filterRule, setFilterRule] = useState<'all' | '1' | '2' | '3'>('all');
  const [timelineRange, setTimelineRange] = useState<'week' | 'month' | '3months'>('month');

  // Get current user and fetch data
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        await fetchData(user.id);
      }
    };
    getCurrentUser();
  }, []);

  const fetchData = async (userId: string) => {
    try {
      setLoading(true);
      
      // Fetch diary entries
      const { data: diaryData, error: diaryError } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false });

      if (diaryError) {
        console.error('Error fetching diary entries:', diaryError);
      } else {
        setDiaryEntries(diaryData || []);
      }

      // Fetch tasks
      const tasksData = await getTasks();
      // Ensure all tasks have a string id (fallback to empty string if undefined)
      setTasks((tasksData || []).map((task: any) => ({
        ...task,
        id: task.id ?? '',
      })));

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calendar data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate timeline events
  useEffect(() => {
    const events: TimelineEvent[] = [
      ...diaryEntries.map(entry => ({
        id: `diary-${entry.id}`,
        date: entry.entry_date,
        type: 'diary' as const,
        title: 'Diary Entry',
        content: entry.content,
      })),
      ...tasks.map(task => ({
        id: `task-${task.id}`,
        date: task.due_date || task.created_at.split('T')[0],
        time: task.due_time || undefined,
        type: 'task' as const,
        title: task.title,
        content: task.description,
        status: task.status,
        priority: task.priority,
        rule_id: task.rule_id,
        location: task.location ?? undefined,
        is_holiday: task.is_holiday,
        holiday_name: task.holiday_name ?? undefined,
      }))
    ];

    // Filter events
    let filteredEvents = events;
    
    if (filterType !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.type === filterType.slice(0, -1));
    }
    
    if (filterRule !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.rule_id === parseInt(filterRule));
    }
    
    if (searchQuery.trim()) {
      filteredEvents = filteredEvents.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by date and time
    filteredEvents.sort((a, b) => {
      const dateA = new Date(a.date + (a.time ? ` ${a.time}` : ''));
      const dateB = new Date(b.date + (b.time ? ` ${b.time}` : ''));
      return dateB.getTime() - dateA.getTime();
    });

    setTimelineEvents(filteredEvents);
  }, [diaryEntries, tasks, searchQuery, filterType, filterRule]);

  const handleDateChange = (value: Value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    } else if (Array.isArray(value) && value[0] instanceof Date) {
      setSelectedDate(value[0]);
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return timelineEvents.filter(event => event.date === dateString);
  };

  const getRuleInfo = (ruleId: number) => {
    switch (ruleId) {
      case 1:
        return { icon: Brain, color: 'blue', name: 'Truth & Curiosity' };
      case 2:
        return { icon: Shield, color: 'emerald', name: 'Integrity' };
      case 3:
        return { icon: BarChart3, color: 'violet', name: 'Antifragile Growth' };
      default:
        return { icon: Target, color: 'gray', name: 'General' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 border-red-300 bg-red-50';
      case 'high': return 'text-orange-600 border-orange-300 bg-orange-50';
      case 'medium': return 'text-yellow-600 border-yellow-300 bg-yellow-50';
      case 'low': return 'text-green-600 border-green-300 bg-green-50';
      default: return 'text-gray-600 border-gray-300 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 border-green-300 bg-green-50';
      case 'in_progress': return 'text-blue-600 border-blue-300 bg-blue-50';
      case 'cancelled': return 'text-red-600 border-red-300 bg-red-50';
      default: return 'text-gray-600 border-gray-300 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const events = getEventsForDate(date);
      if (events.length > 0) {
        return (
          <div className="flex flex-wrap gap-1 mt-1">
            {events.slice(0, 2).map((event, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  event.type === 'diary' 
                    ? 'bg-purple-500' 
                    : event.status === 'completed'
                    ? 'bg-green-500'
                    : 'bg-blue-500'
                }`}
              />
            ))}
            {events.length > 2 && (
              <div className="w-2 h-2 rounded-full bg-gray-400" />
            )}
          </div>
        );
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <CalendarIcon className="h-8 w-8 text-blue-500" />
                Calendar & Timeline
              </h1>
              <p className="text-muted-foreground mt-1">
                Visualize your diary entries and tasks across time
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'calendar' | 'timeline')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-2">
                  <Timeline className="h-4 w-4" />
                  Timeline
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search entries and tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="diary">Diary Only</SelectItem>
              <SelectItem value="tasks">Tasks Only</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterRule} onValueChange={(value) => setFilterRule(value as any)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter by rule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rules</SelectItem>
              <SelectItem value="1">Rule 1 - Truth</SelectItem>
              <SelectItem value="2">Rule 2 - Integrity</SelectItem>
              <SelectItem value="3">Rule 3 - Growth</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {activeView === 'calendar' ? (
            <>
              {/* Calendar View */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-5"
              >
                <Card className="shadow-lg">
                  <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-blue-500" />
                      Calendar View
                    </CardTitle>
                    <CardDescription>
                      Click on any date to see your entries and tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="calendar-container">
                      <Calendar
                        onChange={handleDateChange}
                        value={selectedDate}
                        tileContent={tileContent}
                        className="w-full border-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Selected Date Details */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-7"
              >
                <Card className="shadow-lg">
                  <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-blue-50">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-purple-500" />
                        {formatDate(selectedDate.toISOString().split('T')[0])}
                      </div>
                      <Badge variant="secondary">
                        {getEventsForDate(selectedDate).length} items
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedDate.toISOString()}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                      >
                        {getEventsForDate(selectedDate).length > 0 ? (
                          getEventsForDate(selectedDate).map((event) => (
                            <div
                              key={event.id}
                              className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {event.type === 'diary' ? (
                                    <BookOpen className="h-4 w-4 text-purple-500" />
                                  ) : event.status === 'completed' ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-blue-500" />
                                  )}
                                  <h4 className="font-medium">{event.title}</h4>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {event.time && (
                                    <Badge variant="outline" className="text-xs">
                                      {event.time}
                                    </Badge>
                                  )}
                                  {event.type === 'task' && event.rule_id && (
                                    <Badge variant="outline" className="text-xs">
                                      Rule {event.rule_id}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                                {event.content}
                              </p>
                              
                              {event.type === 'task' && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  {event.status && (
                                    <Badge variant="outline" className={`text-xs ${getStatusColor(event.status)}`}>
                                      {event.status.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                  )}
                                  {event.priority && event.priority !== 'medium' && (
                                    <Badge variant="outline" className={`text-xs ${getPriorityColor(event.priority)}`}>
                                      <Flag className="h-3 w-3 mr-1" />
                                      {event.priority.toUpperCase()}
                                    </Badge>
                                  )}
                                  {event.location && (
                                    <Badge variant="outline" className="text-xs">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {event.location}
                                    </Badge>
                                  )}
                                  {event.is_holiday && event.holiday_name && (
                                    <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                                      🎉 {event.holiday_name}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                              <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">No entries for this date</p>
                            <div className="flex gap-2 justify-center mt-4">
                              <Button size="sm" variant="outline" asChild>
                                <Link to="/dashboard/daily-diary">
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  Add Diary Entry
                                </Link>
                              </Button>
                              <Button size="sm" variant="outline" asChild>
                                <Link to="/dashboard">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create Task
                                </Link>
                              </Button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          ) : (
            /* Timeline View */
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-12"
            >
              <Card className="shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-blue-50">
                  <CardTitle className="flex items-center gap-2">
                    <Timeline className="h-5 w-5 text-purple-500" />
                    Timeline View
                  </CardTitle>
                  <CardDescription>
                    Chronological view of all your diary entries and tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {timelineEvents.length > 0 ? (
                    <div className="space-y-6">
                      {timelineEvents.map((event, index) => {
                        const ruleInfo = event.rule_id ? getRuleInfo(event.rule_id) : null;
                        const RuleIcon = ruleInfo?.icon;
                        
                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex gap-4"
                          >
                            <div className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                event.type === 'diary' 
                                  ? 'bg-purple-100 text-purple-600' 
                                  : event.status === 'completed'
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-blue-100 text-blue-600'
                              }`}>
                                {event.type === 'diary' ? (
                                  <BookOpen className="h-5 w-5" />
                                ) : event.status === 'completed' ? (
                                  <CheckCircle className="h-5 w-5" />
                                ) : (
                                  <Circle className="h-5 w-5" />
                                )}
                              </div>
                              {index < timelineEvents.length - 1 && (
                                <div className="w-px h-16 bg-border mt-2" />
                              )}
                            </div>
                            
                            <div className="flex-1 pb-6">
                              <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h3 className="font-medium">{event.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDate(event.date)}
                                      {event.time && ` at ${event.time}`}
                                    </p>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {event.type === 'task' && ruleInfo && (
                                      <div className={`p-1 rounded bg-${ruleInfo.color}-100`}>
                                        {RuleIcon && <RuleIcon className={`h-4 w-4 text-${ruleInfo.color}-600`} />}
                                      </div>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {event.type === 'diary' ? 'Diary' : 'Task'}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <p className="text-sm mb-3 line-clamp-2">
                                  {event.content}
                                </p>
                                
                                {event.type === 'task' && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {event.status && (
                                      <Badge variant="outline" className={`text-xs ${getStatusColor(event.status)}`}>
                                        {event.status.replace('_', ' ').toUpperCase()}
                                      </Badge>
                                    )}
                                    {event.priority && event.priority !== 'medium' && (
                                      <Badge variant="outline" className={`text-xs ${getPriorityColor(event.priority)}`}>
                                        <Flag className="h-3 w-3 mr-1" />
                                        {event.priority.toUpperCase()}
                                      </Badge>
                                    )}
                                    {event.location && (
                                      <Badge variant="outline" className="text-xs">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {event.location}
                                      </Badge>
                                    )}
                                    {event.is_holiday && event.holiday_name && (
                                      <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                                        🎉 {event.holiday_name}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Timeline className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-4">No timeline events found</p>
                      <p className="text-sm text-muted-foreground mb-6">
                        Start by creating diary entries and tasks to see your timeline
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" asChild>
                          <Link to="/dashboard/daily-diary">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Write Diary Entry
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link to="/dashboard">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Task
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"
        >
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{diaryEntries.length}</div>
              <p className="text-xs text-muted-foreground">Diary Entries</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <style>{`
        .calendar-container .react-calendar {
          width: 100%;
          background: white;
          border: none;
          font-family: inherit;
        }
        
        .calendar-container .react-calendar__tile {
          max-width: 100%;
          padding: 10px 6px;
          background: none;
          text-align: center;
          line-height: 16px;
          font-size: 0.875rem;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        
        .calendar-container .react-calendar__tile:enabled:hover,
        .calendar-container .react-calendar__tile:enabled:focus {
          background-color: rgb(239 246 255);
          color: rgb(59 130 246);
        }
        
        .calendar-container .react-calendar__tile--now {
          background: rgb(239 246 255);
          color: rgb(59 130 246);
          font-weight: 600;
        }
        
        .calendar-container .react-calendar__tile--active {
          background: rgb(59 130 246);
          color: white;
          font-weight: 600;
        }
        
        .calendar-container .react-calendar__tile--active:enabled:hover,
        .calendar-container .react-calendar__tile--active:enabled:focus {
          background: rgb(37 99 235);
        }
        
        .calendar-container .react-calendar__navigation button {
          color: rgb(59 130 246);
          font-size: 16px;
          font-weight: 600;
          background: none;
          border: none;
          padding: 10px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        
        .calendar-container .react-calendar__navigation button:enabled:hover,
        .calendar-container .react-calendar__navigation button:enabled:focus {
          background-color: rgb(239 246 255);
        }
        
        .calendar-container .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: 600;
          font-size: 0.75rem;
          color: rgb(107 114 128);
          padding: 10px 0;
        }
        
        .calendar-container .react-calendar__month-view__weekdays__weekday {
          padding: 0.5rem;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default CalendarTimelinePage;
