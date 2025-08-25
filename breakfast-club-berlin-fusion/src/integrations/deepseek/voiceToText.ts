// Usage: const text = await voiceToText({ audio, language: 'de' });
import axios from 'axios';

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// This function uses Web Speech API for transcription and DeepSeek for processing
export async function voiceToText({ audio, language }: { audio: Blob | string; language: string; }): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      reject(new Error('Speech recognition not supported in this browser'));
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = language === 'de' ? 'de-DE' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      
      if (DEEPSEEK_API_KEY) {
        try {
          // Use DeepSeek to clean up and structure the transcript
          const response = await axios.post(
            DEEPSEEK_API_URL,
            {
              model: 'deepseek-chat',
              messages: [
                {
                  role: 'system',
                  content: 'You are a text processor for restaurant menu dictation. Clean up the transcribed text, fix grammar, and format it properly. Return only the cleaned text without additional commentary.'
                },
                {
                  role: 'user',
                  content: transcript
                }
              ],
              max_tokens: 500,
              temperature: 0.1
            },
            {
              headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
            resolve(response.data.choices[0].message.content.trim());
          } else {
            resolve(transcript);
          }
        } catch (error) {
          console.warn('DeepSeek processing failed, using raw transcript:', error);
          resolve(transcript);
        }
      } else {
        resolve(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      reject(new Error(`Speech recognition error: ${event.error}`));
    };

    recognition.onend = () => {
      // Recognition ended
    };

    // For Blob audio input, we need to handle it differently
    if (audio instanceof Blob) {
      // Convert blob to audio and play it through the recognition
      const audioUrl = URL.createObjectURL(audio);
      const audioElement = new Audio(audioUrl);
      
      audioElement.oncanplay = () => {
        recognition.start();
        audioElement.play();
      };
      
      audioElement.onerror = () => {
        reject(new Error('Audio playback failed'));
      };
    } else {
      // Direct recognition start (for live microphone input)
      recognition.start();
    }
  });
}

// Add proper type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
} 