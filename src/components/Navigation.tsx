import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Coffee, Calendar, BookOpen, Info, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { name: "home", href: "/", icon: Coffee },
  { name: "events", href: "/events", icon: Calendar, sectionId: "events-section" },
  { name: "menu", href: "/menu", icon: BookOpen, sectionId: "menu-section" },
  { name: "about", href: "/about", icon: Info },
  { name: "chat", href: "/chat", icon: MessageCircle },
  { name: "reservations", href: "/reservations", icon: Calendar },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation('common');
  const [siteBranding, setSiteBranding] = useState<{
    site_name: string;
    tagline: string;
    logo_url: string | null;
  } | null>(null);

  // Load site branding data
  useEffect(() => {
    const loadSiteBranding = async () => {
      try {
        const { data, error } = await supabase
          .from('site_branding')
          .select('site_name, tagline, logo_url')
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading site branding:', error);
          return;
        }

        if (data) {
          setSiteBranding(data);
        }
      } catch (error) {
        console.error('Error loading site branding:', error);
      }
    };

    loadSiteBranding();
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const handleNavClick = (item: typeof navItems[0], e: React.MouseEvent) => {
    // If we're on homepage and the item has a section ID, scroll to section
    if (location.pathname === "/" && item.sectionId) {
      e.preventDefault();
      const section = document.getElementById(item.sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
    // Otherwise, let the Link handle navigation normally
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 group"
          >
            <div className="relative">
              {siteBranding?.logo_url ? (
                <img 
                  src={siteBranding.logo_url} 
                  alt={siteBranding.site_name}
                  className="h-8 w-8 object-contain group-hover:opacity-80 transition-opacity duration-300"
                />
              ) : (
                <Coffee className="h-8 w-8 text-primary group-hover:text-primary-glow transition-colors duration-300" />
              )}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-vibrant rounded-full animate-cherry-float"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-brand">
                {siteBranding?.site_name || 'fckingbreakfastclub'}
              </span>
              <span className="text-xs text-muted-foreground">
                {siteBranding?.tagline || 'Asian Fusion • Berlin'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={(e) => handleNavClick(item, e)}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-accent/50",
                    isActive(item.href)
                      ? "text-primary bg-accent/30 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{t(`navigation.${item.name}`)}</span>
                </Link>
              );
            })}
            <LanguageSwitcher />
          </div>

          {/* Mobile menu button and language switcher */}
          <div className="md:hidden flex items-center space-x-2">
            <LanguageSwitcher />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors duration-200"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-background border-t border-border animate-fade-in">
          <div className="px-4 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={(e) => handleNavClick(item, e)}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-all duration-300",
                    isActive(item.href)
                      ? "text-primary bg-accent/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{t(`navigation.${item.name}`)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
