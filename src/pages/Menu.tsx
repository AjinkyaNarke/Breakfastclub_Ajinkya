
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Leaf, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";


interface MenuItem {
  id: string;
  name: string;
  description: string;
  regular_price: number;
  student_price: number;
  image_url: string;
  is_featured: boolean;
  is_available: boolean;
  dietary_tags: string[];
  category_id: string;
  ingredients: string;
  cuisine_type: string;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  display_order: number;
}

export default function Menu() {
  const { t } = useTranslation(['common', 'homepage']);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      const [itemsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('menu_categories')
          .select('*')
          .order('display_order', { ascending: true })
      ]);

      if (itemsResponse.error) throw itemsResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;

      setMenuItems(itemsResponse.data || []);
      setCategories(categoriesResponse.data || []);
    } catch (error) {
      console.error('Error fetching menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = activeCategory === "all" 
    ? menuItems 
    : menuItems.filter(item => item.category_id === activeCategory);

  const featuredItems = menuItems.filter(item => item.is_featured);

  if (loading) {
    return (
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-lg text-muted-foreground">Loading menu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20">
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center px-6 py-3 bg-secondary/20 rounded-full text-sm font-medium text-secondary-foreground border border-secondary/30 mb-6 restaurant-glow">
              <Star className="w-4 h-4 mr-2" />
              {t('navigation.menu')}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('sections.menu.authentic', { ns: 'homepage' })}{" "}
              <span className="text-brand">{t('sections.menu.breakfast', { ns: 'homepage' })}</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t('sections.menu.menuDescription', { ns: 'homepage' })}
            </p>
          </div>

          {/* Featured Items */}
          {featuredItems.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold mb-8 text-center">
                {t('sections.menu.featured', { ns: 'homepage' })} {t('sections.menu.dishes', { ns: 'homepage' })}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredItems.map((item) => (
                  <Card key={item.id} className="restaurant-lift warm-lighting">
                    {item.image_url && (
                      <div className="relative h-48 rounded-t-lg overflow-hidden">
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <Badge className="absolute top-4 left-4 bg-primary/90 text-primary-foreground">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-primary">€{item.regular_price}</span>
                          {item.student_price && item.student_price < item.regular_price && (
                            <div className="flex items-center space-x-1 text-sm text-secondary">
                              <GraduationCap className="w-4 h-4" />
                              <span>€{item.student_price}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {item.dietary_tags && item.dietary_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.dietary_tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Leaf className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Menu Categories */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 mb-8">
              <TabsTrigger value="all">All Items</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeCategory} className="space-y-8">
              {filteredItems.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <h3 className="text-lg font-semibold mb-2">No items available</h3>
                    <p className="text-muted-foreground">Check back soon for new menu items!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {filteredItems.map((item) => (
                    <Card key={item.id} className="restaurant-lift warm-lighting">
                      <div className="flex">
                        {item.image_url && (
                          <div className="w-32 h-32 flex-shrink-0">
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="w-full h-full object-cover rounded-l-lg"
                            />
                          </div>
                        )}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold">{item.name}</h3>
                            {item.is_featured && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                          
                          {item.ingredients && (
                            <p className="text-xs text-muted-foreground mb-3 italic">
                              {item.ingredients}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-bold text-primary">€{item.regular_price}</span>
                              {item.student_price && item.student_price < item.regular_price && (
                                <div className="flex items-center space-x-1 text-sm text-secondary">
                                  <GraduationCap className="w-4 h-4" />
                                  <span>€{item.student_price}</span>
                                </div>
                              )}
                            </div>
                            
                            {item.dietary_tags && item.dietary_tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.dietary_tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    <Leaf className="w-3 h-3 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Student Special Info */}
          <div className="mt-16 text-center">
            <Card className="bg-secondary/10 border-secondary/30">
              <CardContent className="p-8">
                <div className="flex items-center justify-center mb-4">
                  <GraduationCap className="w-8 h-8 text-secondary mr-3" />
                  <h3 className="text-xl font-bold">{t('sections.menu.studentSpecial', { ns: 'homepage' })}</h3>
                </div>
                <p className="text-muted-foreground">
                  {t('sections.menu.studentDescription', { ns: 'homepage' })}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
