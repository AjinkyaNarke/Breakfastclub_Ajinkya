// Simple test function for DeepSeek API
import { translateText } from './translate';

export async function testDeepSeekAPI() {
  try {
    console.log('Testing DeepSeek translation API...');
    
    // Test German to English
    const germanText = "Guten Morgen, das ist ein leckeres Frühstück!";
    const englishTranslation = await translateText({
      text: germanText,
      sourceLang: 'de',
      targetLang: 'en'
    });
    
    console.log('Original (German):', germanText);
    console.log('Translated (English):', englishTranslation);
    
    // Test English to German
    const englishText = "This is delicious Spaghetti Carbonara with eggs, bacon, and parmesan cheese.";
    const germanTranslation = await translateText({
      text: englishText,
      sourceLang: 'en',
      targetLang: 'de'
    });
    
    console.log('Original (English):', englishText);
    console.log('Translated (German):', germanTranslation);
    
    return {
      success: true,
      results: {
        germanToEnglish: { original: germanText, translated: englishTranslation },
        englishToGerman: { original: englishText, translated: germanTranslation }
      }
    };
  } catch (error) {
    console.error('DeepSeek API test failed:', error);
    return { success: false, error: error.message };
  }
}

// Test function for voice integration (can be called from browser console)
export function testVoiceRecognition() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.error('Speech recognition not supported in this browser');
    return false;
  }
  
  console.log('Speech recognition is supported!');
  console.log('Available languages: German (de-DE), English (en-US)');
  return true;
}