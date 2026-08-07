import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStage: string;
  properties: { id: string; title: string; code: string }[];
  team?: { user_id: string; full_name: string | null; avatar_url: string | null }[];
}

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function NewLeadDialog({ open, onOpenChange, defaultStage, properties, team = [] }: NewLeadDialogProps) {
  const queryClient = useQueryClient();
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [propertyPopoverOpen, setPropertyPopoverOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    origin: "web",
    property_id: "",
    deal_value: "",
    assigned_user_id: "",
  });

  const canReassign = useMemo(() => {
    return role === "admin" || role === "gerente";
  }, [role]);

  useEffect(() => {
    if (user && !form.assigned_user_id) {
      setForm((prev) => ({ ...prev, assigned_user_id: user.id }));
    }
  }, [user, form.assigned_user_id]);

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === form.property_id),
    [properties, form.property_id]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setLoading(true);
    const { error } = await supabase.from("leads").insert({
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      origin: form.origin,
      property_id: form.property_id || null,
      deal_value: form.deal_value ? Number(form.deal_value) : null,
      pipeline_stage: defaultStage,
      assigned_user_id: form.assigned_user_id || user?.id || null,
    });

    setLoading(false);
    if (error) {
      toast({ title: "Erro ao criar lead", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead criado com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setForm({ name: "", phone: "", email: "", origin: "web", property_id: "", deal_value: "", assigned_user_id: user?.id || "" });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[Raleway]">Novo Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select value={form.origin} onValueChange={(v) => setForm({ ...form, origin: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="web">Web</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="fale_conosco">Fale Conosco</SelectItem>
                  <SelectItem value="agendamento_visita">Agendamento de Visita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor da Negociação</Label>
              <Input type="number" value={form.deal_value} onChange={(e) => setForm({ ...form, deal_value: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Responsável *
              {!canReassign && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Você não tem permissão para atribuir leads a outras pessoas.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </Label>
            <Select 
              value={form.assigned_user_id} 
              onValueChange={(v) => setForm({ ...form, assigned_user_id: v })}
              disabled={!canReassign}
            >
              <SelectTrigger className={cn(!canReassign && "bg-muted cursor-not-allowed opacity-80")}>
                <SelectValue placeholder="Selecione um responsável" />
              </SelectTrigger>
              <SelectContent>
                {team.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.full_name || "Sem nome"}
                  </SelectItem>
                ))}
                {!team.some(m => m.user_id === form.assigned_user_id) && form.assigned_user_id && user && (
                   <SelectItem value={user.id}>
                    {user.email?.split('@')[0]} (Você)
                   </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Imóvel de Interesse</Label>
            <Popover open={propertyPopoverOpen} onOpenChange={setPropertyPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate text-left">
                    {selectedProperty
                      ? `${selectedProperty.code} — ${selectedProperty.title}`
                      : "Selecione..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
              >
                <Command
                  filter={(value, search) => {
                    if (!search) return 1;
                    return normalize(value).includes(normalize(search)) ? 1 : 0;
                  }}
                >
                  <CommandInput placeholder="Buscar por código ou título..." />
                  <CommandList className="max-h-72">
                    <CommandEmpty>Nenhum imóvel encontrado.</CommandEmpty>
                    <CommandGroup>
                      {properties.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={`${p.code} ${p.title}`}
                          onSelect={() => {
                            setForm({ ...form, property_id: p.id });
                            setPropertyPopoverOpen(false);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Check
                            className={cn(
                              "h-4 w-4 shrink-0",
                              form.property_id === p.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate">
                            <span className="font-medium">{p.code}</span>
                            <span className="text-muted-foreground"> — {p.title}</span>
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !form.name.trim()} className="w-full">
              {loading ? "Criando..." : "Criar Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
