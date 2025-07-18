import { Coffee, Instagram, Clock, MapPin, Phone, Mail, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  community: [
    { name: "Student Program", href: "/community" },
    { name: "Events Calendar", href: "/events" },
    { name: "Cultural Exchange", href: "/community/exchange" },
    { name: "Ambassador Program", href: "/community/ambassadors" }
  ],
  menu: [
    { name: "Traditional Dishes", href: "/menu/traditional" },
    { name: "Fusion Creations", href: "/menu/fusion" },
    { name: "Weekend Specials", href: "/menu/specials" },
    { name: "Dietary Options", href: "/menu/dietary" }
  ],
  about: [
    { name: "Our Story", href: "/about" },
    { name: "Cultural Mission", href: "/about#mission" },
    { name: "Garden Space", href: "/about#garden" },
    { name: "Press Kit", href: "/about#press" }
  ]
};

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Coffee className="h-8 w-8 text-primary" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-vibrant rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-brand">fckingbreakfastclub</h3>
                  <p className="text-sm text-muted-foreground">Asian Fusion • Berlin</p>
                </div>
              </div>
              
              <p className="text-muted-foreground leading-relaxed">
                Where traditional Asian breakfast culture meets Berlin's vibrant community spirit. 
                Join us for authentic flavors and meaningful connections.
              </p>
              
              <div className="flex space-x-3">
                <Button variant="zen" size="sm" className="group">
                  <Instagram className="h-4 w-4" />
                </Button>
                <Button variant="zen" size="sm">
                  <Mail className="h-4 w-4" />
                </Button>
                <Button variant="zen" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Links Sections */}
            <div className="lg:col-span-2 grid md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold mb-4 text-foreground">Community</h4>
                <ul className="space-y-3">
                  {footerLinks.community.map((link) => (
                    <li key={link.name}>
                      <a 
                        href={link.href}
                        className="text-muted-foreground hover:text-primary transition-colors duration-200"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4 text-foreground">Menu</h4>
                <ul className="space-y-3">
                  {footerLinks.menu.map((link) => (
                    <li key={link.name}>
                      <a 
                        href={link.href}
                        className="text-muted-foreground hover:text-primary transition-colors duration-200"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4 text-foreground">About</h4>
                <ul className="space-y-3">
                  {footerLinks.about.map((link) => (
                    <li key={link.name}>
                      <a 
                        href={link.href}
                        className="text-muted-foreground hover:text-primary transition-colors duration-200"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-1">
              <h4 className="font-semibold mb-4 text-foreground">Visit Us</h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Weekend Hours</p>
                    <p className="text-sm text-muted-foreground">Friday - Sunday</p>
                    <p className="text-sm text-muted-foreground">9:00 AM - 3:00 PM</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">Kreuzberg District</p>
                    <p className="text-sm text-muted-foreground">Berlin, Germany</p>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button variant="bamboo" size="sm" className="w-full">
                    Get Directions
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Bottom Footer */}
        <div className="py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>© 2024 fckingbreakfastclub.</span>
              <span>Made with</span>
              <Heart className="h-4 w-4 text-accent-vibrant fill-current" />
              <span>in Berlin</span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </a>
              <a href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}