import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ExpertProvider } from "@/contexts/ExpertContext";
import { CRMSidebar, TopBar } from "@/components/CRMLayout";
import DashboardPage from "@/pages/DashboardPage";
import FunnelsPage from "@/pages/FunnelsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const CRMLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen w-full overflow-hidden bg-background">
    <CRMSidebar />
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <TopBar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ExpertProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CRMLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/funnels" element={<FunnelsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CRMLayout>
        </BrowserRouter>
      </ExpertProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
