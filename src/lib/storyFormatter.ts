import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Generative AI API with your API key
const API_KEY = "AIzaSyDD7DLIg_k_RB7m13knouKclUMGJzYAP98";
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Formats a raw story text into a well-structured diary entry
 * using the Gemini API
 * 
 * @param {string} storyText - The raw text to reformat
 * @returns {Promise<string>} - The formatted diary entry
 */
export async function reformatStory(storyText: string): Promise<string> {
  if (!API_KEY) {
    throw new Error("Gemini API key is missing. Please check your environment variables.");
  }

  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Instead of using systemInstruction (which can cause errors), 
    // we'll include our formatting instructions directly in the prompt
    const formattingPrompt = `
    Format the following diary entry according to these guidelines:
    1. Keep all the original information intact
    2. Organize the content into clear paragraphs
    3. Highlight location names in **bold** (e.g., **Restaurant Name**)
    4. Highlight time references in *italics* (e.g., *morning*)
    5. Fix any grammar or spelling issues
    6. Add proper punctuation if missing
    7. Maintain the original voice and perspective
    8. Don't add fictional details - only work with what was provided
    9. Format the entry starting with today's date as a heading

    Original text:
    ${storyText}
    `;

    // Send the formatted prompt to the model
    const result = await model.generateContent(formattingPrompt);
    const response = await result.response;
    const formattedText = response.text();
    
    // Add HTML styling to markdown formatting
    const styledText = formattedText
      // Replace markdown headings with HTML headings
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      // Replace paragraphs with proper HTML paragraphs
      .split('\n\n')
      .map(para => para.trim())
      .filter(para => para && !para.startsWith('<h2>'))
      .map(para => `<p>${para}</p>`)
      .join('')
      // Replace **Location** with styled span (light purple)
      .replace(/\*\*(.*?)\*\*/g, '<span class="location-highlight">$1</span>')
      // Replace *time* with styled span (orange)
      .replace(/\*(.*?)\*/g, '<span class="time-highlight">$1</span>');
    
    return styledText;
  } catch (error) {
    console.error("Error formatting story with Gemini:", error);
    
    // Create a simple fallback formatter with styling
    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    // Simple attempt to highlight common time and location words in the fallback
    let formattedText = storyText
      .split('\n')
      .filter(line => line.trim())
      .join('\n\n');
      
    // Comprehensive list of location words to highlight
    const locationWords = [
      'restaurant', 'cafe', 'coffee shop', 'office', 'home', 'house', 'apartment',
      'park', 'store', 'mall', 'shopping center', 'school', 'university', 'college',
      'library', 'hotel', 'airport', 'station', 'bus stop', 'theater', 'cinema',
      'museum', 'gallery', 'gym', 'studio', 'class', 'classroom', 'lab', 'laboratory',
      'hospital', 'clinic', 'doctor', 'church', 'temple', 'mosque', 'synagogue',
      'beach', 'mountain', 'lake', 'river', 'forest', 'garden', 'yard', 'patio',
      'balcony', 'room', 'bedroom', 'bathroom', 'kitchen', 'living room', 'hall',
      'street', 'road', 'avenue', 'boulevard', 'highway', 'path', 'alley',
      'bar', 'pub', 'club', 'lounge', 'diner', 'bakery', 'food court'
    ];

    // Comprehensive list of time-related words to highlight
    const timeWords = [
      'morning', 'afternoon', 'evening', 'night', 'midnight', 'noon',
      'today', 'yesterday', 'tomorrow', 'last night', 'this morning',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'weekend', 'weekday', 'week', 'month', 'year', 'decade', 'century',
      'january', 'february', 'march', 'april', 'may', 'june', 'july',
      'august', 'september', 'october', 'november', 'december',
      'spring', 'summer', 'fall', 'autumn', 'winter',
      'early', 'late', 'soon', 'later', 'earlier', 'meanwhile', 'afterwards', 
      'before', 'after', 'during', 'am', 'pm', 'o\'clock',
      'minute', 'hour', 'second', 'moment', 'instant', 'day', 'night'
    ];
    
    // First create a copy of the text to work with
    let processedText = formattedText;
    
    // Process multi-word location phrases first (to avoid partial matches)
    locationWords
      .filter(word => word.includes(' '))
      .sort((a, b) => b.length - a.length) // Process longer phrases first
      .forEach(phrase => {
        const regex = new RegExp(phrase, 'gi');
        processedText = processedText.replace(regex, match => 
          `<span class="location-highlight">${match}</span>`);
      });
      
    // Then process single-word locations
    locationWords
      .filter(word => !word.includes(' '))
      .forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        processedText = processedText.replace(regex, match => 
          `<span class="location-highlight">${match}</span>`);
      });
    
    // Process multi-word time phrases first
    timeWords
      .filter(word => word.includes(' '))
      .sort((a, b) => b.length - a.length) // Process longer phrases first
      .forEach(phrase => {
        const regex = new RegExp(phrase, 'gi');
        processedText = processedText.replace(regex, match => 
          `<span class="time-highlight">${match}</span>`);
      });
      
    // Then process single-word time references
    timeWords
      .filter(word => !word.includes(' '))
      .forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        processedText = processedText.replace(regex, match => 
          `<span class="time-highlight">${match}</span>`);
      });
    
    // Add basic time pattern matching for hours (e.g., 8:30, 10am, 2PM)
    processedText = processedText.replace(
      /\b([0-9]{1,2})(:[0-9]{2})?\s*(am|pm|AM|PM)?\b/g,
      match => `<span class="time-highlight">${match}</span>`
    );
    
    return `<h2>${today}</h2>\n\n${processedText}`;
  }
}
