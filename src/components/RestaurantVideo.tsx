
import { Play, Pause } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function RestaurantVideo() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="py-20 bg-background restaurant-texture">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Experience Our{" "}
            <span className="text-brand">Atmosphere</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Step inside our warm, welcoming space where traditional meets modern in perfect harmony
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto animate-fade-in">
          <Card className="overflow-hidden shadow-2xl warm-lighting">
            <div className="relative aspect-video bg-muted">
              {/* Video placeholder - replace with actual video URL */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/30 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
                    <Play className="w-8 h-8 text-primary ml-1" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">Restaurant Tour</h3>
                    <p className="text-muted-foreground">See our cozy atmosphere and cooking process</p>
                  </div>
                </div>
              </div>
              
              {/* Video overlay controls */}
              <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-white/90 hover:bg-white text-foreground"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Play Tour
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Video description */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Take a virtual tour of our restaurant and see why our guests love the warm, inviting atmosphere we've created
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
