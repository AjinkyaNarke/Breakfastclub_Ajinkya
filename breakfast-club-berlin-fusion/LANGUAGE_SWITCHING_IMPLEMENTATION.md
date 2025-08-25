# Language Switching and Translation Implementation

## Overview
This implementation addresses the issue where dish names and preparation content don't translate properly when switching languages in the navigation bar. The solution stores dish names in German by default and uses DeepSeek API for real-time translation of preparation steps.

## Key Components Implemented

### 1. Enhanced Language Switching Hook (`useLanguageSwitch.tsx`)
- Provides reactive language switching with toast notifications
- Triggers translation events when language changes
- Maintains consistency across the application

### 2. Localization Utilities (`useLocalization.tsx`)
- Centralized helper for getting localized text based on current language
- Supports preps, menu items, and generic content
- Falls back gracefully when translations are missing

### 3. Reactive Prep Translation (`useReactivePrepTranslation.tsx`)
- Automatically translates prep content when language switches
- Uses DeepSeek API for high-quality culinary translations
- Caches translations to avoid redundant API calls
- Provides loading states and translation confidence

### 4. Prep Content Display Component (`PrepContentDisplay.tsx`)
- Shows prep information with proper language switching
- Displays translation status and quality indicators
- Auto-expands/collapses long instruction text
- Real-time translation feedback

### 5. German-First Dish Names (`dishNameDefaults.ts`)
- Utility functions to ensure dish names are stored in German
- Detects German dish names automatically
- Processes dish data for consistent storage format

## Database Schema
The implementation uses existing multi-language fields:

### Menu Items
- `name` (primary, German)
- `name_de` (German version)
- `name_en` (English version)
- `description_de` / `description_en`

### Preps
- `name`, `name_de`, `name_en`
- `description_de`, `description_en`
- `instructions_de`, `instructions_en`

## Translation Flow

1. **Language Switch Trigger**: User clicks DE/EN in navigation
2. **Automatic Detection**: System checks if content exists in target language
3. **API Translation**: If missing, calls DeepSeek API for translation
4. **Real-time Update**: UI updates immediately with translated content
5. **Cache Storage**: Translations cached for performance

## API Integration
Uses the existing DeepSeek translation function at:
- `/functions/v1/deepseek-translate`
- Supports prep-specific culinary terminology
- Handles batch translations for efficiency
- Provides confidence scores for translation quality

## Components Updated

### LanguageSwitcher.tsx
- Enhanced with new hook
- Better visual feedback
- Triggers translation events

### PrepManagement.tsx
- Uses localization utilities
- Improved language detection
- Reactive to language changes

### MenuShowcase.tsx
- Already had proper language switching (no changes needed)
- Uses `getLocalizedText` helper function

## Features

✅ **Automatic Translation**: Prep content translates when switching languages  
✅ **German-First Storage**: Dish names stored in German by default  
✅ **Real-time Feedback**: Loading indicators and translation status  
✅ **Fallback Handling**: Graceful degradation when translations fail  
✅ **Performance Optimized**: Caching and efficient API usage  
✅ **Quality Indicators**: Translation confidence scores  

## Usage

The system works automatically - no manual intervention required:

1. Store dish names in German in the database
2. When users switch languages, content auto-translates
3. Translations are cached for future use
4. UI provides feedback during translation process

## Testing

To test the implementation:

1. Start the development server: `npm run dev`
2. Navigate to the prep management page
3. Switch language using the DE/EN toggle in navigation
4. Observe automatic translation of prep content
5. Check that dish names in MenuShowcase translate properly

## Configuration

Set the DeepSeek API key in environment variables:
```env
DEEPSEEK_API_KEY=your_api_key_here
```

The system is configured to:
- Use German as the source language for dish names
- Auto-translate preparation content on language switches
- Show translation progress and quality indicators
- Cache translations for performance