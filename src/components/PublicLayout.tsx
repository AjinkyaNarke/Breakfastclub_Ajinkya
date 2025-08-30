import { Outlet } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import FloatingChat from "@/components/FloatingChat";

export const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-background restaurant-scrollbar">
      <Navigation />
      <main>
        <Outlet />
      </main>
      <Footer />
      <FloatingChat />
    </div>
  );
};
