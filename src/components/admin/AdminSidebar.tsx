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
import logoAlpha from "@/assets/logo-alpha.png";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Imóveis", url: "/admin/imoveis", icon: Building2 },
  { title: "Pipeline CRM", url: "/admin/leads", icon: Users },
  { title: "Agenda", url: "/admin/agenda", icon: CalendarCheck },
  { title: "Relatórios", url: "/admin/relatorios", icon: BarChart3 },
  { title: "Financeiro", url: "/admin/financeiro", icon: Wallet },
  { title: "Marketing", url: "/admin/marketing", icon: Megaphone },
  { title: "Blog", url: "/admin/blog", icon: FileText },
  { title: "Importar", url: "/admin/importar", icon: Upload },
  { title: "Atividade", url: "/admin/atividade", icon: Activity },
  { title: "Configurações", url: "/admin/configuracoes", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

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
              {menuItems.map((item) => (
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
