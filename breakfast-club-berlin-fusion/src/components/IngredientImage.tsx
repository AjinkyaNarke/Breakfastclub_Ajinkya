import { useState } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { IngredientForGeneration } from '@/services/ImageGenerationService';

interface IngredientImageProps {
  ingredient: {
    id: string;
    name: string;
    name_de?: string;
    name_en?: string;
    category_id: string;
    image_url?: string;
    category?: {
      name: string;
    };
  };
  size?: 'sm' | 'md' | 'lg';
  showGenerateButton?: boolean;
  onImageGenerated?: () => void;
}

export const IngredientImage = ({ 
  ingredient, 
  size = 'md', 
  showGenerateButton = false,
  onImageGenerated 
}: IngredientImageProps) => {
  const { generateImage, isGenerating } = useImageGeneration();
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const handleGenerateImage = async () => {
    try {
      console.log('🖼️ Starting image generation for:', ingredient.name);
      const result = await generateImage(ingredient as IngredientForGeneration);
      if (result.success) {
        console.log('🖼️ Image generation successful, calling onImageGenerated callback');
        onImageGenerated?.();
        setImageError(false);
      }
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Show image if available and not errored
  if (ingredient.image_url && !imageError) {
    return (
      <div className={`${sizeClasses[size]} relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0`}>
        <img
          src={ingredient.image_url}
          alt={ingredient.name}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      </div>
    );
  }

  // Show placeholder with optional generate button
  return (
    <div className={`${sizeClasses[size]} relative rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0`}>
      {showGenerateButton && !isGenerating ? (
        <Button
          size="sm"
          variant="ghost"
          className="h-full w-full p-1"
          onClick={handleGenerateImage}
          disabled={isGenerating}
        >
          <ImageIcon className="h-4 w-4 text-gray-400" />
        </Button>
      ) : isGenerating ? (
        <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
      ) : (
        <ImageIcon className="h-4 w-4 text-gray-400" />
      )}
    </div>
  );
};