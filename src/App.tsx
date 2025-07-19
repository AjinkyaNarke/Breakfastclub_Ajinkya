
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { Dashboard } from "@/pages/admin/Dashboard";
import { MenuManagement } from "@/pages/admin/MenuManagement";
import { VideoManagement } from "@/pages/admin/VideoManagement";
import { PressManagement } from "@/pages/admin/PressManagement";
import { GalleryManagement } from "@/pages/admin/GalleryManagement";
import { EventsManagement } from "@/pages/admin/EventsManagement";
import { ContentManagement } from "@/pages/admin/ContentManagement";
import Index from "./pages/Index";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="videos" element={<VideoManagement />} />
              <Route path="press" element={<PressManagement />} />
              <Route path="gallery" element={<GalleryManagement />} />
              <Route path="events" element={<EventsManagement />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="settings" element={<div>Settings - Coming Soon</div>} />
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
