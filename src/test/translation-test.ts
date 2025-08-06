// Simple translation test to verify the system works
// This file can be used for manual testing in the browser console

export const testTranslation = async () => {
  try {
    console.log('🧪 Testing translation system...');
    
    // Test name translation
    const { translateIngredientName } = await import('@/integrations/deepseek/ingredientTranslate');
    
    const testCases = [
      { name: 'Kartoffel', from: 'de', to: 'en', expected: 'Potato' },
      { name: 'Zwiebel', from: 'de', to: 'en', expected: 'Onion' },
      { name: 'Tomato', from: 'en', to: 'de', expected: 'Tomate' },
    ];
    
    for (const testCase of testCases) {
      console.log(`Testing: ${testCase.name} (${testCase.from} → ${testCase.to})`);
      
      const result = await translateIngredientName({
        name: testCase.name,
        sourceLang: testCase.from as 'en' | 'de',
        targetLang: testCase.to as 'en' | 'de'
      });
      
      console.log(`Result: ${result.translatedName} (${Math.round(result.confidence * 100)}% confidence)`);
      
      if (result.translatedName.toLowerCase().includes(testCase.expected.toLowerCase())) {
        console.log('✅ Translation appears correct');
      } else {
        console.log('⚠️ Translation may need review');
      }
    }
    
    console.log('🎉 Translation test completed');
    
  } catch (error) {
    console.error('❌ Translation test failed:', error);
  }
};

// For browser console testing:
// import('/src/test/translation-test.ts').then(m => m.testTranslation());