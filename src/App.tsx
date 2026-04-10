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
          <Route path="agenda" element={<Agenda />} />
          <Route path="relatorios" element={<Reports />} />
          <Route path="financeiro" element={<Financial />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="blog" element={<BlogPosts />} />
          <Route path="blog/novo" element={<BlogEditor />} />
          <Route path="blog/:id" element={<BlogEditor />} />
          <Route path="importar" element={<DataImport />} />
          <Route path="configuracoes" element={<SiteSettings />} />
          <Route path="atividade" element={<AuditLog />} />
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
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
