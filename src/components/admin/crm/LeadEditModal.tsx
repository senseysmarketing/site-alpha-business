import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Building2, Check, X, ChevronsUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatBRPhone, onlyDigits } from "@/lib/phone";
import { cn } from "@/lib/utils";
import type { Lead } from "./LeadCard";

interface LeadEditModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: Lead) => void;
  onCancel: () => void;
}

const ORIGINS: { value: string; label: string }[] = [
  { value: "site", label: "Site" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "indicacao", label: "Indicação" },
  { value: "portal", label: "Portal" },
  { value: "agendamento_visita", label: "Agendamento de visita" },
  { value: "manual", label: "Manual" },
  { value: "outro", label: "Outro" },
];

const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do lead.")
    .max(120, "Nome muito longo (máx. 120)."),
  email: z
    .string()
    .trim()
    .max(255, "E-mail muito longo.")
    .email("E-mail inválido.")
    .or(z.literal(""))
    .optional(),
  phoneDigits: z
    .string()
    .refine((v) => v === "" || v.length === 10 || v.length === 11, {
      message: "Telefone deve ter 10 ou 11 dígitos.",
    }),
  origin: z.string().min(1, "Selecione uma origem."),
  property_id: z.string().uuid().nullable(),
});

interface PropertyOption {
  id: string;
  code: string | null;
  title: string;
  transaction_type: string | null;
}

export function LeadEditModal({
  lead,
  open,
  onOpenChange,
  onSaved,
  onCancel,
}: LeadEditModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [origin, setOrigin] = useState("site");
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [propertyLabel, setPropertyLabel] = useState<string | null>(null);
  const [propertyOpen, setPropertyOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!lead) return;
    setName(lead.name || "");
    setEmail(lead.email || "");
    setPhone(formatBRPhone(lead.phone || ""));
    setOrigin(lead.origin || "site");
    setPropertyId(lead.property_id ?? null);
    setPropertyLabel(
      lead.properties
        ? `${lead.properties.code ? `Cód. ${lead.properties.code} — ` : ""}${lead.properties.title}`
        : null,
    );
    setErrors({});
    setSearch("");
  }, [lead?.id, open]);

  const { data: propertyResults = [], isFetching } = useQuery({
    queryKey: ["lead-edit-properties", search],
    queryFn: async () => {
      const query = supabase
        .from("properties")
        .select("id, code, title, transaction_type")
        .order("created_at", { ascending: false })
        .limit(20);
      if (search.trim()) {
        const term = `%${search.trim()}%`;
        query.or(`title.ilike.${term},code.ilike.${term}`);
      }
      const { data } = await query;
      return (data || []) as PropertyOption[];
    },
    enabled: open && propertyOpen,
  });

  const initialSnapshot = useMemo(() => {
    if (!lead) return null;
    return {
      name: lead.name || "",
      email: lead.email || "",
      phoneDigits: onlyDigits(lead.phone || ""),
      origin: lead.origin || "site",
      property_id: lead.property_id ?? null,
    };
  }, [lead?.id]);

  const currentSnapshot = {
    name: name.trim(),
    email: email.trim(),
    phoneDigits: onlyDigits(phone),
    origin,
    property_id: propertyId,
  };

  const dirty =
    initialSnapshot != null &&
    JSON.stringify(initialSnapshot) !== JSON.stringify(currentSnapshot);

  const handleSelectProperty = (p: PropertyOption) => {
    setPropertyId(p.id);
    setPropertyLabel(`${p.code ? `Cód. ${p.code} — ` : ""}${p.title}`);
    setPropertyOpen(false);
  };

  const handleClearProperty = () => {
    setPropertyId(null);
    setPropertyLabel(null);
  };

  const handleSave = async () => {
    if (!lead) return;
    const parsed = leadSchema.safeParse(currentSnapshot);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const key = i.path[0]?.toString() || "form";
        if (!map[key]) map[key] = i.message;
      });
      setErrors(map);
      return;
    }
    setErrors({});
    setSaving(true);

    const digits = onlyDigits(phone);
    const payload = {
      name: name.trim(),
      email: email.trim() ? email.trim() : null,
      phone: digits ? formatBRPhone(digits) : null,
      origin,
      property_id: propertyId,
    };

    const { data, error } = await supabase
      .from("leads")
      .update(payload)
      .eq("id", lead.id)
      .select(
        `*,
        assigned_user:team_profiles!leads_assigned_user_id_fkey(user_id, full_name, avatar_url),
        properties:property_id(title, photos, code)`,
      )
      .maybeSingle();

    setSaving(false);

    if (error || !data) {
      toast({
        title: "Erro ao salvar",
        description: error?.message || "Não foi possível atualizar o lead.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Lead atualizado" });
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["lead_recurrence", lead.id] });
    onSaved(data as unknown as Lead);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && !saving) {
      onCancel();
      return;
    }
    onOpenChange(next);
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "p-0 gap-0 overflow-hidden bg-background",
          "w-[calc(100vw-2rem)] sm:max-w-lg sm:rounded-xl",
          "flex flex-col max-h-[90vh]",
        )}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogTitle className="font-[Raleway] text-lg font-semibold">
            Editar lead
          </DialogTitle>
          <DialogDescription className="font-[Inter] text-xs text-muted-foreground">
            Atualizando informações de <span className="font-medium text-foreground">{lead.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Identificação */}
          <section className="space-y-4">
            <h3 className="font-[Raleway] text-[10px] uppercase tracking-wide text-muted-foreground">
              Identificação
            </h3>
            <Separator />

            <div className="space-y-1.5">
              <Label className="font-[Inter] text-xs">Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                className="h-9 rounded-sm"
              />
              {errors.name && (
                <p className="text-[11px] text-destructive font-[Inter]">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-[Inter] text-xs">E-mail</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  placeholder="cliente@email.com"
                  className="h-9 rounded-sm"
                />
                {errors.email && (
                  <p className="text-[11px] text-destructive font-[Inter]">{errors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="font-[Inter] text-xs">Telefone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(formatBRPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  inputMode="tel"
                  maxLength={15}
                  className="h-9 rounded-sm"
                />
                {errors.phoneDigits && (
                  <p className="text-[11px] text-destructive font-[Inter]">
                    {errors.phoneDigits}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Negócio */}
          <section className="space-y-4">
            <h3 className="font-[Raleway] text-[10px] uppercase tracking-wide text-muted-foreground">
              Negócio
            </h3>
            <Separator />

            <div className="space-y-1.5">
              <Label className="font-[Inter] text-xs">Origem</Label>
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger className="h-9 rounded-sm text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[80] bg-popover">
                  {ORIGINS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.origin && (
                <p className="text-[11px] text-destructive font-[Inter]">{errors.origin}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="font-[Inter] text-xs">Imóvel de interesse</Label>
              <div className="flex items-center gap-2">
                <Popover open={propertyOpen} onOpenChange={setPropertyOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="h-9 flex-1 justify-between rounded-sm font-[Inter] text-sm font-normal"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">
                          {propertyLabel || "Buscar imóvel por título ou código"}
                        </span>
                      </span>
                      <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-0 z-[80] bg-popover w-[--radix-popover-trigger-width]"
                    align="start"
                  >
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Digite para buscar..."
                        value={search}
                        onValueChange={setSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {isFetching ? "Buscando..." : "Nenhum imóvel encontrado."}
                        </CommandEmpty>
                        <CommandGroup>
                          {propertyResults.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.id}
                              onSelect={() => handleSelectProperty(p)}
                              className="flex items-start gap-2"
                            >
                              <Check
                                className={cn(
                                  "h-3.5 w-3.5 mt-1",
                                  propertyId === p.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-[Inter] truncate">
                                  {p.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-[Inter]">
                                  {p.code ? `Cód. ${p.code}` : "Sem código"}
                                  {p.transaction_type && ` · ${p.transaction_type}`}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {propertyId && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-sm text-muted-foreground hover:text-destructive"
                    onClick={handleClearProperty}
                    title="Remover imóvel"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground/70 font-[Inter]">
                Deixe em branco se o lead ainda não tem um imóvel específico.
              </p>
            </div>
          </section>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/50 bg-muted/20 gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={saving}
            className="rounded-sm font-[Inter] text-xs"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="rounded-sm font-[Inter] text-xs"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
