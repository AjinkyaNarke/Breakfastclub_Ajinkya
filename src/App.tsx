
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/components/I18nProvider";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import Reservations from "./pages/Reservations";
import Events from "./pages/Events";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Impressum from "./pages/Impressum";
import NotFound from "./pages/NotFound";

// Admin routes
import { AdminLayout } from "./components/admin/AdminLayout";
import { Dashboard } from "./pages/admin/Dashboard";
import { MenuManagement } from "./pages/admin/MenuManagement";
import { IngredientManagement } from "./pages/admin/IngredientManagement";
import { IngredientCategoryManagement } from "./pages/admin/IngredientCategoryManagement";
import { CostAnalysis } from "./pages/admin/CostAnalysis";
import { GalleryManagement } from "./pages/admin/GalleryManagement";
import { VideoManagement } from "./pages/admin/VideoManagement";
import { EventsManagement } from "./pages/admin/EventsManagement";
import { PressManagement } from "./pages/admin/PressManagement";
import { ReservationManagement } from "./pages/admin/ReservationManagement";
import { AboutManagement } from "./pages/admin/AboutManagement";
import { ContentManagement } from "./pages/admin/ContentManagement";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/reservations" element={<Reservations />} />
              <Route path="/events" element={<Events />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/impressum" element={<Impressum />} />
              
              {/* Admin routes */}
              <Route path="/admin/*" element={
                <AdminLayout>
                  <Routes>
                    <Route index element={<Dashboard />} />
                    <Route path="menu" element={<MenuManagement />} />
                    <Route path="ingredients" element={<IngredientManagement />} />
                    <Route path="ingredient-categories" element={<IngredientCategoryManagement />} />
                    <Route path="cost-analysis" element={<CostAnalysis />} />
                    <Route path="gallery" element={<GalleryManagement />} />
                    <Route path="videos" element={<VideoManagement />} />
                    <Route path="events" element={<EventsManagement />} />
                    <Route path="press" element={<PressManagement />} />
                    <Route path="reservations" element={<ReservationManagement />} />
                    <Route path="about" element={<AboutManagement />} />
                    <Route path="content" element={<ContentManagement />} />
                  </Routes>
                </AdminLayout>
              } />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
