
import { Camera, Heart, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const galleryImages = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
    title: "Warm Red Ambiance",
    description: "Our signature red neon lighting creates an intimate dining atmosphere",
    category: "Interior",
    featured: true
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop",
    title: "Cozy Dining Corners",
    description: "Intimate seating arrangements perfect for community gatherings",
    category: "Seating",
    featured: false
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop",
    title: "Asian Fusion Kitchen",
    description: "Open kitchen where traditional meets modern culinary techniques",
    category: "Kitchen",
    featured: true
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop",
    title: "Community Tables",
    description: "Large shared tables fostering connections over breakfast",
    category: "Community",
    featured: false
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop",
    title: "Traditional Elements",
    description: "Chinese lacquer details and warm wood textures throughout",
    category: "Details",
    featured: false
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop",
    title: "Weekend Atmosphere",
    description: "Bustling weekend energy with authentic Asian breakfast culture",
    category: "Atmosphere",
    featured: true
  }
];

export default function RestaurantGallery() {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center px-6 py-3 bg-primary/10 rounded-full text-sm font-medium text-primary border border-primary/20 mb-6">
            <Camera className="w-4 h-4 mr-2" />
            Restaurant Gallery
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Experience Our{" "}
            <span className="text-brand">Warm Atmosphere</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Step into our cozy restaurant where traditional Chinese red ambiance 
            meets Berlin's vibrant breakfast culture. Every corner tells a story 
            of community, flavor, and warmth.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {galleryImages.map((image, index) => (
            <Card 
              key={image.id}
              className={`group overflow-hidden hover-lift transition-all duration-500 ${
                image.featured ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={image.src}
                    alt={image.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Warm Red Overlay Effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>

                {/* Featured Badge */}
                {image.featured && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary/90 text-primary-foreground border-0">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="bg-background/90 backdrop-blur-sm">
                    {image.category}
                  </Badge>
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                  <h3 className="text-lg font-bold mb-2 group-hover:text-secondary transition-colors">
                    {image.title}
                  </h3>
                  <p className="text-sm opacity-90 leading-relaxed">
                    {image.description}
                  </p>
                  
                  <div className="flex items-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Heart className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-xs">Community Favorite</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Restaurant Stats */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">250+</div>
            <div className="text-muted-foreground">Happy Guests Weekly</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">3</div>
            <div className="text-muted-foreground">Years Serving Berlin</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">15+</div>
            <div className="text-muted-foreground">Signature Fusion Dishes</div>
          </div>
        </div>
      </div>
    </section>
  );
}
