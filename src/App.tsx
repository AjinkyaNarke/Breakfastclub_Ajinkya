
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/components/I18nProvider";

import { ThemeProvider } from "@/contexts/ThemeContext";
import DynamicFavicon from "@/components/DynamicFavicon";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import Reservations from "./pages/Reservations";
import Events from "./pages/Events";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Impressum from "./pages/Impressum";
import NotFound from "./pages/NotFound";

// Admin routes
import { PublicLayout } from "./components/PublicLayout";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminLogin } from "./components/admin/AdminLogin";
import { Dashboard } from "./pages/admin/Dashboard";
import { DashboardSimple } from "./pages/admin/DashboardSimple";
import { AdminChatDebug } from "./pages/admin/AdminChatDebug";
import { DashboardTest } from "./components/admin/DashboardTest";
import { VideoDebugTest } from "./components/admin/VideoDebugTest";
import { MenuManagement } from "./pages/admin/MenuManagement";
import { IngredientManagement } from "./pages/admin/IngredientManagement";
import { IngredientCategoryManagement } from "./pages/admin/IngredientCategoryManagement";
import { CostAnalysis } from "./pages/admin/CostAnalysis";
import { GalleryManagement } from "./pages/admin/GalleryManagement";
import { VideoManagement } from "./pages/admin/VideoManagement";
import { EventsManagement } from "./pages/admin/EventsManagement";
import { PressManagement } from "./pages/admin/PressManagement";
import ReservationManagement from "./pages/admin/ReservationManagement";
import AboutManagement from "./pages/admin/AboutManagement";
import { ContentManagement } from "./pages/admin/ContentManagement";
import { PrepManagement } from "./pages/admin/PrepManagement";
import { PrepUsageAnalyticsPage } from "./pages/admin/PrepUsageAnalytics";
// import SalesAnalytics from "./pages/admin/SalesAnalytics";
import AdminChat from "./pages/admin/AdminChat";
import AdminSettings from "./pages/admin/AdminSettings";
import { AdminSystemTest } from "./components/admin/AdminSystemTest";
import { QuickAPITest } from "./components/admin/QuickAPITest";
import { LoadingDiagnostic } from "./components/admin/LoadingDiagnostic";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <ThemeProvider>
              <DynamicFavicon />
              <Routes>
                {/* Public routes with navigation */}
                <Route path="/" element={<PublicLayout />}>
                  <Route index element={<Index />} />
                  <Route path="menu" element={<Menu />} />
                  <Route path="reservations" element={<Reservations />} />
                  <Route path="events" element={<Events />} />
                  <Route path="about" element={<About />} />
                  <Route path="privacy" element={<Privacy />} />
                  <Route path="impressum" element={<Impressum />} />
                </Route>
                
                {/* Admin login route */}
                <Route path="/admin/login" element={<AdminLogin />} />
              
              {/* Admin routes */}
              <Route path="/admin" element={<AdminLayout />}>
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
                <Route path="preps" element={<PrepManagement />} />
                <Route path="prep-analytics" element={<PrepUsageAnalyticsPage />} />
                <Route path="chat" element={<AdminChat />} />
                <Route path="chat-debug" element={<AdminChatDebug />} />
                <Route path="dashboard-test" element={<DashboardTest />} />
                <Route path="video-debug" element={<VideoDebugTest />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="test" element={<AdminSystemTest />} />
                <Route path="api-test" element={<QuickAPITest />} />
                <Route path="diagnostic" element={<LoadingDiagnostic />} />
                {/* <Route path="sales-analytics" element={<SalesAnalytics />} /> */}
              </Route>
              
                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ThemeProvider>
          </BrowserRouter>
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
