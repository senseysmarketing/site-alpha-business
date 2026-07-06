import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarCheck,
  BarChart3,
  Wallet,
  FileText,
  Settings,
  Megaphone,
  Activity,
  Upload,
  UserCog,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import logoAlpha from "@/assets/logo-alpha.png";

type MenuItem = {
  title: string;
  url: string;
  icon: any;
  roles?: string[]; // if undefined, visible to all authenticated users
};

const menuItems: MenuItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Imóveis", url: "/admin/imoveis", icon: Building2 },
  { title: "Condomínios", url: "/admin/condominios", icon: Building2 },
  { title: "Pipeline CRM", url: "/admin/leads", icon: Users },
  { title: "Equipe", url: "/admin/equipe", icon: UserCog, roles: ["admin", "gerente"] },
  { title: "Agenda", url: "/admin/agenda", icon: CalendarCheck },
  { title: "Relatórios", url: "/admin/relatorios", icon: BarChart3, roles: ["admin", "gerente"] },
  { title: "Financeiro", url: "/admin/financeiro", icon: Wallet, roles: ["admin"] },
  { title: "Marketing", url: "/admin/marketing", icon: Megaphone, roles: ["admin", "gerente"] },
  { title: "Blog", url: "/admin/blog", icon: FileText, roles: ["admin", "gerente"] },
  { title: "Importar", url: "/admin/importar", icon: Upload, roles: ["admin"] },
  { title: "Atividade", url: "/admin/atividade", icon: Activity, roles: ["admin"] },
  { title: "Configurações", url: "/admin/configuracoes", icon: Settings, roles: ["admin"] },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { role } = useAuth();

  const visibleItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return role ? item.roles.includes(role) : false;
  });

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <div className="h-16 flex items-center px-4 border-b border-border/50">
        {!collapsed ? (
          <img src={logoAlpha} alt="Alpha Business" className="h-7 invert" />
        ) : (
          <span className="font-[Raleway] font-semibold text-foreground text-sm">A</span>
        )}
      </div>

      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="font-[Inter] text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 mb-1">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="hover:bg-[#2A070C]/[0.03] font-[Inter] text-sm rounded-none"
                      activeClassName="bg-[#2A070C]/5 text-[#2A070C] font-medium border-l-[3px] border-[#2A070C]"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-3">
        {!collapsed && (
          <p className="font-[Inter] text-[10px] text-muted-foreground/50 tracking-wide">
            Alpha Business © 2025
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
