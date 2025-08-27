/**
 * Text cleaning utilities for AI voice dictation
 * Handles stutters, repetitions, and text normalization
 */

// Common food names and their variations/corrections
const FOOD_NAME_CORRECTIONS: Record<string, string> = {
  // Thai dishes
  'pad dye': 'Pad Thai',
  'pad dy': 'Pad Thai', 
  'pad tie': 'Pad Thai',
  'pad thai': 'Pad Thai',
  'pad tai': 'Pad Thai',
  
  // German dishes
  'schnitzel': 'Schnitzel',
  'spätzle': 'Spätzle',
  'spaetzle': 'Spätzle',
  'bratwurst': 'Bratwurst',
  'sauerkraut': 'Sauerkraut',
  'currywurst': 'Currywurst',
  
  // Common breakfast items
  'pancakes': 'Pancakes',
  'pan cakes': 'Pancakes',
  'waffle': 'Waffle',
  'waffles': 'Waffles',
  'benedict': 'Benedict',
  'eggs benedict': 'Eggs Benedict',
  'croissant': 'Croissant',
  'crossant': 'Croissant',
  
  // Common ingredients
  'avocado': 'Avocado',
  'avacado': 'Avocado',
  'avacodo': 'Avocado',
  'avakado': 'Avocado',
  'tomato': 'Tomato',
  'tomatoe': 'Tomato',
  'tomatos': 'Tomatoes',
  'mushroom': 'Mushroom',
  'mushrume': 'Mushroom',
  'mushrooms': 'Mushrooms',
  'spinach': 'Spinach',
  'spinich': 'Spinach',
  'lemon': 'Lemon',
  'lemmon': 'Lemon',
  'lemons': 'Lemons',
  'onion': 'Onion',
  'onions': 'Onions',
  'onyon': 'Onion',
  'rice': 'Rice',
  'ryce': 'Rice',
  'chicken': 'Chicken',
  'chiken': 'Chicken',
  'chickin': 'Chicken',
  'beef': 'Beef',
  'beaf': 'Beef',
  'carrot': 'Carrot',
  'carot': 'Carrot',
  'carrots': 'Carrots',
  'pepper': 'Pepper',
  'peppers': 'Peppers',
  'peper': 'Pepper',
  'garlic': 'Garlic',
  'garlick': 'Garlic',
  'ginger': 'Ginger',
  'ginjer': 'Ginger',
  'cheese': 'Cheese',
  'cheeze': 'Cheese',
  'oil': 'Oil',
  'olive oil': 'Olive Oil',
  'salt': 'Salt',
  'sugar': 'Sugar',
  'suger': 'Sugar',
  'flour': 'Flour',
  'flower': 'Flour',
};

/**
 * Remove stutters and repetitions from text
 */
export function removeStuttersAndRepetitions(text: string): string {
  if (!text || text.trim().length === 0) return text;
  
  // Split into words and clean
  const words = text.toLowerCase().split(/\s+/);
  const cleanedWords: string[] = [];
  
  let i = 0;
  while (i < words.length) {
    const currentWord = words[i];
    
    // Skip empty words
    if (!currentWord) {
      i++;
      continue;
    }
    
    // Remove common filler words and stutters
    if (isFiller(currentWord)) {
      i++;
      continue;
    }
    
    // Check for immediate repetitions (same word repeated)
    if (i > 0 && currentWord === words[i - 1]) {
      i++;
      continue;
    }
    
    // Check for partial stutters (like "pa pa pad thai")
    if (i < words.length - 1) {
      const nextWord = words[i + 1];
      if (isStutter(currentWord, nextWord)) {
        i++; // Skip current word, continue with next
        continue;
      }
    }
    
    // Check for phrase repetitions (like "pad thai pad thai")
    if (i < words.length - 1) {
      const phraseLength = detectPhraseRepetition(words, i);
      if (phraseLength > 1) {
        // Add the phrase once and skip the repetition
        for (let j = 0; j < phraseLength; j++) {
          cleanedWords.push(words[i + j]);
        }
        i += phraseLength * 2; // Skip both occurrences
        continue;
      }
    }
    
    cleanedWords.push(currentWord);
    i++;
  }
  
  // Join words back and apply food name corrections
  let cleanedText = cleanedWords.join(' ');
  cleanedText = applyFoodNameCorrections(cleanedText);
  
  // Final cleanup: proper capitalization
  cleanedText = properCapitalization(cleanedText);
  
  return cleanedText.trim();
}

/**
 * Enhanced filler word patterns for better voice recognition cleanup
 */
const FILLER_WORDS = [
  // Basic fillers - extended variations
  'um', 'uh', 'er', 'ah', 'eh', 'mm', 'hmm', 'umm', 'uhh', 'ahh', 'ohh', 'erm',
  // German fillers
  'äh', 'ähm', 'em', 'ähem', 'hm', 'na', 'naja', 'also',
  // English discourse markers
  'like', 'you know', 'so', 'well', 'actually', 'basically', 'literally',
  // False starts and hesitation
  'i mean', 'that is', 'let me see', 'let me think', 'you see',
  // Common speech patterns
  'kind of', 'sort of', 'i guess', 'i think',
];

const FILLER_PATTERNS = [
  /\b(um+|ah+|eh+|oh+|uh+)\b/gi,  // Extended sounds like "ummm", "ahhh"
  /\b\w{1,3}--+\w+/g,              // Stutters like "le--lemon"
  /\b(\w)\1{2,}\b/g,               // Repeated letters "lllemon", "mmm"
  /\b\w{1,2}\.{2,}\w+\b/g,         // Partial words "le...lemon"
  /\b(and|and|und)\s+(um|uh|ah)\b/gi, // "and um", "and uh", "und äh"
];

/**
 * Check if a word or phrase is a filler word or stutter indicator
 */
function isFiller(word: string): boolean {
  const cleanWord = word.toLowerCase().trim();
  
  // Check exact matches
  if (FILLER_WORDS.includes(cleanWord)) {
    return true;
  }
  
  // Check against patterns
  for (const pattern of FILLER_PATTERNS) {
    if (pattern.test(cleanWord)) {
      return true;
    }
  }
  
  // Check for very short words that are likely stutters
  if (cleanWord.length <= 2 && /^[aeiouäöü]+$/.test(cleanWord)) {
    return true;
  }
  
  return false;
}

/**
 * Check if current word is a stutter of the next word
 */
function isStutter(current: string, next: string): boolean {
  if (!current || !next) return false;
  
  // Check if current is a prefix of next (e.g., "pa" -> "pad")
  if (next.startsWith(current) && current.length < next.length && current.length >= 1) {
    return true;
  }
  
  // Check for single letter stutters
  if (current.length === 1 && next.startsWith(current)) {
    return true;
  }
  
  return false;
}

/**
 * Detect phrase repetitions (like "pad thai pad thai")
 */
function detectPhraseRepetition(words: string[], startIndex: number): number {
  const maxPhraseLength = Math.min(4, Math.floor((words.length - startIndex) / 2));
  
  for (let phraseLength = 2; phraseLength <= maxPhraseLength; phraseLength++) {
    if (startIndex + phraseLength * 2 > words.length) continue;
    
    let isRepetition = true;
    for (let i = 0; i < phraseLength; i++) {
      if (words[startIndex + i] !== words[startIndex + phraseLength + i]) {
        isRepetition = false;
        break;
      }
    }
    
    if (isRepetition) {
      return phraseLength;
    }
  }
  
  return 0;
}

/**
 * Apply food name corrections
 */
function applyFoodNameCorrections(text: string): string {
  let correctedText = text;
  
  // Sort by length (longest first) to avoid partial replacements
  const sortedCorrections = Object.entries(FOOD_NAME_CORRECTIONS)
    .sort(([a], [b]) => b.length - a.length);
  
  for (const [incorrect, correct] of sortedCorrections) {
    const regex = new RegExp(`\\b${incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    correctedText = correctedText.replace(regex, correct);
  }
  
  return correctedText;
}

/**
 * Apply proper capitalization to text
 */
function properCapitalization(text: string): string {
  if (!text) return text;
  
  // Split into sentences
  const sentences = text.split(/([.!?]\s*)/);
  
  return sentences.map(sentence => {
    if (!sentence.trim()) return sentence;
    
    // Capitalize first letter of sentence
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }).join('');
}

/**
 * Detect the language of the input text
 */
export function detectLanguage(text: string): 'de' | 'en' | 'unknown' {
  if (!text || text.trim().length < 3) return 'unknown';
  
  const lowerText = text.toLowerCase();
  
  // German indicators
  const germanWords = [
    'das', 'die', 'der', 'und', 'mit', 'ist', 'haben', 'sein', 'nicht', 'ich', 'du', 'er', 'sie', 'es',
    'schnitzel', 'spätzle', 'bratwurst', 'sauerkraut', 'currywurst', 'bier', 'wurst', 'käse', 'brot',
    'gemüse', 'fleisch', 'hähnchen', 'schwein', 'rind', 'fisch', 'kartoffel', 'zwiebel', 'knoblauch'
  ];
  
  // English indicators  
  const englishWords = [
    'the', 'and', 'with', 'is', 'are', 'have', 'has', 'not', 'this', 'that', 'you', 'we', 'they',
    'chicken', 'beef', 'pork', 'fish', 'vegetables', 'potato', 'onion', 'garlic', 'cheese', 'bread',
    'pancakes', 'waffle', 'eggs', 'bacon', 'toast', 'avocado', 'tomato', 'mushroom', 'spinach'
  ];
  
  let germanScore = 0;
  let englishScore = 0;
  
  // Count German words
  for (const word of germanWords) {
    if (lowerText.includes(word)) {
      germanScore += word.length;
    }
  }
  
  // Count English words
  for (const word of englishWords) {
    if (lowerText.includes(word)) {
      englishScore += word.length;
    }
  }
  
  // Check for German-specific characters
  if (/[äöüß]/.test(lowerText)) {
    germanScore += 10;
  }
  
  // Return result
  if (germanScore > englishScore && germanScore > 0) {
    return 'de';
  } else if (englishScore > germanScore && englishScore > 0) {
    return 'en';
  }
  
  return 'unknown';
}

/**
 * Clean and normalize voice input text
 */
export function cleanVoiceInput(text: string): {
  cleanedText: string;
  detectedLanguage: 'de' | 'en' | 'unknown';
} {
  const cleanedText = removeStuttersAndRepetitions(text);
  const detectedLanguage = detectLanguage(cleanedText);
  
  return {
    cleanedText,
    detectedLanguage
  };
}