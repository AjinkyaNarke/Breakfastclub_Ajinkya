
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import EventsPreview from "@/components/EventsPreview";
import MenuShowcase from "@/components/MenuShowcase";
import PressSection from "@/components/PressSection";
import RestaurantVideo from "@/components/RestaurantVideo";
import RestaurantGallery from "@/components/RestaurantGallery";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <>
      <HeroSection />
      <div id="events-section">
        <EventsPreview />
      </div>
      <div id="menu-section">
        <MenuShowcase />
      </div>
      <PressSection />
      <RestaurantVideo />
      <RestaurantGallery />
    </>
  );
};

export default Index;
