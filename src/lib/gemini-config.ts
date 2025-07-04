// Config for Gemini API
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, GenerativeModel, ChatSession } from '@google/generative-ai';

// Use environment variable for API key instead of hardcoding it
export const MODEL_NAME = 'gemini-2.0-flash'; // Using the Gemini 2.0 Flash model

// Create a singleton instance of the Gemini API client
let geminiClient: GoogleGenerativeAI | null = null;

// Helper function to check if API key is configured
export function isApiKeyConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GEMINI_API_KEY) && import.meta.env.VITE_GEMINI_API_KEY.length > 0;
}

// Get or create the Gemini API client
export function getGeminiClient(): GoogleGenerativeAI | null {
  if (!isApiKeyConfigured()) {
    console.error('Gemini API key is not configured');
    return null;
  }
  
  if (!geminiClient) {
    try {
      geminiClient = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    } catch (error) {
      console.error('Error initializing Gemini API client:', error);
      return null;
    }
  }
  
  return geminiClient;
}

// Configure safety settings for the model
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Configure generation settings
const generationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
};

// Get a model instance with configured settings
export function getGeminiModel(): GenerativeModel | null {
  const client = getGeminiClient();
  if (!client) return null;
  
  return client.getGenerativeModel({
    model: MODEL_NAME,
    safetySettings,
    generationConfig,
  });
}

// Create a chat session with system prompt
export function createGeminiChatSession(systemPrompt: string): ChatSession | null {
  const model = getGeminiModel();
  if (!model) return null;
  
  return model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: `System instructions: ${systemPrompt}` }],
      },
      {
        role: 'model',
        parts: [{ text: 'I understand and will follow these instructions.' }],
      }
    ],
    generationConfig: {
      ...generationConfig,
    }
  });
}

// Function to generate response from Gemini using the life rules context with agentic capabilities
export async function generateGeminiResponse(userMessage: string, lifeRules: string, agenticMode: boolean = false): Promise<string> {
  const model = getGeminiModel();
  if (!model) return 'API connection error. Please check your API key configuration.';
  
  try {
    const baseSystemPrompt = `
You are an AI advisor that analyzes user messages according to three life rules that guide them.
The three life rules are:

${lifeRules}

IMPORTANT GUIDELINES:
1. Only provide rule alignment analysis when the user is asking for advice, making decisions, or sharing something meaningful that relates to their life rules.
2. For casual conversation (greetings, small talk, simple questions), respond naturally without rule analysis.
3. Casual inputs that should NOT trigger rule analysis: "hi", "hello", "thanks", "okay", "good", "yes", "no", basic acknowledgments.
4. Rule analysis should only trigger for: specific advice requests, decision-making, sharing experiences, asking about habits/goals, moral dilemmas, life choices.

For casual conversation, respond with simple, friendly text.
For advice-worthy content, respond with the JSON format including rule analysis.
`;

    const agenticSystemPrompt = `
${baseSystemPrompt}

You are now operating in AGENTIC MODE - you can both provide advice AND take actions within the My Life Code app.

Available Actions:
1. CREATE_TASK - Create a new task/activity
2. CREATE_HABIT - Create a recurring habit
3. DELETE_TASK - Delete an existing task (requires task ID)
4. UPDATE_TASK - Update an existing task (requires task ID)
5. CHANGE_THEME - Change app theme (light/dark/system)
6. UPDATE_PROFILE - Update user profile information
7. DELETE_FAMILY_MEMBER - Remove a family member (requires confirmation)
8. UPDATE_FAMILY_STATUS - Update family member status
9. NAVIGATE_TO_PAGE - Navigate to a specific app page
10. EXPORT_DATA - Export user data
11. CREATE_DIARY_ENTRY - Create a diary/journal entry
12. UPDATE_SETTINGS - Update app settings

You should respond with either:
1. ADVICE ONLY - Traditional life rule analysis in JSON format
2. ACTION - Structured action request that the app can execute

For ACTION responses, use this format:
{
  "type": "action",
  "content": "I'll help you with that! [explanation of what you're doing]",
  "action": {
    "actionType": "CHANGE_THEME",
    "parameters": {
      "theme": "dark"
    },
    "confirmationRequired": false
  }
}

Examples of ACTION responses:
- User: "Change theme to dark" → 
  {
    "type": "action",
    "content": "I'll switch the app to dark mode for you!",
    "action": {
      "actionType": "CHANGE_THEME",
      "parameters": { "theme": "dark" },
      "confirmationRequired": false
    }
  }

- User: "Create a task to call mom tomorrow" →
  {
    "type": "action", 
    "content": "I'll create that task for you!",
    "action": {
      "actionType": "CREATE_TASK",
      "parameters": {
        "title": "Call mom",
        "dueDate": "2025-06-27",
        "priority": "medium",
        "ruleAlignment": 2
      },
      "confirmationRequired": false
    }
  }

For ADVICE responses, use the traditional format:
{
  "type": "advice",
  "ruleMatch": "Rule X: Title",
  "ruleNumber": X,
  "statusEmoji": "✅ or ⚠️",
  "ruleIcon": "brain/shield/bar-chart",
  "alignmentStrength": "Strong/Potential",
  "alignmentClass": "success/warning",
  "quote": "Relevant quote",
  "advice": "Personalized advice"
}

Examples of ACTION triggers:
- "Create a task to..." → CREATE_TASK
- "Add a habit for..." → CREATE_HABIT  
- "Delete the task..." → DELETE_TASK (needs confirmation)
- "Change theme to dark" → CHANGE_THEME with {"theme": "dark"}
- "Switch to light mode" → CHANGE_THEME with {"theme": "light"}
- "Update my profile..." → UPDATE_PROFILE
- "Go to tasks page" → NAVIGATE_TO_PAGE with {"page": "tasks"}
- "Export my data" → EXPORT_DATA
- "Create a diary entry about..." → CREATE_DIARY_ENTRY

Be proactive and magnetic - if the user mentions wanting to do something actionable, offer to do it for them!
`;

    const systemPrompt = agenticMode ? agenticSystemPrompt : baseSystemPrompt;

    const prompt = agenticMode ? `
Analyze the following user message and determine the response type:
"${userMessage}"

RESPONSE RULES:
1. If it's casual conversation ("hi", "hello", "thanks", "okay", "good", "yes", "no") → Respond with PLAIN TEXT only, no JSON
2. If it's an action request ("create task", "change theme", "go to") → Use ACTION JSON format
3. If it's seeking advice ("should I", "help me", "what do you think") → Use ADVICE JSON format

Examples:
- "hi" → "Hello! How can I help you today?" (plain text, no JSON)
- "change theme to dark" → JSON action format
- "should I learn Python?" → JSON advice format

Respond appropriately.
` : `
Analyze the following user message:
"${userMessage}"

RESPONSE RULES:
1. If this is casual conversation ("hi", "hello", "thanks", "okay") → Respond with PLAIN TEXT only, no JSON
2. If it relates to life decisions, goals, or needs advice → Use JSON advice format

Examples:
- "hi" → "Hello! How can I help you today?" (plain text, no JSON)
- "should I take this job?" → JSON advice format with rule analysis

Respond appropriately.
`;

    // Use structured format with responseFormat for cleaner JSON
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'I understand and will follow these instructions.' }] },
        { role: 'user', parts: [{ text: prompt }] }
      ],
      generationConfig: {
        ...generationConfig
      }
    });
    const response = result.response;
    const text = response.text();
    
    // Attempt to parse JSON from the response
    try {
      // Check if response is plain text (no JSON)
      if (!text.includes('{') && !text.includes('"type"')) {
        // Return plain text for casual conversation
        return text;
      }
      
      // Try to parse directly first
      try {
        const parsedResponse = JSON.parse(text);
        return JSON.stringify(parsedResponse);
      } catch (directParseError) {
        // If direct parsing fails, try to extract JSON from the text
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                          text.match(/```\n([\s\S]*?)\n```/) ||
                          text.match(/{[\s\S]*?}/);
                          
        if (!jsonMatch) {
          // If no JSON found, return as plain text (casual conversation)
          return text;
        }
        
        const jsonContent = jsonMatch[1] || jsonMatch[0];
        const parsedResponse = JSON.parse(jsonContent);
        return JSON.stringify(parsedResponse);
      }
    } catch (parseError) {
      // If JSON parsing fails, return a structured error response
      console.error('Error parsing JSON response:', parseError);
      return JSON.stringify({
        ruleMatch: "Processing Error",
        ruleNumber: 0,
        statusEmoji: "⚠️",
        ruleIcon: "alert-circle",
        alignmentStrength: "Error",
        alignmentClass: "error",
        quote: "The obstacle is the way.",
        advice: "I couldn't properly analyze your message. Could you try rephrasing it or providing more context?"
      });
    }
  } catch (error) {
    console.error('Error generating content:', error);
    return JSON.stringify({
      ruleMatch: "API Error",
      ruleNumber: 0,
      statusEmoji: "⚠️",
      ruleIcon: "alert-circle",
      alignmentStrength: "Error",
      alignmentClass: "error",
      quote: "The impediment to action advances action. What stands in the way becomes the way.",
      advice: "I encountered a technical issue. Please try again in a moment."
    });
  }
}

// Function to analyze task input using Gemini AI with enhanced capabilities
export async function analyzeTaskWithGemini(taskInput: string): Promise<any> {
  const model = getGeminiModel();
  if (!model) return null;
  
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();
    
    const systemPrompt = `
You are an AI task analyzer that helps break down user input into structured tasks with smart date and location detection.

Current context:
- Today's date: ${currentDate}
- Current year: ${currentYear}

Analyze the following task input and extract:
1. Main topic (the primary category/area)
2. Sub topic (more specific category)  
3. Title (concise task title)
4. Description (detailed description)
5. Location (if specified, including cities, venues, addresses)
6. Date (if specified, including holiday recognition and relative dates)
7. Time (if specified)
8. Priority level (low, medium, high, urgent)
9. Rule alignment (which of the 3 life rules this aligns with most)
10. Is this related to a holiday?
11. Holiday name (if applicable)
12. Steps (if multi-step process)

HOLIDAY RECOGNITION:
- Independence Day: July 4th
- Christmas: December 25th  
- New Year's Day: January 1st
- Thanksgiving: 4th Thursday in November
- Memorial Day: Last Monday in May
- Labor Day: First Monday in September
- Halloween: October 31st
- Valentine's Day: February 14th
- And other major holidays

DATE PARSING:
- "Independence Day" → "2025-07-04"
- "Christmas" → "2025-12-25"
- "next Monday" → calculate actual date
- "tomorrow" → calculate actual date
- "this weekend" → calculate Saturday date

LOCATION EXTRACTION:
- Extract any mentioned places, cities, venues, golf courses, restaurants, etc.
- Include full location names when mentioned

MULTI-STEP DETECTION:
- Break down complex tasks into logical steps
- For example: "Plan a golf trip" → ["Research golf courses", "Book tee times", "Arrange accommodation", "Pack equipment"]

Respond ONLY with a properly formatted JSON object:
{
  "title": "Extracted task title",
  "description": "Detailed description of what needs to be done",
  "mainTopic": "Primary category (e.g., Sports, Work, Personal, Health, Travel)",
  "subTopic": "Specific subcategory (e.g., Golf, Programming, Exercise, Vacation)",
  "location": "Location if mentioned (or null)",
  "dueDate": "YYYY-MM-DD format if date mentioned (or null)",
  "dueTime": "HH:MM format if time mentioned (or null)",
  "priority": "low/medium/high/urgent",
  "ruleAlignment": 1, 2, or 3 based on which life rule it aligns with most,
  "isHoliday": true/false,
  "holidayName": "Name of holiday if applicable (or null)",
  "steps": ["Step 1", "Step 2", ...] if multi-step process, or single item array for simple tasks
}

Life Rules for alignment:
1. Seek Truth with Relentless Curiosity - learning, research, investigation, studying
2. Live with Uncompromising Integrity - ethical actions, meaningful work, commitments
3. Grow Through Challenges as an Antifragile System - difficult tasks, growth opportunities, challenges
`;

    const prompt = `Analyze this task input: "${taskInput}"`;

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'I understand and will analyze tasks according to these instructions.' }] },
        { role: 'user', parts: [{ text: prompt }] }
      ],
      generationConfig: {
        ...generationConfig
      }
    });
    
    const response = result.response;
    const text = response.text();
    
    try {
      // Try to parse JSON directly
      const parsed = JSON.parse(text);
      return parsed;
    } catch (directParseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                        text.match(/```\n([\s\S]*?)\n```/) ||
                        text.match(/{[\s\S]*?}/);
                        
      if (jsonMatch) {
        const jsonContent = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonContent);
      }
      
      throw new Error("Could not parse JSON from response");
    }
  } catch (error) {
    console.error('Error analyzing task with Gemini:', error);
    return {
      title: taskInput.slice(0, 50),
      description: taskInput,
      mainTopic: "General",
      subTopic: "Task",
      location: null,
      dueDate: null,
      dueTime: null,
      priority: "medium",
      ruleAlignment: 2,
      isHoliday: false,
      holidayName: null,
      steps: [taskInput]
    };
  }
}

// Chat session class for ongoing conversations with agentic capabilities
export class GeminiChatSession {
  private chatSession: ChatSession | null = null;
  private lifeRules: string;
  private agenticMode: boolean;
  
  constructor(lifeRules: string, agenticMode: boolean = false) {
    this.lifeRules = lifeRules;
    this.agenticMode = agenticMode;
    this.initializeChat();
  }
  
  private initializeChat(): void {
    const baseSystemPrompt = `
You are an AI advisor that analyzes user messages according to three life rules that guide them.
The three life rules are:

${this.lifeRules}

IMPORTANT GUIDELINES:
1. Only provide rule alignment analysis when the user is asking for advice, making decisions, or sharing something meaningful that relates to their life rules.
2. For casual conversation (greetings, small talk, simple questions), respond naturally without rule analysis.
3. Casual inputs that should NOT trigger rule analysis: "hi", "hello", "thanks", "okay", "good", "yes", "no", basic acknowledgments.
4. Rule analysis should only trigger for: specific advice requests, decision-making, sharing experiences, asking about habits/goals, moral dilemmas, life choices.

For each user message, analyze which rule it relates to most strongly.
Always respond with a properly formatted JSON object with the following structure:
`;

    const agenticSystemPrompt = `
${baseSystemPrompt}

You are now operating in AGENTIC MODE - you can both provide advice AND take actions within the My Life Code app.

CRITICAL RESPONSE RULES:
1. For casual greetings ("hi", "hello", "thanks", "okay") → Respond with PLAIN TEXT only
2. For action requests ("create task", "change theme") → Use ACTION JSON format
3. For advice requests ("should I...", "help me decide") → Use ADVICE JSON format

Available Actions:
1. CREATE_TASK - Create a new task/activity
2. CREATE_HABIT - Create a recurring habit
3. DELETE_TASK - Delete an existing task (requires task ID)
4. UPDATE_TASK - Update an existing task (requires task ID)
5. CHANGE_THEME - Change app theme (light/dark/system)
6. UPDATE_PROFILE - Update user profile information
7. DELETE_FAMILY_MEMBER - Remove a family member (requires confirmation)
8. UPDATE_FAMILY_STATUS - Update family member status
9. NAVIGATE_TO_PAGE - Navigate to a specific app page
10. EXPORT_DATA - Export user data
11. CREATE_DIARY_ENTRY - Create a diary/journal entry
12. UPDATE_SETTINGS - Update app settings

You should respond with either:
1. CASUAL CONVERSATION - Simple text response for greetings and small talk (NO JSON)
2. ACTION - Structured action request that the app can execute (JSON format)
3. ADVICE - Traditional life rule analysis (JSON format)

CASUAL CONVERSATION Examples (NO JSON):
- "hi" → "Hello! How can I help you today?"
- "hello" → "Hi there! What's on your mind?"
- "thanks" → "You're welcome!"
- "okay" → "Great! Anything else I can help with?"

For ACTION responses, use this format:
{
  "type": "action",
  "content": "I'll help you with that! [explanation of what you're doing]",
  "action": {
    "actionType": "CHANGE_THEME",
    "parameters": {
      "theme": "dark"
    },
    "confirmationRequired": false,
    "confirmationMessage": "Optional confirmation message"
  }
}

For ADVICE responses, use the traditional format:
{
  "type": "advice",
  "ruleMatch": "Rule X: Title",
  "ruleNumber": X,
  "statusEmoji": "✅ or ⚠️",
  "ruleIcon": "brain/shield/bar-chart",
  "alignmentStrength": "Strong/Potential",
  "alignmentClass": "success/warning",
  "quote": "Relevant quote",
  "advice": "Personalized advice"
}

Be proactive and magnetic - if the user mentions wanting to do something actionable, offer to do it for them!
`;

    const systemPrompt = this.agenticMode ? agenticSystemPrompt : `
${baseSystemPrompt}

CRITICAL: For casual conversation (like "hi", "hello", "thanks", "okay"), respond with PLAIN TEXT only - NO JSON formatting.
Examples:
- "hi" → "Hello! How can I help you today?"
- "hello" → "Hi there! What's on your mind?"
- "thanks" → "You're welcome!"
- "okay" → "Great! Is there anything else I can help with?"

Only use JSON format for meaningful requests that need life rule analysis.

For advice requests, use this JSON format:
{
  "type": "advice",
  "ruleMatch": "Rule X: Title of the rule",
  "ruleNumber": X,
  "statusEmoji": "✅ or ⚠️",
  "ruleIcon": "brain for rule 1, shield for rule 2, or bar-chart for rule 3",
  "alignmentStrength": "Strong or Potential",
  "alignmentClass": "success or warning",
  "quote": "A relevant quote related to the rule",
  "advice": "Personalized advice based on the rule and user message"
}
`;

    const model = getGeminiModel();
    if (!model) return;
    
    this.chatSession = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'I understand and will follow these instructions.' }],
        },
      ],
      generationConfig: {
        ...generationConfig,
      }
    });
  }

  // Enable or disable agentic mode
  setAgenticMode(enabled: boolean): void {
    if (this.agenticMode !== enabled) {
      this.agenticMode = enabled;
      this.initializeChat(); // Reinitialize with new mode
    }
  }

  // Check if agentic mode is enabled
  isAgenticModeEnabled(): boolean {
    return this.agenticMode;
  }

  // Reset the chat session (clear conversation history)
  resetSession(): void {
    this.initializeChat();
  }

  // Get conversation history (if available)
  getHistory(): any[] {
    return this.chatSession ? [] : []; // Gemini doesn't expose history directly
  }

  // Clear and reinitialize session
  clearSession(): void {
    this.chatSession = null;
    this.initializeChat();
  }
  
  async sendMessage(userMessage: string): Promise<string> {
    if (!this.chatSession) {
      this.initializeChat();
      if (!this.chatSession) {
        return JSON.stringify({
          type: "advice",
          ruleMatch: "Connection Error",
          ruleNumber: 0,
          statusEmoji: "⚠️",
          ruleIcon: "alert-circle",
          alignmentStrength: "Error",
          alignmentClass: "error",
          quote: "First, solve the problem. Then, write the code.",
          advice: "There seems to be an issue connecting to the Gemini API. Please check your API key configuration."
        });
      }
    }
    
    try {
      const result = await this.chatSession.sendMessage(userMessage);
      const text = result.response.text();
      
      // Check if it's a casual conversation response (plain text)
      if (!text.includes('{') && !text.includes('"type"')) {
        // Plain text response for casual conversation
        return text;
      }
      
      // Try to parse the response as JSON
      try {
        const parsedResponse = JSON.parse(text);
        // Ensure type is set for backwards compatibility
        if (!parsedResponse.type) {
          parsedResponse.type = "advice";
        }
        return JSON.stringify(parsedResponse);
      } catch (parseError) {
        // Try to extract JSON from text if direct parsing fails
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                          text.match(/```\n([\s\S]*?)\n```/) ||
                          text.match(/{[\s\S]*?}/);
                          
        if (!jsonMatch) {
          // If no JSON found, return as plain text (casual conversation)
          return text;
        }
        
        const jsonContent = jsonMatch[1] || jsonMatch[0];
        const parsedResponse = JSON.parse(jsonContent);
        // Ensure type is set
        if (!parsedResponse.type) {
          parsedResponse.type = "advice";
        }
        return JSON.stringify(parsedResponse);
      }
    } catch (error) {
      console.error('Error in chat session:', error);
      // If there's an error with the chat session, try to reinitialize
      this.initializeChat();
      return JSON.stringify({
        type: "advice",
        ruleMatch: "Processing Error",
        ruleNumber: 0,
        statusEmoji: "⚠️",
        ruleIcon: "alert-circle",
        alignmentStrength: "Error",
        alignmentClass: "error",
        quote: "The obstacle is the way.",
        advice: "I encountered an issue processing your message. Could you try rephrasing it?"
      });
    }
  }
}