/**
 * Utility functions to ensure dish names are stored in German by default
 * and handle translation requirements for the breakfast club application
 */

interface DishName {
  name: string;
  name_de?: string;
  name_en?: string;
}

export const ensureGermanDishName = (dishData: DishName): DishName => {
  // If name_de is missing but we have a main name, use it as German
  if (!dishData.name_de && dishData.name) {
    return {
      ...dishData,
      name_de: dishData.name,
      name: dishData.name // Keep the main name as German too
    };
  }
  
  // If we have name_de, make sure the main name matches it
  if (dishData.name_de) {
    return {
      ...dishData,
      name: dishData.name_de
    };
  }
  
  return dishData;
};

export const getDishDisplayName = (
  dishData: DishName, 
  language: 'en' | 'de' = 'de'
): string => {
  if (language === 'de') {
    return dishData.name_de || dishData.name || '';
  } else {
    return dishData.name_en || dishData.name_de || dishData.name || '';
  }
};

export const isGermanDishName = (name: string): boolean => {
  // Simple check for common German food words
  const germanFoodWords = [
    'schnitzel', 'bratwurst', 'currywurst', 'sauerbraten', 'rouladen',
    'kassler', 'spätzle', 'spaetzle', 'pfannkuchen', 'streuselkuchen',
    'apfelstrudel', 'weisswurst', 'leberwurst', 'blutwurst', 'döner',
    'currywurst', 'eisbein', 'himmel', 'erde', 'rheinischer', 'wiener',
    'königsberger', 'klopse', 'sauerbraten', 'reibekuchen', 'kartoffelpuffer'
  ];

  const lowerName = name.toLowerCase();
  return germanFoodWords.some(word => lowerName.includes(word));
};

export const shouldStoreAsGerman = (dishName: string): boolean => {
  // Check if the dish name appears to be German
  return isGermanDishName(dishName);
};

/**
 * Middleware function to ensure all dish names follow the German-first convention
 */
export const processDishNameForStorage = (dishData: Partial<DishName>): DishName => {
  const processedData = { ...dishData } as DishName;
  
  // Ensure we have a main name
  if (!processedData.name) {
    processedData.name = processedData.name_de || processedData.name_en || '';
  }
  
  // Apply German-first logic
  const result = ensureGermanDishName(processedData);
  
  return result;
};