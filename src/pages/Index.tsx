
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import EventsPreview from "@/components/EventsPreview";
import MenuShowcase from "@/components/MenuShowcase";
import RestaurantGallery from "@/components/RestaurantGallery";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background restaurant-scrollbar">
      <Navigation />
      <main>
        <HeroSection />
        <EventsPreview />
        <MenuShowcase />
        <RestaurantGallery />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
