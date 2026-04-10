import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const roles = [
  { value: "admin", label: "Admin" },
  { value: "gerente", label: "Gerente" },
  { value: "corretor", label: "Corretor" },
  { value: "assistente", label: "Assistente" },
];

const InviteMemberDialog = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "corretor" as string,
    creci: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email) {
      toast.error("Nome e e-mail são obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      // For now, just create the team_profile record.
      // Full invite flow (auth user creation) would require an edge function.
      // This creates a placeholder profile that can be linked later.
      const { error } = await supabase.from("team_profiles").insert({
        full_name: form.fullName,
        user_id: crypto.randomUUID(), // placeholder — will be replaced on actual signup
        creci: form.creci || null,
        phone: form.phone || null,
        role_display: roles.find((r) => r.value === form.role)?.label || "Corretor",
      });

      if (error) throw error;

      toast.success(`${form.fullName} adicionado à equipe.`);
      setForm({ fullName: "", email: "", role: "corretor", creci: "", phone: "" });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar membro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 rounded-sm font-[Inter] text-xs">
          <UserPlus className="h-4 w-4" />
          Convidar Membro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[Raleway] text-lg font-semibold">
            Novo Membro da Equipe
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="font-[Inter] text-xs">Nome Completo *</Label>
            <Input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Ex: João Silva"
              className="rounded-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-[Inter] text-xs">E-mail *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="joao@alpha.com"
              className="rounded-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="font-[Inter] text-xs">Cargo</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger className="rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-[Inter] text-xs">CRECI</Label>
              <Input
                value={form.creci}
                onChange={(e) => setForm({ ...form, creci: e.target.value })}
                placeholder="000000"
                className="rounded-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-[Inter] text-xs">Telefone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(11) 99999-9999"
              className="rounded-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} className="rounded-sm font-[Inter] text-xs">
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="rounded-sm font-[Inter] text-xs">
              {loading ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberDialog;
