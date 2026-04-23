import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import PropertyDetail from "./pages/PropertyDetail.tsx";
import Blog from "./pages/Blog.tsx";
import BlogPost from "./pages/BlogPost.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import ProtectedRoute from "./components/admin/ProtectedRoute.tsx";
import AdminLayout from "./components/admin/AdminLayout.tsx";
import Dashboard from "./pages/admin/Dashboard.tsx";
import Properties from "./pages/admin/Properties.tsx";
import PropertyForm from "./pages/admin/PropertyForm.tsx";
import CRM from "./pages/admin/CRM.tsx";
import Agenda from "./pages/admin/Agenda.tsx";
import Reports from "./pages/admin/Reports.tsx";
import Financial from "./pages/admin/Financial.tsx";
import Marketing from "./pages/admin/Marketing";
import BlogPosts from "./pages/admin/BlogPosts";
import BlogEditor from "./pages/admin/BlogEditor";
import AuditLog from "./pages/admin/AuditLog";
import DataImport from "./pages/admin/DataImport";
import SiteSettings from "./pages/admin/SiteSettings";
import SearchResults from "./pages/SearchResults";
import SiteGate from "./components/SiteGate";
import Team from "./pages/admin/Team";
import TeamProfile from "./pages/admin/TeamProfile";
import ThemeProvider from "./components/ThemeProvider";

const queryClient = new QueryClient();
const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/imovel/:id" element={<PropertyDetail />} />
        <Route path="/busca" element={<SearchResults />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="imoveis" element={<Properties />} />
          <Route path="leads" element={<CRM />} />
          <Route path="equipe" element={<Team />} />
          <Route path="equipe/:id" element={<TeamProfile />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="relatorios" element={<ProtectedRoute allowedRoles={["admin", "gerente"]}><Reports /></ProtectedRoute>} />
          <Route path="financeiro" element={<ProtectedRoute allowedRoles={["admin"]}><Financial /></ProtectedRoute>} />
          <Route path="marketing" element={<ProtectedRoute allowedRoles={["admin", "gerente"]}><Marketing /></ProtectedRoute>} />
          <Route path="blog" element={<ProtectedRoute allowedRoles={["admin", "gerente"]}><BlogPosts /></ProtectedRoute>} />
          <Route path="blog/novo" element={<ProtectedRoute allowedRoles={["admin", "gerente"]}><BlogEditor /></ProtectedRoute>} />
          <Route path="blog/:id" element={<ProtectedRoute allowedRoles={["admin", "gerente"]}><BlogEditor /></ProtectedRoute>} />
          <Route path="importar" element={<ProtectedRoute allowedRoles={["admin"]}><DataImport /></ProtectedRoute>} />
          <Route path="configuracoes" element={<ProtectedRoute allowedRoles={["admin"]}><SiteSettings /></ProtectedRoute>} />
          <Route path="atividade" element={<ProtectedRoute allowedRoles={["admin"]}><AuditLog /></ProtectedRoute>} />
          <Route path="imoveis/novo" element={<PropertyForm />} />
          <Route path="imoveis/:id" element={<PropertyForm />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SiteGate>
            <AnimatedRoutes />
          </SiteGate>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
