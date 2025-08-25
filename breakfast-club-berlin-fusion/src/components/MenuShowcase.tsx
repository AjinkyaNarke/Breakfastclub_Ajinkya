
import { useState, useEffect } from "react";
import { Star, Clock, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import dimSumImage from "@/assets/dim-sum-spread.jpg";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  name_de?: string;
  name_en?: string;
  description_de?: string;
  description_en?: string;
  image_url: string;
  regular_price: number;
  student_price: number;
  is_featured: boolean;
  is_available: boolean;
  dietary_tags: string[];
  category: {
    name: string;
    name_de?: string;
    name_en?: string;
  };
}

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  name_de?: string;
  name_en?: string;
  description_de?: string;
  description_en?: string;
  item_count: number;
}

export default function MenuShowcase() {
  const { t, i18n } = useTranslation('homepage');
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to get localized text
  const getLocalizedText = (text: string, textDe?: string, textEn?: string) => {
    const currentLang = i18n.language;
    if (currentLang === 'de' && textDe) return textDe;
    if (currentLang === 'en' && textEn) return textEn;
    return text || textDe || textEn || '';
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      // Fetch featured menu items
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select(`
          *,
          category:menu_categories(name, name_de, name_en)
        `)
        .eq('is_featured', true)
        .eq('is_available', true)
        .order('display_order')
        .limit(4);

      if (menuError) throw menuError;

      // Fetch categories with item counts
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select(`
          id,
          name,
          name_de,
          name_en,
          description,
          description_de,
          description_en,
          menu_items(count)
        `)
        .order('display_order');

      if (categoriesError) throw categoriesError;

      // Transform categories data to include item count
      const transformedCategories = categoriesData?.map(cat => ({
        ...cat,
        item_count: cat.menu_items?.[0]?.count || 0
      })) || [];

      setFeaturedItems(menuItems || []);
      setCategories(transformedCategories);
    } catch (error) {
      console.error('Error fetching menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      "bg-primary", 
      "bg-accent-vibrant", 
      "bg-secondary", 
      "bg-primary-glow"
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <section className="py-20 bg-muted/30 restaurant-texture">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-pulse">{t('sections.menu.loading')}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-muted/30 restaurant-texture">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center px-6 py-3 bg-primary/10 rounded-full text-sm font-medium text-primary border border-primary/20 mb-6 restaurant-glow">
            <Award className="w-4 h-4 mr-2" />
            {t('sections.menu.signatureMenu')}
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t('sections.menu.authentic')}{" "}
            <span className="text-brand">{t('sections.menu.breakfast')}</span>{" "}
            Experience
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('sections.menu.menuDescription')}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Menu Categories Sidebar */}
          <div className="lg:col-span-1 space-y-6 animate-slide-in">
            <div>
              <h3 className="text-2xl font-bold mb-6 text-primary">{t('sections.menu.categories')}</h3>
              <div className="space-y-4">
                {categories.map((category, index) => (
                  <Card 
                    key={category.id} 
                    className="restaurant-lift cursor-pointer transition-all duration-300 warm-lighting"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${getCategoryColor(index)}`}></div>
                          <span className="font-bold text-lg">
                            {getLocalizedText(category.name, category.name_de, category.name_en)}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs border-primary/20">
                          {category.item_count} dishes
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getLocalizedText(category.description, category.description_de, category.description_en) || 
                         `Authentic ${getLocalizedText(category.name, category.name_de, category.name_en).toLowerCase()} dishes`}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Student Special */}
            <Card className="bg-secondary/10 border-secondary/30 warm-lighting">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-6 w-6 text-secondary-foreground" />
                </div>
                <h4 className="font-bold text-lg mb-2 text-primary">{t('sections.menu.studentSpecial')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('sections.menu.studentDescription')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Featured Dishes */}
          <div className="lg:col-span-2 space-y-6 animate-fade-in">
            <div className="grid gap-6">
              {featuredItems.length > 0 ? (
                featuredItems.map((dish, index) => (
                  <Card 
                    key={dish.id} 
                    className="restaurant-lift transition-all duration-300 warm-lighting"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-6">
                        {/* Dish Image */}
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img 
                            src={dish.image_url || "/placeholder.svg"} 
                            alt={dish.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Dish Details */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-xl font-bold text-primary">
                              {getLocalizedText(dish.name, dish.name_de, dish.name_en)}
                            </h3>
                            <Badge className="bg-primary/20 text-primary border-primary/30">
                              Featured
                            </Badge>
                          </div>
                          
                          <p className="text-muted-foreground mb-4 leading-relaxed">
                            {getLocalizedText(dish.description, dish.description_de, dish.description_en)}
                          </p>
                          
                          {dish.dietary_tags && dish.dietary_tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {dish.dietary_tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs border-secondary/30 text-secondary-foreground">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                <span className="text-sm font-medium">4.8</span>
                                <span className="text-xs text-muted-foreground ml-1">(50+ reviews)</span>
                              </div>
                              
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="w-4 h-4 mr-1" />
                                Fresh made to order
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-xl font-bold text-primary">€{dish.regular_price}</div>
                              <div className="text-sm font-medium" style={{ color: 'hsl(42 90% 50%)' }}>
                                €{dish.student_price} student price
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No featured items available at the moment.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Restaurant Showcase Image */}
        <div className="mt-20 animate-fade-in">
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <img 
              src={dimSumImage}
              alt="Our restaurant's dim sum selection with traditional bamboo steamers"
              className="w-full h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
            
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-2xl mx-auto px-8 text-white text-center">
                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                  Traditional Techniques, Modern Atmosphere
                </h3>
                <p className="text-lg opacity-90">
                  Watch our chefs prepare your meal in our open kitchen using 
                  authentic methods passed down through generations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
