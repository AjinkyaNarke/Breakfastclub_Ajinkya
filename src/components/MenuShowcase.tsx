import { Star, Leaf, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dimSumImage from "@/assets/dim-sum-spread.jpg";

const featuredDishes = [
  {
    id: 1,
    name: "Traditional Congee Set",
    description: "Silky rice porridge with century egg, pork floss, and pickled vegetables",
    price: "€12",
    studentPrice: "€9",
    category: "Traditional",
    tags: ["Comfort Food", "Gluten-Free"],
    rating: 4.9,
    popular: true,
    dietary: ["vegetarian-option"]
  },
  {
    id: 2,
    name: "Fusion Breakfast Bao",
    description: "Fluffy steamed buns with scrambled eggs, avocado, and Korean gochujang",
    price: "€14",
    studentPrice: "€10.50",
    category: "Fusion",
    tags: ["Instagram Famous", "Spicy"],
    rating: 4.8,
    popular: true,
    dietary: ["vegetarian"]
  },
  {
    id: 3,
    name: "Matcha Pancake Stack",
    description: "Japanese matcha pancakes with red bean paste and ceremonial grade matcha syrup",
    price: "€13",
    studentPrice: "€9.75",
    category: "Sweet",
    tags: ["Dessert", "Ceremonial Grade"],
    rating: 4.7,
    popular: false,
    dietary: ["vegetarian"]
  },
  {
    id: 4,
    name: "Korean BBQ Breakfast Bowl",
    description: "Marinated bulgogi, kimchi fried rice, soft egg, and banchan selection",
    price: "€16",
    studentPrice: "€12",
    category: "Hearty",
    tags: ["Protein Rich", "Fermented"],
    rating: 4.9,
    popular: true,
    dietary: []
  }
];

const categories = [
  { name: "Traditional", count: 12, color: "bg-primary" },
  { name: "Fusion", count: 8, color: "bg-accent-vibrant" },
  { name: "Sweet", count: 6, color: "bg-secondary" },
  { name: "Hearty", count: 10, color: "bg-primary-glow" }
];

export default function MenuShowcase() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 bg-secondary/30 rounded-full text-sm font-medium text-secondary-foreground border border-secondary/50 mb-6">
            <Star className="w-4 h-4 mr-2" />
            Featured Menu
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Asian Fusion{" "}
            <span className="text-brand">Breakfast</span>{" "}
            Culture
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Discover authentic Asian breakfast traditions reimagined for Berlin's 
            diverse community. From traditional congee to fusion creations, 
            every dish tells a story.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Menu Categories */}
          <div className="lg:col-span-1 space-y-6 animate-slide-in">
            <div>
              <h3 className="text-2xl font-bold mb-6">Menu Categories</h3>
              <div className="space-y-4">
                {categories.map((category, index) => (
                  <Card 
                    key={category.name} 
                    className="hover-lift cursor-pointer transition-all duration-300"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                          <span className="font-semibold">{category.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {category.count} dishes
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Student Discount Highlight */}
            <Card className="bg-accent/10 border-accent/30">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-accent-vibrant/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="h-6 w-6 text-accent-vibrant" />
                </div>
                <h4 className="font-bold text-lg mb-2">Student Discount</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Show your habait student ID for 25% off all menu items
                </p>
                <Button variant="blossom" size="sm" className="w-full">
                  Get Student Access
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Featured Dishes */}
          <div className="lg:col-span-2 space-y-6 animate-fade-in">
            <div className="grid gap-6">
              {featuredDishes.map((dish, index) => (
                <Card 
                  key={dish.id} 
                  className="hover-lift transition-all duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-xl font-bold">{dish.name}</h3>
                          {dish.popular && (
                            <Badge className="bg-accent-vibrant/20 text-accent-vibrant border-accent-vibrant/30">
                              Popular
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-muted-foreground mb-3 leading-relaxed">
                          {dish.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {dish.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            <span className="text-sm font-medium">{dish.rating}</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 mr-1" />
                            Ready in 8-12 min
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right ml-6">
                        <div className="text-2xl font-bold text-primary">{dish.price}</div>
                        <div className="text-sm text-accent-vibrant font-medium">
                          {dish.studentPrice} with student ID
                        </div>
                        <Button variant="zen" size="sm" className="mt-3 group">
                          Order
                          <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Menu CTA */}
            <div className="text-center pt-6">
              <Button variant="warm" size="lg" className="group">
                View Full Menu
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>

        {/* Menu Image Section */}
        <div className="mt-16 animate-fade-in">
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <img 
              src={dimSumImage}
              alt="Traditional dim sum spread with bamboo steamers"
              className="w-full h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
            
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-2xl mx-auto px-8 text-white text-center">
                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                  Experience Authentic Asian Breakfast Culture
                </h3>
                <p className="text-lg opacity-90 mb-6">
                  From traditional dim sum to modern fusion creations, 
                  every dish is crafted with love and cultural authenticity.
                </p>
                <Button variant="blossom" size="lg">
                  Book Your Table
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}