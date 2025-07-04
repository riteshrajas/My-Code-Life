import { GoogleGenerativeAI } from '@google/generative-ai';



let genAI: GoogleGenerativeAI | null = null;

if (import.meta.env.VITE_GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
} else {
  console.warn('Gemini API key not found. Voice AI analysis will be disabled.');
}

interface VoiceAnalysisResult {
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  keywords: string[];
  actionItems: string[];
  ruleAlignment?: {
    rule1: number; // Truth & Curiosity
    rule2: number; // Integrity
    rule3: number; // Antifragile Growth
  };
  suggestions: string[];
}

export const analyzeVoiceTranscript = async (
  transcript: string,
  type: 'diary' | 'task' | 'note' = 'diary'
): Promise<VoiceAnalysisResult> => {
  if (!genAI) {
    throw new Error('Gemini AI is not configured');
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
Analyze this voice transcript for a ${type} entry and provide insights:

"${transcript}"

The analysis should consider these three life rules:
1. Truth & Curiosity - Being honest, seeking knowledge, asking questions
2. Integrity - Acting according to values, being consistent, doing what's right
3. Antifragile Growth - Learning from challenges, becoming stronger through adversity

Please provide a JSON response with:
- summary: A brief summary of the content (2-3 sentences)
- sentiment: overall emotional tone (positive/negative/neutral)
- keywords: key themes or topics mentioned (5-8 words)
- actionItems: specific actionable items mentioned (if any)
- ruleAlignment: score 0-10 for how well this aligns with each rule
- suggestions: 2-3 constructive suggestions based on the content

Format your response as valid JSON only.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return analysis;
    } else {
      // Fallback if JSON parsing fails
      return {
        summary: "Voice input captured successfully.",
        sentiment: 'neutral' as const,
        keywords: extractKeywords(transcript),
        actionItems: extractActionItems(transcript),
        ruleAlignment: {
          rule1: 5,
          rule2: 5,
          rule3: 5
        },
        suggestions: [
          "Consider reflecting on how this relates to your personal values.",
          "Think about any action steps you might want to take."
        ]
      };
    }
  } catch (error) {
    console.error('Error analyzing voice transcript:', error);
    
    // Return a basic analysis if AI fails
    return {
      summary: `${type.charAt(0).toUpperCase() + type.slice(1)} entry recorded via voice input.`,
      sentiment: 'neutral' as const,
      keywords: extractKeywords(transcript),
      actionItems: extractActionItems(transcript),
      ruleAlignment: {
        rule1: 5,
        rule2: 5,
        rule3: 5
      },
      suggestions: [
        "Voice input captured successfully.",
        "Consider reviewing and editing the transcription if needed."
      ]
    };
  }
};

// Fallback keyword extraction
const extractKeywords = (text: string): string[] => {
  const commonWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'to', 'are', 'as', 'was', 'will', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'should', 'would', 'may',
    'might', 'must', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
    'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that',
    'these', 'those', 'am', 'is', 'are', 'was', 'were', 'been', 'being', 'have', 'has',
    'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
  ]);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  return Array.from(wordCount.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([word]) => word);
};

// Fallback action item extraction
const extractActionItems = (text: string): string[] => {
  const actionPatterns = [
    /(?:need to|should|must|have to|going to|plan to|want to|will)\s+([^.!?]+)/gi,
    /(?:todo|to do|task|action):\s*([^.!?]+)/gi,
    /(?:remember to|don't forget to)\s+([^.!?]+)/gi
  ];

  const actionItems: string[] = [];
  
  actionPatterns.forEach(pattern => {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      if (match[1]) {
        actionItems.push(match[1].trim());
      }
    }
  });

  return actionItems.slice(0, 5); // Return max 5 action items
};

export default analyzeVoiceTranscript;
