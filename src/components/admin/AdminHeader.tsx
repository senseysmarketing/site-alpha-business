import { Bell, LogOut, Search, User, UserCircle, X } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
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
import { cn } from "@/lib/utils";

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
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const initials = user?.email?.substring(0, 2).toUpperCase() || "AB";
  const pageTitle = routeTitles[location.pathname] || "Dashboard";

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border/30 bg-white/70 backdrop-blur-[12px] sticky top-0 z-30">
      {/* Mobile Search Overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-white z-40 flex items-center px-4 transition-all duration-200 md:hidden",
          mobileSearchVisible ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
      >
        <div className="flex-1">
          <GlobalAdminSearch onSelect={() => setMobileSearchVisible(false)} />
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setMobileSearchVisible(false)}
          className="ml-2 text-muted-foreground"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

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
        {/* Mobile search trigger */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-muted-foreground hover:text-foreground"
          onClick={() => setMobileSearchVisible(true)}
        >
          <Search className="h-4 w-4" />
        </Button>

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
          <DropdownMenuContent align="end" className="w-52 font-[Inter]">
            <DropdownMenuItem className="text-xs text-muted-foreground cursor-default focus:bg-transparent">
              <User className="mr-2 h-3.5 w-3.5" />
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/admin/meu-perfil")} className="text-xs">
              <UserCircle className="mr-2 h-3.5 w-3.5" />
              Ver Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-xs text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>

        </DropdownMenu>
      </div>
    </header>
  );
}
