import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Instagram, Linkedin, Upload, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { formatBRPhone } from "@/lib/phone";

type AppRole = "admin" | "gerente" | "corretor" | "assistente";

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  corretor: "Corretor",
  assistente: "Assistente",
};

interface ProfileData {
  id: string;
  user_id: string;
  full_name: string;
  role_display: string | null;
  avatar_url: string | null;
  phone: string | null;
  creci: string | null;
  bio: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  availability: string;
  is_active: boolean;
}

const TeamProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [role, setRole] = useState<AppRole>("corretor");
  const [initialRole, setInitialRole] = useState<AppRole>("corretor");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data } = await supabase
        .from("team_profiles")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setProfile(data as ProfileData);
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", (data as ProfileData).user_id)
          .limit(1)
          .maybeSingle();
        const r = (roleRow?.role as AppRole) || "corretor";
        setRole(r);
        setInitialRole(r);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const canEditRole = isAdmin;

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("team_profiles")
        .update({
          full_name: profile.full_name,
          role_display: ROLE_LABELS[role],
          phone: profile.phone,
          creci: profile.creci,
          bio: profile.bio,
          social_instagram: profile.social_instagram,
          social_linkedin: profile.social_linkedin,
          availability: profile.availability,
          is_active: profile.is_active,
        })
        .eq("id", profile.id);

      if (error) throw error;

      // Alteração de cargo (apenas admin via RPC)
      if (role !== initialRole) {
        if (!canEditRole) {
          throw new Error("Apenas administradores podem alterar cargos.");
        }
        const { error: roleErr } = await supabase.rpc("set_user_role", {
          _target: profile.user_id,
          _role: role,
        });
        if (roleErr) throw roleErr;

        await supabase.from("system_audit_logs").insert({
          user_id: user?.id || null,
          user_name: user?.email || "Admin",
          action: "alterar_cargo",
          object_type: "team_profile",
          object_id: profile.id,
          object_label: profile.full_name,
          metadata: { from: initialRole, to: role } as any,
        });
        setInitialRole(role);
      }

      setProfile({ ...profile, role_display: ROLE_LABELS[role] });

      // Audit log
      await supabase.from("system_audit_logs").insert({
        user_id: user?.id || null,
        user_name: user?.email || "Admin",
        action: "atualizar",
        object_type: "team_profile",
        object_id: profile.id,
        object_label: profile.full_name,
      });

      toast.success("Perfil atualizado com sucesso.");
      navigate("/admin/equipe");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `team-avatars/${profile.user_id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-media")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("blog-media")
        .getPublicUrl(path);

      const newUrl = urlData.publicUrl;

      const { error: updErr } = await supabase
        .from("team_profiles")
        .update({ avatar_url: newUrl })
        .eq("id", profile.id);
      if (updErr) throw updErr;

      setProfile({ ...profile, avatar_url: newUrl });
      toast.success("Foto atualizada.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar foto.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse font-[Raleway] text-muted-foreground text-sm">
          Carregando perfil...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground font-[Raleway]">Perfil não encontrado.</p>
        <Button variant="ghost" onClick={() => navigate("/admin/equipe")} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const update = (field: keyof ProfileData, value: any) =>
    setProfile({ ...profile, [field]: value });

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/equipe")}
          className="rounded-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-[Raleway] text-2xl font-semibold tracking-tight text-foreground">
          Perfil do Membro
        </h1>
      </div>

      {/* Avatar + Name header */}
      <div className="bg-white rounded-sm border border-border/50 p-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <motion.div layoutId={`team-avatar-${id}`}>
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-lg font-[Raleway] font-semibold bg-muted">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Upload className="h-5 w-5 text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
            </label>
          </div>
          <div>
            <h2 className="font-[Raleway] text-xl font-semibold">{profile.full_name}</h2>
            <p className="text-muted-foreground text-sm font-[Inter]">
              {ROLE_LABELS[role] || profile.role_display || "Membro da equipe"}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className={`text-[10px] ${profile.is_active ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-red-200 text-red-700 bg-red-50"}`}
              >
                {profile.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Dados Profissionais */}
      <div className="bg-white rounded-sm border border-border/50 p-6 space-y-5">
        <h3 className="font-[Raleway] font-semibold text-sm text-foreground tracking-wide uppercase">
          Dados Profissionais
        </h3>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-[Inter] text-xs">Nome Completo</Label>
            <Input
              value={profile.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              className="rounded-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-[Inter] text-xs flex items-center gap-1.5">
              Cargo
              {!canEditRole && <Lock className="h-3 w-3 text-muted-foreground" />}
            </Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as AppRole)}
              disabled={!canEditRole}
            >
              <SelectTrigger className="rounded-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!canEditRole && (
              <p className="text-[10px] text-muted-foreground font-[Inter]">
                Apenas administradores podem alterar o cargo.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="font-[Inter] text-xs">CRECI</Label>
            <Input
              value={profile.creci || ""}
              onChange={(e) => update("creci", e.target.value)}
              placeholder="000000"
              className="rounded-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-[Inter] text-xs">Telefone</Label>
            <Input
              value={formatBRPhone(profile.phone)}
              onChange={(e) => update("phone", formatBRPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              inputMode="tel"
              maxLength={15}
              className="rounded-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="font-[Inter] text-xs">Bio Editorial</Label>
          <Textarea
            value={profile.bio || ""}
            onChange={(e) => update("bio", e.target.value)}
            placeholder="Uma breve descrição profissional..."
            className="rounded-sm min-h-[100px] font-[Inter] text-sm"
          />
        </div>
      </div>

      {/* Section: Redes Sociais */}
      <div className="bg-white rounded-sm border border-border/50 p-6 space-y-5">
        <h3 className="font-[Raleway] font-semibold text-sm text-foreground tracking-wide uppercase">
          Redes Sociais
        </h3>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-[Inter] text-xs flex items-center gap-1.5">
              <Instagram className="h-3.5 w-3.5" /> Instagram
            </Label>
            <Input
              value={profile.social_instagram || ""}
              onChange={(e) => update("social_instagram", e.target.value)}
              placeholder="@usuario"
              className="rounded-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-[Inter] text-xs flex items-center gap-1.5">
              <Linkedin className="h-3.5 w-3.5" /> LinkedIn
            </Label>
            <Input
              value={profile.social_linkedin || ""}
              onChange={(e) => update("social_linkedin", e.target.value)}
              placeholder="linkedin.com/in/usuario"
              className="rounded-sm"
            />
          </div>
        </div>
      </div>

      {/* Section: Status */}
      <div className="bg-white rounded-sm border border-border/50 p-6 space-y-5">
        <h3 className="font-[Raleway] font-semibold text-sm text-foreground tracking-wide uppercase">
          Status & Disponibilidade
        </h3>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-[Inter] text-xs">Disponibilidade</Label>
            <Select
              value={profile.availability}
              onValueChange={(v) => update("availability", v)}
            >
              <SelectTrigger className="rounded-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="em_visita">Em Visita</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-sm border border-border/50 px-4 py-3">
            <Label className="font-[Inter] text-xs">Membro Ativo</Label>
            <Switch
              checked={profile.is_active}
              onCheckedChange={(v) => update("is_active", v)}
            />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end pb-8">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 rounded-sm font-[Inter] text-xs"
        >
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
};

export default TeamProfile;
