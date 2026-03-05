import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { CRMSidebar, TopBar } from "@/components/CRMLayout";
import DashboardPage from "@/pages/DashboardPage";
import FunnelsPage from "@/pages/FunnelsPage";
import LeadsPage from "@/pages/LeadsPage";
import ConversationsPage from "@/pages/ConversationsPage";
import SDRsPage from "@/pages/SDRsPage";
import ClosersPage from "@/pages/ClosersPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import UsersPage from "@/pages/UsersPage";
import SettingsPage from "@/pages/SettingsPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ProjectProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <CRMSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </ProjectProvider>
  );
}

function AuthRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <LoginPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthRoute />} />
            <Route
              path="/*"
              element={
                <ProtectedLayout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/funnels" element={<FunnelsPage />} />
                    <Route path="/leads" element={<LeadsPage />} />
                    <Route path="/conversations" element={<ConversationsPage />} />
                    <Route path="/sdrs" element={<SDRsPage />} />
                    <Route path="/closers" element={<ClosersPage />} />
                    <Route path="/integrations" element={<IntegrationsPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ProtectedLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
