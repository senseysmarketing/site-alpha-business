import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import TeamMemberCard from "@/components/admin/team/TeamMemberCard";
import InviteMemberDialog from "@/components/admin/team/InviteMemberDialog";
import RolePermissionsGrid from "@/components/admin/team/RolePermissionsGrid";
import { useAuth } from "@/hooks/useAuth";

interface TeamProfile {
  id: string;
  user_id: string;
  full_name: string;
  role_display: string | null;
  avatar_url: string | null;
  phone: string | null;
  creci: string | null;
  availability: string;
  is_active: boolean;
}

interface UserRole {
  user_id: string;
  role: string;
}

const Team = () => {
  const { isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<TeamProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("team_profiles").select("*").order("full_name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      setProfiles((p as TeamProfile[]) || []);
      setRoles((r as UserRole[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const getRoleForUser = (userId: string) => {
    const r = roles.find((x) => x.user_id === userId);
    return r?.role || "user";
  };

  const filtered = profiles.filter((p) => {
    const matchesSearch = p.full_name.toLowerCase().includes(search.toLowerCase());
    const role = getRoleForUser(p.user_id);
    const matchesRole = roleFilter === "todos" || role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[Raleway] text-2xl font-semibold tracking-tight text-foreground">
          Equipe
        </h1>
        {isAdmin && <InviteMemberDialog />}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-sm font-[Inter] text-sm"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40 rounded-sm font-[Inter] text-sm">
            <SelectValue placeholder="Cargo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="gerente">Gerente</SelectItem>
            <SelectItem value="corretor">Corretor</SelectItem>
            <SelectItem value="assistente">Assistente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted/50 rounded-sm animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground font-[Raleway] text-sm">
          Nenhum membro encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <TeamMemberCard
              key={p.id}
              id={p.id}
              userId={p.user_id}
              fullName={p.full_name}
              roleDisplay={p.role_display || "Membro"}
              role={getRoleForUser(p.user_id)}
              avatarUrl={p.avatar_url}
              creci={p.creci}
              phone={p.phone}
              availability={p.availability}
              isActive={p.is_active}
            />
          ))}
        </div>
      )}

      <RolePermissionsGrid />
    </div>
  );
};

export default Team;
