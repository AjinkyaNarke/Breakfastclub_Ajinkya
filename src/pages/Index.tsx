
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import EventsPreview from "@/components/EventsPreview";
import MenuShowcase from "@/components/MenuShowcase";
import PressSection from "@/components/PressSection";
import RestaurantVideo from "@/components/RestaurantVideo";
import RestaurantGallery from "@/components/RestaurantGallery";
import { Footer } from "@/components/Footer";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Index = () => {
  return (
    <div className="min-h-screen bg-background restaurant-scrollbar">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <Navigation />
      <main>
        <HeroSection />
        <EventsPreview />
        <MenuShowcase />
        <PressSection />
        <RestaurantVideo />
        <RestaurantGallery />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
