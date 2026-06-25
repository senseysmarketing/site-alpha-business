import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCondoList } from "@/hooks/useCondoList";
import {
  buildCtaHref,
  isExternalUrl,
  type CarouselCta,
  type CarouselCtaMode,
} from "@/lib/carouselCta";

interface CarouselCtaEditorProps {
  value?: CarouselCta;
  onChange: (next: CarouselCta) => void;
}

const PROPERTY_TYPES = ["Casa", "Apartamento", "Cobertura", "Terreno", "Sala Comercial"];

export function CarouselCtaEditor({ value, onChange }: CarouselCtaEditorProps) {
  const { condos } = useCondoList();
  const cta: CarouselCta = value ?? { mode: "search", label: "Ver todos" };
  const mode: CarouselCtaMode = cta.mode ?? "search";

  const update = (patch: Partial<CarouselCta>) => onChange({ ...cta, ...patch });
  const updateFilters = (patch: Partial<NonNullable<CarouselCta["filters"]>>) =>
    onChange({ ...cta, filters: { ...(cta.filters ?? {}), ...patch } });

  const previewHref = useMemo(() => buildCtaHref(cta), [cta]);
  const showExternalToggle = mode === "url" && isExternalUrl(cta.url?.trim() || null);

  return (
    <div className="space-y-3 rounded-sm border border-border/30 bg-muted/5 p-3">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">Botão "Ver todos"</Label>
        <p className="text-xs text-muted-foreground">
          Personalize o destino e o texto do botão deste carrossel.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="font-[Inter] text-xs text-muted-foreground">Texto do botão</Label>
          <Input
            value={cta.label ?? ""}
            onChange={(e) => update({ label: e.target.value })}
            placeholder="Ver todos"
            className="mt-1 h-9 text-sm border-border/50"
          />
        </div>
        <div>
          <Label className="font-[Inter] text-xs text-muted-foreground">Comportamento</Label>
          <Select value={mode} onValueChange={(v) => update({ mode: v as CarouselCtaMode })}>
            <SelectTrigger className="mt-1 h-9 text-sm border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="search">Ir para busca com filtros</SelectItem>
              <SelectItem value="url">Link personalizado</SelectItem>
              <SelectItem value="hidden">Ocultar botão</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {mode === "search" && (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="font-[Inter] text-xs text-muted-foreground">Condomínio</Label>
              <Select
                value={cta.filters?.condominium ?? "__any"}
                onValueChange={(v) => updateFilters({ condominium: v === "__any" ? undefined : v })}
              >
                <SelectTrigger className="mt-1 h-9 text-sm border-border/50">
                  <SelectValue placeholder="Qualquer" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="__any">Qualquer condomínio</SelectItem>
                  {condos.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-[Inter] text-xs text-muted-foreground">Transação</Label>
              <Select
                value={cta.filters?.transactionType ?? "all"}
                onValueChange={(v) =>
                  updateFilters({ transactionType: v as "venda" | "locacao" | "all" })
                }
              >
                <SelectTrigger className="mt-1 h-9 text-sm border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="venda">Venda</SelectItem>
                  <SelectItem value="locacao">Locação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="font-[Inter] text-xs text-muted-foreground">Tipo</Label>
              <Select
                value={cta.filters?.propertyType ?? "__any"}
                onValueChange={(v) => updateFilters({ propertyType: v === "__any" ? undefined : v })}
              >
                <SelectTrigger className="mt-1 h-9 text-sm border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__any">Todos</SelectItem>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-[Inter] text-xs text-muted-foreground">Cidade</Label>
              <Input
                value={cta.filters?.city ?? ""}
                onChange={(e) => updateFilters({ city: e.target.value || undefined })}
                placeholder="Ex: Barueri"
                className="mt-1 h-9 text-sm border-border/50"
              />
            </div>
            <div>
              <Label className="font-[Inter] text-xs text-muted-foreground">Bairro</Label>
              <Input
                value={cta.filters?.neighborhood ?? ""}
                onChange={(e) => updateFilters({ neighborhood: e.target.value || undefined })}
                placeholder="Ex: Granja Viana"
                className="mt-1 h-9 text-sm border-border/50"
              />
            </div>
          </div>
        </div>
      )}

      {mode === "url" && (
        <div className="space-y-3 pt-1">
          <div>
            <Label className="font-[Inter] text-xs text-muted-foreground">URL</Label>
            <Input
              value={cta.url ?? ""}
              onChange={(e) => update({ url: e.target.value })}
              placeholder="/condominios/vintage  ou  https://..."
              className="mt-1 h-9 text-sm border-border/50"
            />
          </div>
          {showExternalToggle && (
            <div className="flex items-center justify-between rounded-sm border border-border/30 bg-background/50 px-3 py-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Abrir em nova aba</Label>
                <p className="text-xs text-muted-foreground">
                  Recomendado para links externos.
                </p>
              </div>
              <Switch
                checked={!!cta.openInNewTab}
                onCheckedChange={(checked) => update({ openInNewTab: checked })}
              />
            </div>
          )}
        </div>
      )}

      {mode !== "hidden" && previewHref && (
        <p className="text-[11px] text-muted-foreground/70 font-mono break-all">
          → {previewHref}
        </p>
      )}
    </div>
  );
}
