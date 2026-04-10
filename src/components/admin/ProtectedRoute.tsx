import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8F8F8" }}>
        <div className="animate-pulse font-[Raleway] text-muted-foreground tracking-widest text-sm uppercase">
          Carregando...
        </div>
      </div>
    );
  }

  if (!user || !role) {
    return <Navigate to="/admin/login" replace />;
  }

  // If allowedRoles specified, check if user's role is in the list
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
