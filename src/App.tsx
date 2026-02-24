import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PatioConfigurator from "./pages/PatioConfigurator";
import QATestPanel from "./pages/QATestPanel";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AppLayout from "./components/app/AppLayout";
import ProjectsPage from "./pages/app/ProjectsPage";
import ProjectDetailPage from "./pages/app/ProjectDetailPage";
import AdminPage from "./pages/app/AdminPage";
import CatalogPage from "./pages/app/CatalogPage";
import AnalyticsPage from "./pages/app/AnalyticsPage";
import SharePage from "./pages/SharePage";
import DeckingConfigurator from "./pages/DeckingConfigurator";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/configure/patios" element={<PatioConfigurator />} />
          <Route path="/embed/patios" element={<PatioConfigurator />} />
          <Route path="/configure/decking" element={<DeckingConfigurator />} />
          <Route path="/share/:token" element={<SharePage />} />
          <Route path="/app" element={<AppLayout />}>
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>
          <Route path="/dev/qa" element={<QATestPanel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
