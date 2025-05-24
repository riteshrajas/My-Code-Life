// Config for Gemini API
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, GenerativeModel, ChatSession } from '@google/generative-ai';

// Use environment variable for API key instead of hardcoding it
export const GEMINI_API_KEY = 'AIzaSyDD7DLIg_k_RB7m13knouKclUMGJzYAP98';
export const MODEL_NAME = 'gemini-2.0-flash'; // Using the Gemini 2.0 Flash model

// Create a singleton instance of the Gemini API client
let geminiClient: GoogleGenerativeAI | null = null;

// Helper function to check if API key is configured
export function isApiKeyConfigured(): boolean {
  return Boolean(GEMINI_API_KEY) && GEMINI_API_KEY.length > 0;
}

// Get or create the Gemini API client
export function getGeminiClient(): GoogleGenerativeAI | null {
  if (!isApiKeyConfigured()) {
    console.error('Gemini API key is not configured');
    return null;
  }
  
  if (!geminiClient) {
    try {
      geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
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

// Function to generate response from Gemini using the life rules context
export async function generateGeminiResponse(userMessage: string, lifeRules: string): Promise<string> {
  const model = getGeminiModel();
  if (!model) return 'API connection error. Please check your API key configuration.';
  
  try {
    const systemPrompt = `
You are an AI advisor that analyzes user messages according to three life rules that guide them.
The three life rules are:

${lifeRules}

For each user message, analyze which rule it relates to most strongly.
Always respond with a properly formatted JSON object with the following structure:
{
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

    const prompt = `
Analyze how the following user message relates to the three life rules:
"${userMessage}"

Respond ONLY with a properly formatted JSON object.
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
      // Try to parse directly first
      try {
        const parsedResponse = JSON.parse(text);
        return JSON.stringify(parsedResponse);
      } catch (directParseError) {
        // If direct parsing fails, try to extract JSON from the text
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                          text.match(/```\n([\s\S]*?)\n```/) ||
                          text.match(/{[\s\S]*?}/);
                          
        if (!jsonMatch) throw new Error("No JSON found in response");
        
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

// Chat session class for ongoing conversations
export class GeminiChatSession {
  private chatSession: ChatSession | null = null;
  private lifeRules: string;
  
  constructor(lifeRules: string) {
    this.lifeRules = lifeRules;
    this.initializeChat();
  }
  
  private initializeChat(): void {
    const systemPrompt = `
You are an AI advisor that analyzes user messages according to three life rules that guide them.
The three life rules are:

${this.lifeRules}

For each user message, analyze which rule it relates to most strongly.
Always respond with a properly formatted JSON object with the following structure:
{
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
  
  async sendMessage(userMessage: string): Promise<string> {
    if (!this.chatSession) {
      this.initializeChat();
      if (!this.chatSession) {
        return JSON.stringify({
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
      
      // Try to parse the response as JSON
      try {
        const parsedResponse = JSON.parse(text);
        return JSON.stringify(parsedResponse);
      } catch (parseError) {
        // Try to extract JSON from text if direct parsing fails
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                          text.match(/```\n([\s\S]*?)\n```/) ||
                          text.match(/{[\s\S]*?}/);
                          
        if (!jsonMatch) throw new Error("No JSON found in response");
        
        const jsonContent = jsonMatch[1] || jsonMatch[0];
        const parsedResponse = JSON.parse(jsonContent);
        return JSON.stringify(parsedResponse);
      }
    } catch (error) {
      console.error('Error in chat session:', error);
      // If there's an error with the chat session, try to reinitialize
      this.initializeChat();
      return JSON.stringify({
        ruleMatch: "Processing Error",
        ruleNumber: 0,
        statusEmoji: "⚠️",
        ruleIcon: "alert-circle",
        alignmentStrength: "Error",
        alignmentClass: "error",
        quote: "Fall seven times, stand up eight.",
        advice: "I encountered an error processing your request. Let's try a fresh start. Please send your message again."
      });
    }
  }
}