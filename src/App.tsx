import { lazy, Suspense } from "react";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import MetaPixelRouteTracker from "./components/MetaPixelRouteTracker";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "./components/admin/ProtectedRoute.tsx";
import AdminLayout from "./components/admin/AdminLayout.tsx";

import ThemeProvider from "./components/ThemeProvider";

const Index = lazy(() => import("./pages/Index"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Properties = lazy(() => import("./pages/admin/Properties"));
const PropertyForm = lazy(() => import("./pages/admin/PropertyForm"));
const Condominiums = lazy(() => import("./pages/admin/Condominiums"));
const CRM = lazy(() => import("./pages/admin/CRM"));
const Agenda = lazy(() => import("./pages/admin/Agenda"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const Financial = lazy(() => import("./pages/admin/Financial"));
const Marketing = lazy(() => import("./pages/admin/Marketing"));
const BlogPosts = lazy(() => import("./pages/admin/BlogPosts"));
const BlogEditor = lazy(() => import("./pages/admin/BlogEditor"));
const BlogCategories = lazy(() => import("./pages/admin/BlogCategories"));
const AuditLog = lazy(() => import("./pages/admin/AuditLog"));
const DataImport = lazy(() => import("./pages/admin/DataImport"));
const SiteSettings = lazy(() => import("./pages/admin/SiteSettings"));
const Team = lazy(() => import("./pages/admin/Team"));
const TeamProfile = lazy(() => import("./pages/admin/TeamProfile"));
const MyProfile = lazy(() => import("./pages/admin/MyProfile"));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <MetaPixelRouteTracker />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
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
            <Route path="condominios" element={<Condominiums />} />
            <Route path="leads" element={<CRM />} />
            <Route path="equipe" element={<ProtectedRoute allowedRoles={["admin", "gerente"]}><Team /></ProtectedRoute>} />
            <Route path="equipe/:id" element={<ProtectedRoute allowedRoles={["admin", "gerente"]}><TeamProfile /></ProtectedRoute>} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="relatorios" element={<ProtectedRoute allowedRoles={["admin", "gerente"]}><Reports /></ProtectedRoute>} />
            <Route path="financeiro" element={<ProtectedRoute allowedRoles={["admin"]}><Financial /></ProtectedRoute>} />
            <Route path="marketing" element={<ProtectedRoute allowedRoles={["admin", "gerente"]}><Marketing /></ProtectedRoute>} />
            <Route path="blog" element={<ProtectedRoute allowedRoles={["admin", "gerente"]}><BlogPosts /></ProtectedRoute>} />
            <Route path="blog/categorias" element={<ProtectedRoute allowedRoles={["admin"]}><BlogCategories /></ProtectedRoute>} />
            <Route path="blog/novo" element={<ProtectedRoute allowedRoles={["admin", "gerente"]}><BlogEditor /></ProtectedRoute>} />
            <Route path="blog/:id" element={<ProtectedRoute allowedRoles={["admin", "gerente"]}><BlogEditor /></ProtectedRoute>} />
            <Route path="importar" element={<ProtectedRoute allowedRoles={["admin"]}><DataImport /></ProtectedRoute>} />
            <Route path="configuracoes" element={<ProtectedRoute allowedRoles={["admin"]}><SiteSettings /></ProtectedRoute>} />
            <Route path="atividade" element={<ProtectedRoute allowedRoles={["admin"]}><AuditLog /></ProtectedRoute>} />
            <Route path="imoveis/novo" element={<ProtectedRoute allowedRoles={["admin", "gerente"]}><PropertyForm /></ProtectedRoute>} />
            <Route path="imoveis/:id" element={<PropertyForm />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
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
          <AnimatedRoutes />
          <FloatingWhatsApp />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
