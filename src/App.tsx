import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { cleanupLegacyMockData } from "@/lib/mockData";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Feed from "./pages/Feed";
import Leaderboard from "./pages/Leaderboard";
import WOD from "./pages/WOD";
import Profile from "./pages/Profile";
import Boxes from "./pages/Boxes";
import Benchmarks from "./pages/Benchmarks";
import Battle from "./pages/Battle";
import CoachDashboard from "./pages/CoachDashboard";
import MyBox from "./pages/MyBox";
import Challenges from "./pages/Challenges";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Install from "./pages/Install";
import Clans from "./pages/Clans";
import TvMode from "./pages/TvMode";
import Invite from "./pages/Invite";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" />;

  const isAdmin = user.role === 'admin';
  const pendingAllowedPaths = new Set(['/', '/profile']);
  const isPendingBlockedPath = !isAdmin && user.approvalStatus === 'pending' && !pendingAllowedPaths.has(location.pathname);

  if (!isAdmin && user.approvalStatus === 'rejected') {
    return (
      <Layout>
        <div className="max-w-xl mx-auto text-center py-16 space-y-2">
          <h2 className="text-2xl font-bold">Acesso não liberado</h2>
          <p className="text-muted-foreground">Seu cadastro foi rejeitado. Fale com um administrador para mais detalhes.</p>
        </div>
      </Layout>
    );
  }

  if (isPendingBlockedPath) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto text-center py-16 space-y-2">
          <h2 className="text-2xl font-bold">Aguardando aprovação</h2>
          <p className="text-muted-foreground">Seu cadastro ainda está em análise por um administrador.</p>
        </div>
      </Layout>
    );
  }

  return <Layout>{children}</Layout>;
};

const App = () => {
  useEffect(() => {
    cleanupLegacyMockData();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/tv" element={<TvMode />} />
              <Route path="/install" element={<Install />} />
              <Route path="/invite/:token" element={<Invite />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
              <Route path="/wod" element={<ProtectedRoute><WOD /></ProtectedRoute>} />
              <Route path="/boxes" element={<ProtectedRoute><Boxes /></ProtectedRoute>} />
              <Route path="/benchmarks" element={<ProtectedRoute><Benchmarks /></ProtectedRoute>} />
              <Route path="/battle" element={<ProtectedRoute><Battle /></ProtectedRoute>} />
              <Route path="/mybox" element={<ProtectedRoute><MyBox /></ProtectedRoute>} />
              <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
              <Route path="/clans" element={<ProtectedRoute><Clans /></ProtectedRoute>} />
              <Route path="/coach" element={<ProtectedRoute><CoachDashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
