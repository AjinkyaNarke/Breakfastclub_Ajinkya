
import { Star, Clock, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dimSumImage from "@/assets/dim-sum-spread.jpg";

const featuredDishes = [
  {
    id: 1,
    name: "Traditional Congee Set",
    description: "Silky rice porridge with century egg, pork floss, and pickled vegetables. A comforting classic.",
    price: "€12",
    studentPrice: "€9",
    category: "Traditional",
    tags: ["Signature", "Comfort Food"],
    rating: 4.9,
    popular: true,
    image: "/placeholder.svg"
  },
  {
    id: 2,
    name: "Fusion Breakfast Bao",
    description: "Fluffy steamed buns with scrambled eggs, avocado, and Korean gochujang. Instagram favorite!",
    price: "€14",
    studentPrice: "€10.50",
    category: "Fusion",
    tags: ["Chef's Special", "Instagram Hit"],
    rating: 4.8,
    popular: true,
    image: "/placeholder.svg"
  },
  {
    id: 3,
    name: "Ceremonial Matcha Pancakes",
    description: "Japanese matcha pancakes with red bean paste and premium matcha syrup. Made with ceremony-grade matcha.",
    price: "€13",
    studentPrice: "€9.75",
    category: "Sweet",
    tags: ["Premium", "Traditional"],
    rating: 4.7,
    popular: false,
    image: "/placeholder.svg"
  },
  {
    id: 4,
    name: "Korean BBQ Breakfast Bowl",
    description: "Marinated bulgogi, kimchi fried rice, soft egg, and traditional banchan selection. Hearty and authentic.",
    price: "€16",
    studentPrice: "€12",
    category: "Hearty",
    tags: ["Protein Rich", "Authentic"],
    rating: 4.9,
    popular: true,
    image: "/placeholder.svg"
  }
];

const menuCategories = [
  { name: "Traditional", count: 12, color: "bg-primary", description: "Authentic Asian classics" },
  { name: "Fusion", count: 8, color: "bg-accent-vibrant", description: "Modern interpretations" },
  { name: "Sweet", count: 6, color: "bg-secondary", description: "Desserts & treats" },
  { name: "Hearty", count: 10, color: "bg-primary-glow", description: "Filling favorites" }
];

export default function MenuShowcase() {
  return (
    <section className="py-20 bg-muted/30 restaurant-texture">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center px-6 py-3 bg-primary/10 rounded-full text-sm font-medium text-primary border border-primary/20 mb-6 restaurant-glow">
            <Award className="w-4 h-4 mr-2" />
            Our Signature Menu
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Authentic Asian{" "}
            <span className="text-brand">Breakfast</span>{" "}
            Experience
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Every dish is crafted with love using traditional techniques and the finest ingredients. 
            From family recipes passed down generations to innovative fusion creations that honor both cultures.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Menu Categories Sidebar */}
          <div className="lg:col-span-1 space-y-6 animate-slide-in">
            <div>
              <h3 className="text-2xl font-bold mb-6 text-primary">Menu Categories</h3>
              <div className="space-y-4">
                {menuCategories.map((category, index) => (
                  <Card 
                    key={category.name} 
                    className="restaurant-lift cursor-pointer transition-all duration-300 warm-lighting"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${category.color}`}></div>
                          <span className="font-bold text-lg">{category.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs border-primary/20">
                          {category.count} dishes
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
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
                <h4 className="font-bold text-lg mb-2 text-primary">Student Special</h4>
                <p className="text-sm text-muted-foreground">
                  Show your student ID and enjoy 25% off our entire menu
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Featured Dishes */}
          <div className="lg:col-span-2 space-y-6 animate-fade-in">
            <div className="grid gap-6">
              {featuredDishes.map((dish, index) => (
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
                          src={dish.image} 
                          alt={dish.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Dish Details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-bold text-primary">{dish.name}</h3>
                          {dish.popular && (
                            <Badge className="bg-primary/20 text-primary border-primary/30">
                              Popular Choice
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-muted-foreground mb-4 leading-relaxed">
                          {dish.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {dish.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs border-secondary/30 text-secondary-foreground">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-500 mr-1" />
                              <span className="text-sm font-medium">{dish.rating}</span>
                              <span className="text-xs text-muted-foreground ml-1">(250+ reviews)</span>
                            </div>
                            
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="w-4 h-4 mr-1" />
                              Fresh made to order
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary">{dish.price}</div>
                            <div className="text-sm font-medium" style={{ color: 'hsl(42 90% 50%)' }}>
                              {dish.studentPrice} student price
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
