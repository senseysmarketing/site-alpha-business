import { useEffect, useState } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  useKenloSyncConfig, useKenloLastIp, DEFAULT_KENLO_CONFIG, type KenloSyncConfig,
} from "@/hooks/useKenloSyncConfig";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROPERTY_TYPES = ["apartamento", "casa", "casa em condominio", "cobertura", "terreno", "comercial"];

export const KenloSettingsDialog = ({ open, onOpenChange }: Props) => {
  const { data: config, save, isSaving } = useKenloSyncConfig();
  const { data: lastIp } = useKenloLastIp();
  const [draft, setDraft] = useState<KenloSyncConfig>(DEFAULT_KENLO_CONFIG);
  const [copied, setCopied] = useState(false);
  const [condoInput, setCondoInput] = useState("");

  useEffect(() => {
    if (config) setDraft({ ...DEFAULT_KENLO_CONFIG, ...config });
  }, [config, open]);

  const update = <K extends keyof KenloSyncConfig>(k: K, v: KenloSyncConfig[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const togglePropertyType = (t: string) => {
    const list = draft.allowed_property_types.includes(t)
      ? draft.allowed_property_types.filter((x) => x !== t)
      : [...draft.allowed_property_types, t];
    update("allowed_property_types", list);
  };

  const addCondo = () => {
    const v = condoInput.trim();
    if (!v || draft.allowed_condominiums.includes(v)) return;
    update("allowed_condominiums", [...draft.allowed_condominiums, v]);
    setCondoInput("");
  };

  const removeCondo = (c: string) =>
    update("allowed_condominiums", draft.allowed_condominiums.filter((x) => x !== c));

  const copyIp = async () => {
    if (!lastIp?.ip) return;
    await navigator.clipboard.writeText(lastIp.ip);
    setCopied(true);
    toast({ title: "IP copiado" });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-[Raleway]">Configurações do Feed Kenlo</DialogTitle>
          <DialogDescription className="font-[Inter] text-xs">
            Personalize a sincronização XML da ValueGaia.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="connection" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connection">Conexão</TabsTrigger>
            <TabsTrigger value="filters">Filtros</TabsTrigger>
            <TabsTrigger value="behavior">Comportamento</TabsTrigger>
          </TabsList>

          {/* CONNECTION */}
          <TabsContent value="connection" className="space-y-4 pt-4">
            <div className="rounded-lg border border-border/50 p-4 bg-muted/30">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-foreground/70 mt-0.5" />
                <div>
                  <p className="font-[Inter] text-xs font-medium">IP de saída para whitelisting</p>
                  <p className="font-[Inter] text-[11px] text-muted-foreground">
                    Envie este IP à equipe da Kenlo/ValueGaia para liberar acesso.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded bg-background border border-border/50 font-mono text-sm">
                  {lastIp?.ip ?? "Clique em Sincronizar Agora para detectar"}
                </code>
                <Button size="sm" variant="outline" onClick={copyIp} disabled={!lastIp?.ip}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {lastIp?.checked_at && (
                <p className="mt-2 font-[Inter] text-[10px] text-muted-foreground">
                  Última verificação: {new Date(lastIp.checked_at).toLocaleString("pt-BR")}
                </p>
              )}
            </div>
          </TabsContent>

          {/* FILTERS */}
          <TabsContent value="filters" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <Label className="font-[Inter] text-xs">Importar Vendas</Label>
                <Switch checked={draft.import_sale} onCheckedChange={(v) => update("import_sale", v)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <Label className="font-[Inter] text-xs">Importar Locações</Label>
                <Switch checked={draft.import_rental} onCheckedChange={(v) => update("import_rental", v)} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div>
                <Label className="font-[Inter] text-xs">Dividir imóveis duplos</Label>
                <p className="font-[Inter] text-[10px] text-muted-foreground">
                  Cria registros -V e -L quando há venda + locação
                </p>
              </div>
              <Switch checked={draft.split_dual} onCheckedChange={(v) => update("split_dual", v)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-[Inter] text-xs">Preço mínimo (BRL)</Label>
                <Input
                  type="number"
                  value={draft.min_price}
                  onChange={(e) => update("min_price", Number(e.target.value) || 0)}
                  className="mt-1 font-[Inter] text-sm"
                />
              </div>
              <div>
                <Label className="font-[Inter] text-xs">Preço máximo (0 = sem limite)</Label>
                <Input
                  type="number"
                  value={draft.max_price}
                  onChange={(e) => update("max_price", Number(e.target.value) || 0)}
                  className="mt-1 font-[Inter] text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="font-[Inter] text-xs">Tipos permitidos (vazio = todos)</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {PROPERTY_TYPES.map((t) => {
                  const active = draft.allowed_property_types.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => togglePropertyType(t)}
                      className={`px-3 py-1 rounded-full text-[11px] font-[Inter] border transition-colors ${
                        active
                          ? "bg-foreground text-background border-foreground"
                          : "bg-white text-muted-foreground border-border/50 hover:border-foreground/30"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="font-[Inter] text-xs">Condomínios permitidos (vazio = todos)</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={condoInput}
                  onChange={(e) => setCondoInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCondo())}
                  placeholder="Ex: Tamboré 11"
                  className="font-[Inter] text-sm"
                />
                <Button type="button" onClick={addCondo} variant="outline" size="sm">
                  Adicionar
                </Button>
              </div>
              {draft.allowed_condominiums.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {draft.allowed_condominiums.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => removeCondo(c)}
                      className="px-3 py-1 rounded-full text-[11px] font-[Inter] bg-foreground text-background"
                    >
                      {c} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* BEHAVIOR */}
          <TabsContent value="behavior" className="space-y-4 pt-4">
            <div>
              <Label className="font-[Inter] text-xs">Quando o imóvel sumir do feed</Label>
              <Select
                value={draft.missing_behavior}
                onValueChange={(v) => update("missing_behavior", v as KenloSyncConfig["missing_behavior"])}
              >
                <SelectTrigger className="mt-1.5 font-[Inter] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inativar">Inativar (recomendado)</SelectItem>
                  <SelectItem value="manter">Manter ativo</SelectItem>
                  <SelectItem value="deletar">Deletar permanentemente</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1.5 font-[Inter] text-[10px] text-muted-foreground">
                Imóveis manuais (cadastrados pelo painel) nunca são afetados.
              </p>
            </div>

            <div>
              <Label className="font-[Inter] text-xs">Campos protegidos (não sobrescritos pela sync)</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {["is_featured", "engineering_highlights", "title", "description", "photos"].map((f) => {
                  const active = draft.protected_fields.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() =>
                        update(
                          "protected_fields",
                          active ? draft.protected_fields.filter((x) => x !== f) : [...draft.protected_fields, f],
                        )
                      }
                      className={`px-3 py-1 rounded-full text-[11px] font-[Inter] font-mono border transition-colors ${
                        active
                          ? "bg-foreground text-background border-foreground"
                          : "bg-white text-muted-foreground border-border/50 hover:border-foreground/30"
                      }`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={() => save(draft, { onSuccess: () => onOpenChange(false) })}
            disabled={isSaving}
            className="font-[Inter] text-xs uppercase tracking-widest"
          >
            {isSaving ? "Salvando..." : "Salvar configurações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
