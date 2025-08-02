import { GoogleGenerativeAI } from '@google/generative-ai';
import supabase from './supabaseClient';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export interface DetectedHabit {
  category: any;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  confidence: number;
  rule_id: number | null;
  evidence: string[];
  color: string;
}

interface HabitDetectionResult {
  detectedHabits: DetectedHabit[];
  analysis: string;
  recommendations: string[];
}

// Life rules mapping for habit alignment
const LIFE_RULES = {
  1: {
    title: "Seek Truth with Relentless Curiosity",
    keywords: ["learn", "research", "study", "investigate", "explore", "discover", "read", "analyze", "understand"],
    categories: ["Learning", "Mindfulness", "General"]
  },
  2: {
    title: "Live with Uncompromising Integrity",
    keywords: ["honest", "ethical", "moral", "principle", "value", "integrity", "authentic", "genuine", "responsible"],
    categories: ["Social", "General", "Productivity"]
  },
  3: {
    title: "Grow Through Challenges as an Antifragile System",
    keywords: ["challenge", "difficult", "overcome", "growth", "improve", "develop", "strengthen", "resilient", "persist"],
    categories: ["Health & Fitness", "Productivity", "Creative", "General"]
  }
};

const HABIT_COLORS = [
  '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', 
  '#8B5A2B', '#EC4899', '#06B6D4', '#84CC16', '#F97316'
];

const CATEGORY_KEYWORDS = {
  'Health & Fitness': ['exercise', 'workout', 'gym', 'run', 'walk', 'yoga', 'meditate', 'sleep', 'water', 'healthy', 'diet', 'nutrition'],
  'Mindfulness': ['meditate', 'mindful', 'breathe', 'reflect', 'journal', 'gratitude', 'present', 'awareness', 'calm', 'peace'],
  'Learning': ['read', 'study', 'learn', 'course', 'book', 'research', 'practice', 'skill', 'language', 'knowledge'],
  'Productivity': ['organize', 'plan', 'schedule', 'task', 'work', 'project', 'goal', 'productive', 'efficient', 'focus'],
  'Social': ['call', 'meet', 'friend', 'family', 'connect', 'conversation', 'relationship', 'community', 'help', 'support'],
  'Creative': ['write', 'draw', 'paint', 'create', 'art', 'music', 'design', 'craft', 'build', 'make'],
  'Financial': ['budget', 'save', 'money', 'invest', 'expense', 'financial', 'bank', 'track', 'spend', 'income'],
  'Environmental': ['recycle', 'sustainable', 'eco', 'environment', 'green', 'nature', 'climate', 'waste', 'energy', 'clean']
};

export async function detectHabitsFromContent(userId: string, days: number = 30): Promise<HabitDetectionResult | null> {
  try {
    // Get diary entries and tasks from the last N days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateString = startDate.toISOString().split('T')[0];

    const [diaryResponse, tasksResponse] = await Promise.all([
      supabase
        .from('diary_entries')
        .select('content, entry_date')
        .eq('user_id', userId)
        .gte('entry_date', startDateString)
        .order('entry_date', { ascending: false }),
      
      supabase
        .from('tasks')
        .select('title, description, main_topic, sub_topic, status, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
    ]);

    if (diaryResponse.error || tasksResponse.error) {
      console.error('Error fetching content:', diaryResponse.error || tasksResponse.error);
      return null;
    }

    const diaryEntries = diaryResponse.data || [];
    const tasks = tasksResponse.data || [];

    // Combine all content for analysis
    const combinedContent = [
      ...diaryEntries.map(entry => ({
        type: 'diary',
        content: entry.content,
        date: entry.entry_date
      })),
      ...tasks.map(task => ({
        type: 'task',
        content: `${task.title} - ${task.description || ''} (${task.main_topic || ''} ${task.sub_topic || ''})`,
        date: task.created_at.split('T')[0],
        status: task.status
      }))
    ];

    if (combinedContent.length === 0) {
      return {
        detectedHabits: [],
        analysis: "No content found for habit detection. Start writing in your diary or creating tasks to get personalized habit suggestions!",
        recommendations: [
          "Write daily diary entries about your activities",
          "Create tasks for recurring activities",
          "Be specific about your routines and goals"
        ]
      };
    }

    // Use Gemini to analyze patterns and suggest habits
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Analyze the following user content from diary entries and tasks over the last ${days} days to detect recurring patterns that could become positive habits.

Content to analyze:
${combinedContent.map(item => `[${item.type.toUpperCase()} - ${item.date}]: ${item.content}`).join('\n')}

Please identify:
1. Recurring positive behaviors or activities
2. Missed opportunities for positive habits
3. Patterns that suggest the user is already trying to build habits

For each detected habit, provide:
- name: Clear, actionable habit name
- description: Brief description of the habit
- category: One of [Health & Fitness, Mindfulness, Learning, Productivity, Social, Creative, Financial, Environmental, General]
- frequency: daily, weekly, or monthly based on the pattern
- confidence: 0-100 score of how confident you are this is a good habit for this user
- evidence: Array of specific examples from their content that support this habit
- rule_alignment: Which life rule this aligns with (1: Seek Truth, 2: Live with Integrity, 3: Antifragile Growth) or null

Life Rules Context:
1. Seek Truth with Relentless Curiosity - Learning, research, investigation, reading, understanding
2. Live with Uncompromising Integrity - Ethical actions, authentic behavior, honest communication
3. Grow Through Challenges as an Antifragile System - Difficult tasks, overcoming obstacles, personal growth

Response format (JSON):
{
  "detectedHabits": [
    {
      "name": "Morning Meditation",
      "description": "Start each day with 10 minutes of mindfulness meditation",
      "category": "Mindfulness",
      "frequency": "daily",
      "confidence": 85,
      "evidence": ["Mentioned feeling stressed", "Wants to be more present"],
      "rule_alignment": null
    }
  ],
  "analysis": "Overall analysis of patterns found",
  "recommendations": ["Specific recommendations for building habits"]
}

Only suggest habits with confidence > 60. Focus on positive, achievable habits that build on existing patterns.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const parsed = JSON.parse(jsonMatch[0].replace(/```json\s*|\s*```/g, ''));

    // Enhance detected habits with colors and rule IDs
    const enhancedHabits = parsed.detectedHabits.map((habit: any, index: number) => ({
      ...habit,
      color: HABIT_COLORS[index % HABIT_COLORS.length],
      rule_id: habit.rule_alignment || determineRuleAlignment(habit.name, habit.description, habit.category)
    }));

    return {
      detectedHabits: enhancedHabits,
      analysis: parsed.analysis,
      recommendations: parsed.recommendations
    };

  } catch (error) {
    console.error('Error detecting habits:', error);
    return null;
  }
}

function determineRuleAlignment(name: string, description: string, category: string): number | null {
  const content = `${name} ${description} ${category}`.toLowerCase();
  
  let maxScore = 0;
  let bestRule = null;

  for (const [ruleId, rule] of Object.entries(LIFE_RULES)) {
    let score = 0;
    
    // Check keyword matches
    for (const keyword of rule.keywords) {
      if (content.includes(keyword)) {
        score += 1;
      }
    }
    
    // Check category alignment
    if (rule.categories.includes(category)) {
      score += 2;
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestRule = parseInt(ruleId);
    }
  }

  return maxScore > 1 ? bestRule : null;
}

export async function createHabitFromSuggestion(habitData: DetectedHabit): Promise<string | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: user.user.id,
        name: habitData.name,
        description: habitData.description,
        category: habitData.category,
        frequency: habitData.frequency,
        target_count: 1,
        color: habitData.color,
        rule_id: habitData.rule_id,
        is_active: true
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating habit from suggestion:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error creating habit from suggestion:', error);
    return null;
  }
}

export async function analyzeHabitPerformance(habitId: string): Promise<{
  performance: 'excellent' | 'good' | 'fair' | 'poor';
  insights: string[];
  suggestions: string[];
} | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('No authenticated user');

    // Get habit details and recent entries
    const [habitResponse, entriesResponse] = await Promise.all([
      supabase
        .from('habits')
        .select('*')
        .eq('id', habitId)
        .eq('user_id', user.user.id)
        .single(),
      
      supabase
        .from('habit_entries')
        .select('*')
        .eq('habit_id', habitId)
        .eq('user_id', user.user.id)
        .gte('completion_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('completion_date', { ascending: false })
    ]);

    if (habitResponse.error || entriesResponse.error) {
      console.error('Error fetching habit performance data:', habitResponse.error || entriesResponse.error);
      return null;
    }

    const habit = habitResponse.data;
    const entries = entriesResponse.data || [];

    // Calculate performance metrics
    const totalDays = 30;
    const completedDays = entries.length;
    const consistencyRate = (completedDays / totalDays) * 100;
    const currentStreak = habit.streak_count;

    // Determine performance level
    let performance: 'excellent' | 'good' | 'fair' | 'poor';
    if (consistencyRate >= 90) performance = 'excellent';
    else if (consistencyRate >= 70) performance = 'good';
    else if (consistencyRate >= 50) performance = 'fair';
    else performance = 'poor';

    // Generate insights and suggestions
    const insights = [];
    const suggestions = [];

    if (consistencyRate >= 90) {
      insights.push(`Outstanding consistency! You've completed this habit ${completedDays} out of ${totalDays} days.`);
    } else if (consistencyRate >= 70) {
      insights.push(`Good progress with ${Math.round(consistencyRate)}% consistency over the last month.`);
    } else {
      insights.push(`Your consistency rate is ${Math.round(consistencyRate)}%. There's room for improvement.`);
    }

    if (currentStreak > 0) {
      insights.push(`You're on a ${currentStreak}-day streak! Keep it going.`);
    } else {
      insights.push("You don't have an active streak. Starting fresh can be powerful!");
    }

    // Add suggestions based on performance
    if (performance === 'poor') {
      suggestions.push("Consider reducing the frequency or breaking the habit into smaller steps");
      suggestions.push("Set up environmental cues to make the habit easier to remember");
      suggestions.push("Track what prevents you from completing the habit");
    } else if (performance === 'fair') {
      suggestions.push("Try linking this habit to an existing routine");
      suggestions.push("Set up reminders or use habit stacking");
    } else {
      suggestions.push("Consider increasing the difficulty or duration");
      suggestions.push("Share your success with others for accountability");
    }

    return {
      performance,
      insights,
      suggestions
    };

  } catch (error) {
    console.error('Error analyzing habit performance:', error);
    return null;
  }
}
