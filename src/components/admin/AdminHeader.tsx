import { Bell, LogOut, User, UserCircle } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlobalAdminSearch } from "@/components/admin/GlobalAdminSearch";

const routeTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/imoveis": "Imóveis",
  "/admin/leads": "Leads",
  "/admin/blog": "Blog",
  "/admin/configuracoes": "Configurações",
};

export function AdminHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const initials = user?.email?.substring(0, 2).toUpperCase() || "AB";
  const pageTitle = routeTitles[location.pathname] || "Dashboard";

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border/30 bg-white/70 backdrop-blur-[12px] sticky top-0 z-30">
      {/* Left: Sidebar toggle + Page title */}
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      </div>

      {/* Center: Global search */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <GlobalAdminSearch />
      </div>

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-[#2A070C] text-white text-xs font-[Inter]">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 font-[Inter]">
            <DropdownMenuItem className="text-xs text-muted-foreground cursor-default">
              <User className="mr-2 h-3.5 w-3.5" />
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-xs text-destructive">
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
