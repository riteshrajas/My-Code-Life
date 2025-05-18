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

// Function to have a continuous chat with context memory
export class GeminiAdvisor {
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