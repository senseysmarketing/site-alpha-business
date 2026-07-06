import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Instagram, Linkedin, Upload, Lock, KeyRound, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { formatBRPhone } from "@/lib/phone";

import { derivePresence } from "@/lib/presence";

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
  last_seen_at: string | null;
  is_active: boolean;
}

const MyProfile = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("team_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setProfile(data as ProfileData);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const handleCreateProfile = async () => {
    if (!user?.id) return;
    setCreating(true);
    try {
      const displayName = user.email?.split("@")[0] || "Novo membro";
      const { data, error } = await supabase
        .from("team_profiles")
        .insert({
          user_id: user.id,
          full_name: displayName,
          role_display: role ? ROLE_LABELS[role as AppRole] ?? null : null,
          last_seen_at: new Date().toISOString(),
          is_active: true,
        })
        .select("*")
        .single();
      if (error) throw error;
      setProfile(data as ProfileData);
      setNotFound(false);
      toast.success("Perfil criado.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar perfil.");
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("team_profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          creci: profile.creci,
          bio: profile.bio,
          social_instagram: profile.social_instagram,
          social_linkedin: profile.social_linkedin,
          
          is_active: profile.is_active,
        })
        .eq("id", profile.id);

      if (error) throw error;

      await supabase.from("system_audit_logs").insert({
        user_id: user?.id || null,
        user_name: user?.email || "Usuário",
        action: "atualizar_meu_perfil",
        object_type: "team_profile",
        object_id: profile.id,
        object_label: profile.full_name,
      });

      toast.success("Perfil atualizado com sucesso.");
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

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Senha atualizada com sucesso.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar senha.");
    } finally {
      setChangingPassword(false);
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

  if (notFound || !profile) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <h2 className="font-[Raleway] text-xl font-semibold">Você ainda não tem um perfil</h2>
        <p className="text-sm text-muted-foreground font-[Inter]">
          Crie seu perfil para preencher suas informações profissionais, foto e redes.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button variant="outline" onClick={() => navigate("/admin")} className="rounded-sm font-[Inter] text-xs">
            Voltar
          </Button>
          <Button onClick={handleCreateProfile} disabled={creating} className="rounded-sm font-[Inter] text-xs">
            {creating ? "Criando..." : "Criar meu perfil"}
          </Button>
        </div>
      </div>
    );
  }

  const initials = (profile.full_name || user?.email || "AB")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const update = (field: keyof ProfileData, value: any) =>
    setProfile({ ...profile, [field]: value });

  const roleLabel = role ? ROLE_LABELS[role as AppRole] ?? profile.role_display : profile.role_display;

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin")}
          className="rounded-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-[Raleway] text-2xl font-semibold tracking-tight text-foreground">
          Meu Perfil
        </h1>
      </div>

      {/* Avatar + Name header */}
      <div className="bg-white rounded-sm border border-border/50 p-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-lg font-[Raleway] font-semibold bg-muted">
                {initials}
              </AvatarFallback>
            </Avatar>
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
              {roleLabel || "Membro da equipe"}
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

      {/* Dados Profissionais */}
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
              maxLength={120}
              className="rounded-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-[Inter] text-xs flex items-center gap-1.5">
              Cargo <Lock className="h-3 w-3 text-muted-foreground" />
            </Label>
            <Input value={roleLabel || ""} disabled className="rounded-sm" />
            <p className="text-[10px] text-muted-foreground font-[Inter]">
              Apenas administradores podem alterar seu cargo.
            </p>
          </div>
          <div className="space-y-2">
            <Label className="font-[Inter] text-xs">CRECI</Label>
            <Input
              value={profile.creci || ""}
              onChange={(e) => update("creci", e.target.value)}
              placeholder="000000"
              maxLength={20}
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
            maxLength={1000}
            className="rounded-sm min-h-[100px] font-[Inter] text-sm"
          />
        </div>
      </div>

      {/* Redes Sociais */}
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
              maxLength={100}
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
              maxLength={200}
              className="rounded-sm"
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-sm border border-border/50 p-6 space-y-5">
        <h3 className="font-[Raleway] font-semibold text-sm text-foreground tracking-wide uppercase">
          Status & Disponibilidade
        </h3>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-sm border border-border/50 px-4 py-3">
            <Label className="font-[Inter] text-[10px] uppercase tracking-wide text-muted-foreground">
              Último acesso
            </Label>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${derivePresence(profile.last_seen_at).dotClass}`} />
              <div className="flex flex-col">
                <span className="font-[Inter] text-sm text-foreground">
                  {derivePresence(profile.last_seen_at).label}
                </span>
                <span className="text-[10px] text-muted-foreground font-[Inter]">
                  {derivePresence(profile.last_seen_at).lastSeenLabel}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/70 font-[Inter] mt-2">
              Atualizado automaticamente enquanto você usa o painel.
            </p>
          </div>
          <div className="flex items-center justify-between rounded-sm border border-border/50 px-4 py-3">
            <div>
              <Label className="font-[Inter] text-xs">Perfil Ativo</Label>
              {(role === "corretor" || role === "assistente") && (
                <p className="text-[10px] text-muted-foreground font-[Inter] mt-1">
                  Apenas administradores podem desativar seu perfil.
                </p>
              )}
            </div>
            <Switch
              checked={profile.is_active}
              onCheckedChange={(v) => update("is_active", v)}
              disabled={role === "corretor" || role === "assistente"}
            />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 rounded-sm font-[Inter] text-xs"
        >
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {/* Segurança */}
      <div className="bg-white rounded-sm border border-border/50 p-6 space-y-5">
        <h3 className="font-[Raleway] font-semibold text-sm text-foreground tracking-wide uppercase">
          Segurança
        </h3>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-[Inter] text-xs flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email da conta
            </Label>
            <Input value={user?.email || ""} disabled className="rounded-sm" />
            <p className="text-[10px] text-muted-foreground font-[Inter]">
              Para alterar o email, entre em contato com um administrador.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-[Inter] text-xs">Nova senha</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              maxLength={72}
              className="rounded-sm"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-[Inter] text-xs">Confirmar nova senha</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              maxLength={72}
              className="rounded-sm"
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className="flex justify-end pb-2">
          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || !newPassword || !confirmPassword}
            variant="outline"
            className="gap-2 rounded-sm font-[Inter] text-xs"
          >
            <KeyRound className="h-4 w-4" />
            {changingPassword ? "Atualizando..." : "Atualizar senha"}
          </Button>
        </div>
      </div>

      <div className="pb-8" />
    </div>
  );
};

export default MyProfile;
