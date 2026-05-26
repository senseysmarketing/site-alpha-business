import { useState, useEffect, useCallback } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Save, RotateCcw, Plus, Trash2, Upload, User, RefreshCw, CheckCircle2, AlertCircle, Loader2, X, GripVertical, ArrowUp, ArrowDown, Power, ChevronsUpDown, Check } from "lucide-react";
import { useCondoList, resolveCanonicalCondo } from "@/hooks/useCondoList";
import { normalizeCondoTokens } from "@/lib/condoMatching";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { applyDesignTokens } from "@/lib/colorTokens";

// ── Types ──────────────────────────────────────────
interface HeroSlide {
  id: string;
  tagline: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  media_type: "image" | "video";
  media_url: string;
  poster_url?: string;
}

interface HeroSettings {
  slides: HeroSlide[];
  // Legacy (mantidos p/ retrocompat no JSON)
  tagline?: string;
  headline?: string;
  carousel_property_ids?: string[];
}

interface DesignTokens {
  accent_color: string;
  background_color: string;
  secondary_color: string;
}

interface FeaturedBannerButton {
  label: string;
  condominium?: string;
  /** Legacy: only kept to migrate old entries. */
  href?: string;
}

interface FeaturedBannerSettings {
  tagline: string;
  title: string;
  description: string;
  background_image: string;
  buttons: FeaturedBannerButton[];
}

interface LifestyleCategory {
  title: string;
  image: string;
  tag: string;
}

interface TeamMember {
  name: string;
  role: string;
  creci: string;
  photo: string;
}

interface ContactSettings {
  phone: string;
  email: string;
  instagram: string;
  address: string;
}

interface FooterSettings {
  copyright_text: string;
  tagline: string;
}

interface CondoLink {
  name: string;
  href: string;
  image?: string;
}

interface CondoRegion {
  title: string;
  links: CondoLink[];
}

interface CondoMenuSettings {
  featured: CondoLink[];
  regions: CondoRegion[];
}

const DEFAULT_TOKENS: DesignTokens = {
  accent_color: "#2A070C",
  background_color: "#F5F0EB",
  secondary_color: "#8B7D6B",
};

const DEFAULT_HERO: HeroSettings = {
  slides: [],
  tagline: "Prepare-se para sonhar alto",
  headline: "Se você está buscando *imóveis de luxo*, aqui é o seu lugar",
  carousel_property_ids: [],
};

const newSlide = (): HeroSlide => ({
  id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `slide-${Date.now()}-${Math.random()}`,
  tagline: "Prepare-se para sonhar alto",
  title: "Se você está buscando *imóveis de luxo*, aqui é o seu lugar",
  subtitle: "",
  cta_label: "Saiba Mais",
  cta_href: "/busca",
  media_type: "image",
  media_url: "",
});

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;   // 5 MB
const MAX_VIDEO_BYTES = 15 * 1024 * 1024;  // 15 MB

const DEFAULT_FEATURED: FeaturedBannerSettings = {
  tagline: "Conheça os condomínios",
  title: "As propriedades mais que especiais em *Alphaville*",
  description: "Descubra os melhores condomínios da região e encontre o imóvel perfeito para o seu estilo de vida.",
  background_image: "",
  buttons: [
    { label: "Tamboré I", condominium: "" },
    { label: "Tamboré II", condominium: "" },
    { label: "Tamboré III", condominium: "" },
  ],
};

/** Extract a condominium value from a legacy href like `/busca?condominio=tambore-1`. */
function extractCondoFromHref(href?: string): string {
  if (!href) return "";
  try {
    const q = href.split("?")[1] || "";
    const params = new URLSearchParams(q);
    return decodeURIComponent(params.get("condominium") || params.get("condominio") || "").replace(/-/g, " ").trim();
  } catch {
    return "";
  }
}

// ── Helper: Upload to bucket ──────────────────────
async function uploadFile(file: File, path: string) {
  const ext = file.name.split(".").pop();
  const filePath = `${path}/${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage.from("property-photos").upload(filePath, file);
  if (error) throw error;
  const { data: urlData } = supabase.storage.from("property-photos").getPublicUrl(data.path);
  return urlData.publicUrl;
}

// ── Reusable color picker ──────────────────────────
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-sm border border-border/50 cursor-pointer p-0 bg-transparent"
        />
      </div>
      <div className="flex-1">
        <Label className="font-[Inter] text-xs text-muted-foreground">{label}</Label>
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 font-mono text-xs mt-1 border-border/50" />
      </div>
    </div>
  );
}

// ── Photo dropzone ─────────────────────────────────
function PhotoDrop({ value, onUpload, label }: { value: string; onUpload: (url: string) => void; label: string }) {
  const [uploading, setUploading] = useState(false);
  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return;
    setUploading(true);
    try {
      const url = await uploadFile(files[0], "settings");
      onUpload(url);
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] }, maxFiles: 1 });

  return (
    <div>
      <Label className="font-[Inter] text-xs text-muted-foreground mb-1 block">{label}</Label>
      <div
        {...getRootProps()}
        className={`border border-dashed border-border/50 rounded-sm p-4 text-center cursor-pointer transition-colors ${isDragActive ? "bg-muted/30" : "bg-white"}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Progress value={50} className="h-1" />
        ) : value ? (
          <img src={value} alt="" className="h-16 mx-auto object-cover rounded-sm" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground/60">
            <Upload className="h-5 w-5" />
            <span className="text-xs">Arraste ou clique</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Media dropzone (image OR video) with size validation ──
function MediaDrop({
  mediaType,
  url,
  onUpload,
}: {
  mediaType: "image" | "video";
  url: string;
  onUpload: (next: { url: string; mediaType: "image" | "video" }) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) {
        toast.error("Formato não suportado. Envie imagem ou vídeo MP4/WebM.");
        return;
      }
      const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
      const limitMb = isVideo ? 15 : 5;
      if (file.size > limit) {
        toast.error(`Arquivo muito grande. Limite: ${limitMb} MB`);
        return;
      }
      setUploading(true);
      try {
        const publicUrl = await uploadFile(file, "hero-slides");
        onUpload({ url: publicUrl, mediaType: isVideo ? "video" : "image" });
        toast.success("Mídia enviada");
      } catch {
        toast.error("Falha no upload. Tente novamente.");
      } finally {
        setUploading(false);
      }
    },
    [onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
      "video/mp4": [],
      "video/webm": [],
    },
    maxFiles: 1,
  });

  return (
    <div>
      <Label className="font-[Inter] text-xs text-muted-foreground mb-1 block">Mídia (imagem ou vídeo)</Label>
      <div
        {...getRootProps()}
        className={`border border-dashed border-border/50 rounded-sm p-4 text-center cursor-pointer transition-colors ${
          isDragActive ? "bg-muted/30" : "bg-white"
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Enviando…</span>
          </div>
        ) : url ? (
          mediaType === "video" ? (
            <video src={url} muted playsInline className="h-24 mx-auto object-cover rounded-sm" />
          ) : (
            <img src={url} alt="" className="h-24 mx-auto object-cover rounded-sm" />
          )
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground/60">
            <Upload className="h-5 w-5" />
            <span className="text-xs">Arraste ou clique para enviar imagem ou vídeo</span>
          </div>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground/80 mt-1.5 leading-relaxed">
        Recomendado: imagens 1920×1080 (JPG/WebP, até <strong>5 MB</strong>) ou vídeos MP4 H.264 1080p
        (até <strong>15 MB</strong>, ~10s). Arquivos maiores impactam o tempo de carregamento do site.
      </p>
    </div>
  );
}

// ── Single Hero slide editor card ─────────────────
function HeroSlideEditor({
  slide,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  slide: HeroSlide;
  index: number;
  total: number;
  onChange: (next: HeroSlide) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [open, setOpen] = useState(index === 0);
  const update = <K extends keyof HeroSlide>(key: K, value: HeroSlide[K]) =>
    onChange({ ...slide, [key]: value });

  return (
    <div className="border border-border/50 rounded-sm bg-white">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-muted/20">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          {slide.media_url ? (
            slide.media_type === "video" ? (
              <video src={slide.media_url} muted className="w-12 h-8 object-cover rounded-sm shrink-0 bg-muted" />
            ) : (
              <img src={slide.media_url} alt="" className="w-12 h-8 object-cover rounded-sm shrink-0" />
            )
          ) : (
            <div className="w-12 h-8 bg-muted/40 rounded-sm shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-[Inter] text-xs font-medium truncate">
              Banner {index + 1}{slide.title ? ` — ${slide.title.replace(/\*/g, "").slice(0, 40)}` : ""}
            </p>
            <p className="font-[Inter] text-[10px] text-muted-foreground">
              {slide.media_type === "video" ? "Vídeo" : "Imagem"} · CTA: {slide.cta_label || "—"}
            </p>
          </div>
        </button>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground" onClick={() => onMove(-1)} disabled={index === 0} title="Mover para cima">
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground" onClick={() => onMove(1)} disabled={index === total - 1} title="Mover para baixo">
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={onRemove} title="Remover banner">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {open && (
        <div className="p-4 space-y-4">
          <div>
            <Label className="font-[Inter] text-xs text-muted-foreground">Frase de apoio (tagline)</Label>
            <Input value={slide.tagline} onChange={(e) => update("tagline", e.target.value)} placeholder="Prepare-se para sonhar alto" className="mt-1 h-9 text-sm border-border/50" />
          </div>
          <div>
            <Label className="font-[Inter] text-xs text-muted-foreground">
              Título principal <span className="text-muted-foreground/50">— use *asteriscos* para itálico</span>
            </Label>
            <Textarea value={slide.title} onChange={(e) => update("title", e.target.value)} placeholder="Se você está buscando *imóveis de luxo*, aqui é o seu lugar" className="mt-1 text-sm border-border/50 min-h-[60px]" />
          </div>
          <div>
            <Label className="font-[Inter] text-xs text-muted-foreground flex items-center justify-between">
              <span>Subtítulo / descrição curta</span>
              <span className="text-muted-foreground/50">{slide.subtitle.length}/140</span>
            </Label>
            <Textarea value={slide.subtitle} onChange={(e) => update("subtitle", e.target.value.slice(0, 140))} placeholder="Descrição complementar do banner" className="mt-1 text-sm border-border/50 min-h-[50px]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="font-[Inter] text-xs text-muted-foreground">Texto do botão</Label>
              <Input value={slide.cta_label} onChange={(e) => update("cta_label", e.target.value)} placeholder="Saiba Mais" className="mt-1 h-9 text-sm border-border/50" />
            </div>
            <div>
              <Label className="font-[Inter] text-xs text-muted-foreground">
                Link do botão <span className="text-muted-foreground/50">— /rota ou https://…</span>
              </Label>
              <Input value={slide.cta_href} onChange={(e) => update("cta_href", e.target.value)} placeholder="/imovel/abc-123" className="mt-1 h-9 text-sm border-border/50" />
            </div>
          </div>
          <MediaDrop
            mediaType={slide.media_type}
            url={slide.media_url}
            onUpload={({ url, mediaType }) => onChange({ ...slide, media_url: url, media_type: mediaType })}
          />
        </div>
      )}
    </div>
  );
}


// ── Block wrapper ──────────────────────────────────
function SettingsBlock({ title, children, onSave, isSaving }: { title: string; children: React.ReactNode; onSave: () => void; isSaving?: boolean }) {
  return (
    <Card className="bg-white border-border/50 shadow-none rounded-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-[Raleway] text-base font-semibold tracking-tight">{title}</CardTitle>
          <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving} className="h-8 text-xs rounded-sm border-border/50 gap-1.5">
            <Save className="h-3.5 w-3.5" />
            Salvar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

// ── Property multi-select for carousel ─────────────
function PropertyMultiSelect({
  selectedIds,
  onChange,
  properties,
  max = 5,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  properties: { id: string; code: string; title: string; photos: string[] | null }[];
  max?: number;
}) {
  const [open, setOpen] = useState(false);

  const addProperty = (id: string) => {
    if (selectedIds.length < max && !selectedIds.includes(id)) {
      onChange([...selectedIds, id]);
    }
    setOpen(false);
  };

  const removeProperty = (id: string) => {
    onChange(selectedIds.filter((i) => i !== id));
  };

  const availableProperties = properties.filter((p) => !selectedIds.includes(p.id));
  const selectedProperties = selectedIds
    .map((id) => properties.find((p) => p.id === id))
    .filter(Boolean) as typeof properties;

  return (
    <div className="space-y-3">
      <div>
        <Label className="font-[Inter] text-xs text-muted-foreground">
          Imóveis no carrossel ({selectedIds.length}/{max})
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="mt-1 w-full justify-start h-9 text-sm border-border/50 font-normal"
              disabled={selectedIds.length >= max}
            >
              {selectedIds.length >= max ? "Máximo atingido" : "Adicionar imóvel..."}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar por código ou nome..." />
              <CommandList className="max-h-60">
                <CommandEmpty>Nenhum imóvel encontrado</CommandEmpty>
                <CommandGroup>
                  {availableProperties.map((p) => (
                    <CommandItem key={p.id} value={`${p.code} ${p.title}`} onSelect={() => addProperty(p.id)}>
                      <span className="font-medium">{p.code}</span>
                      <span className="ml-2 text-muted-foreground truncate">{p.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {selectedProperties.length > 0 && (
        <div className="space-y-2">
          {selectedProperties.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 border border-border/30 rounded-sm p-2">
              <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              <span className="font-[Inter] text-xs text-muted-foreground w-5">{i + 1}.</span>
              {p.photos?.[0] ? (
                <img src={p.photos[0]} alt="" className="w-10 h-7 object-cover rounded-sm shrink-0" />
              ) : (
                <div className="w-10 h-7 bg-muted/30 rounded-sm shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-[Inter] text-xs font-medium truncate">{p.title}</p>
                <p className="font-[Inter] text-[10px] text-muted-foreground">{p.code}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeProperty(p.id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────
const SiteSettings = () => {
  const { user } = useAuth();

  // ── Hero ──
  const hero = useSiteSettings<HeroSettings>("hero");
  const [heroForm, setHeroForm] = useState<HeroSettings>(DEFAULT_HERO);
  const [activePreviewSlide, setActivePreviewSlide] = useState(0);
  useEffect(() => {
    if (!hero.data) return;
    const existingSlides = hero.data.slides ?? [];
    if (existingSlides.length > 0) {
      setHeroForm({
        slides: existingSlides,
        tagline: hero.data.tagline,
        headline: hero.data.headline,
        carousel_property_ids: hero.data.carousel_property_ids ?? [],
      });
    } else {
      // Migração defensiva: gera 1 slide a partir dos campos legacy
      const legacy: HeroSlide = {
        id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `slide-${Date.now()}`,
        tagline: hero.data.tagline || DEFAULT_HERO.tagline!,
        title: hero.data.headline || DEFAULT_HERO.headline!,
        subtitle: "",
        cta_label: "Saiba Mais",
        cta_href: "/busca",
        media_type: "image",
        media_url: "",
      };
      setHeroForm({
        slides: [legacy],
        tagline: hero.data.tagline,
        headline: hero.data.headline,
        carousel_property_ids: hero.data.carousel_property_ids ?? [],
      });
    }
  }, [hero.data]);

  const updateSlide = (index: number, next: HeroSlide) =>
    setHeroForm((prev) => ({ ...prev, slides: prev.slides.map((s, i) => (i === index ? next : s)) }));
  const addSlide = () =>
    setHeroForm((prev) => (prev.slides.length >= 5 ? prev : { ...prev, slides: [...prev.slides, newSlide()] }));
  const removeSlide = (index: number) => {
    setHeroForm((prev) => ({ ...prev, slides: prev.slides.filter((_, i) => i !== index) }));
    setActivePreviewSlide(0);
  };
  const moveSlide = (index: number, dir: -1 | 1) =>
    setHeroForm((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.slides.length) return prev;
      const next = [...prev.slides];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, slides: next };
    });


  // ── Homepage Featured Properties (carrossel "Nossas propriedades especiais") ──
  const homeFeatured = useSiteSettings<{ property_ids: string[] }>("homepage_featured_properties");
  const [homeFeaturedIds, setHomeFeaturedIds] = useState<string[]>([]);
  useEffect(() => {
    if (homeFeatured.data?.property_ids) setHomeFeaturedIds(homeFeatured.data.property_ids);
  }, [homeFeatured.data]);

  // ── Homepage Carousels 2 & 3 ──
  interface CarouselSettings {
    title: string;
    property_ids: string[];
    is_active: boolean;
  }
  const carousel2 = useSiteSettings<CarouselSettings>("homepage_carousel_2");
  const [carousel2Form, setCarousel2Form] = useState<CarouselSettings>({ title: "", property_ids: [], is_active: false });
  useEffect(() => {
    if (carousel2.data) setCarousel2Form(carousel2.data);
  }, [carousel2.data]);

  const carousel3 = useSiteSettings<CarouselSettings>("homepage_carousel_3");
  const [carousel3Form, setCarousel3Form] = useState<CarouselSettings>({ title: "", property_ids: [], is_active: false });
  useEffect(() => {
    if (carousel3.data) setCarousel3Form(carousel3.data);
  }, [carousel3.data]);

  // ── Tokens ──
  const tokens = useSiteSettings<DesignTokens>("design_tokens");
  const [tokensForm, setTokensForm] = useState<DesignTokens>(DEFAULT_TOKENS);
  useEffect(() => { if (tokens.data) setTokensForm(tokens.data); }, [tokens.data]);

  useEffect(() => {
    applyDesignTokens(tokensForm);
  }, [tokensForm]);

  // ── Featured Banner ──
  const featured = useSiteSettings<FeaturedBannerSettings>("featured_banner");
  const { condos: allCondos } = useCondoList();
  const [featuredForm, setFeaturedForm] = useState<FeaturedBannerSettings>(DEFAULT_FEATURED);
  useEffect(() => {
    if (featured.data) {
      const rawButtons: FeaturedBannerButton[] = featured.data.buttons?.length
        ? featured.data.buttons
        : DEFAULT_FEATURED.buttons;
      // Migrate legacy `href` → `condominium` whenever possible.
      const migrated = rawButtons.map((b) => {
        if (b.condominium) return { label: b.label || "", condominium: b.condominium };
        const fromHref = extractCondoFromHref(b.href);
        const resolved = fromHref && allCondos.length ? resolveCanonicalCondo(fromHref, allCondos) : null;
        return {
          label: b.label || "",
          condominium: resolved || "",
          ...(resolved ? {} : { href: b.href }),
        };
      });
      setFeaturedForm({
        tagline: featured.data.tagline || DEFAULT_FEATURED.tagline,
        title: featured.data.title || DEFAULT_FEATURED.title,
        description: featured.data.description || DEFAULT_FEATURED.description,
        background_image: featured.data.background_image || "",
        buttons: migrated,
      });
    }
  }, [featured.data, allCondos]);

  const addFeaturedButton = () => {
    setFeaturedForm((prev) => ({
      ...prev,
      buttons: [...prev.buttons, { label: "", condominium: "" }],
    }));
  };

  const removeFeaturedButton = (i: number) => {
    setFeaturedForm((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((_, idx) => idx !== i),
    }));
  };

  const updateFeaturedButton = (i: number, field: "label" | "condominium", val: string) => {
    setFeaturedForm((prev) => ({
      ...prev,
      buttons: prev.buttons.map((b, idx) => {
        if (idx !== i) return b;
        // When selecting condominium, drop legacy href.
        if (field === "condominium") {
          const { href: _drop, ...rest } = b;
          return { ...rest, condominium: val };
        }
        return { ...b, [field]: val };
      }),
    }));
  };


  // ── Properties list ──
  const { data: properties } = useQuery({
    queryKey: ["properties-list-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id, code, title, photos").order("title");
      return data ?? [];
    },
  });

  // ── Lifestyle ──
  const lifestyle = useSiteSettings<{ categories: LifestyleCategory[] }>("lifestyle_categories");
  const [lifestyleForm, setLifestyleForm] = useState<LifestyleCategory[]>([]);
  useEffect(() => {
    if (lifestyle.data?.categories) {
      setLifestyleForm(lifestyle.data.categories.map((c: any) => ({
        title: c.title || "",
        image: c.image || "",
        tag: c.tag || "",
      })));
    }
  }, [lifestyle.data]);

  const updateLifestyle = (i: number, field: keyof LifestyleCategory, val: string) => {
    setLifestyleForm((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: val } : c)));
  };

  // ── Team ──
  const team = useSiteSettings<{ members: TeamMember[] }>("team");
  const [teamForm, setTeamForm] = useState<TeamMember[]>([]);
  useEffect(() => { if (team.data?.members) setTeamForm(team.data.members); }, [team.data]);

  const updateTeam = (i: number, field: keyof TeamMember, val: string) => {
    setTeamForm((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)));
  };

  // ── Contact ──
  const contact = useSiteSettings<ContactSettings>("contact");
  const [contactForm, setContactForm] = useState<ContactSettings>({ phone: "", email: "", instagram: "", address: "" });
  useEffect(() => { if (contact.data) setContactForm(contact.data); }, [contact.data]);

  // ── Instagram Posts ──
  interface InstaPostForm { url: string; thumbnail: string; status: 'pending' | 'success' | 'failed' }
  const instaPosts = useSiteSettings<{ posts: InstaPostForm[] }>("instagram_posts");
  const emptyInstaSlots: InstaPostForm[] = Array.from({ length: 6 }, () => ({ url: "", thumbnail: "", status: "pending" as const }));
  const [instaForm, setInstaForm] = useState<InstaPostForm[]>(emptyInstaSlots);
  const [scrapingInsta, setScrapingInsta] = useState(false);

  useEffect(() => {
    if (instaPosts.data?.posts) {
      const loaded = instaPosts.data.posts;
      setInstaForm(Array.from({ length: 6 }, (_, i) => loaded[i] || { url: "", thumbnail: "", status: "pending" }));
    }
  }, [instaPosts.data]);

  const updateInstaField = (i: number, field: keyof InstaPostForm, val: string) => {
    setInstaForm((prev) => prev.map((p, idx) => {
      if (idx !== i) return p;
      if (field === "url") return { ...p, url: val, thumbnail: "", status: "pending" as const };
      return { ...p, [field]: val };
    }));
  };

  const scrapeInstaThumbnails = async (posts: InstaPostForm[]): Promise<InstaPostForm[]> => {
    const urlsToScrape = posts.filter(p => p.url.trim() && !p.thumbnail.trim()).map(p => p.url);
    if (urlsToScrape.length === 0) return posts;

    setScrapingInsta(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-instagram-thumbnail", {
        body: { urls: urlsToScrape },
      });
      if (error) throw error;

      const resultMap = new Map<string, string | null>();
      (data.results || []).forEach((r: { url: string; thumbnail: string | null }) => {
        resultMap.set(r.url, r.thumbnail);
      });

      return posts.map(p => {
        if (!p.url.trim()) return p;
        if (p.thumbnail.trim()) return { ...p, status: "success" as const };
        const thumb = resultMap.get(p.url);
        return thumb
          ? { ...p, thumbnail: thumb, status: "success" as const }
          : { ...p, status: "failed" as const };
      });
    } catch {
      return posts.map(p => p.url.trim() && !p.thumbnail.trim() ? { ...p, status: "failed" as const } : p);
    } finally {
      setScrapingInsta(false);
    }
  };

  const handleSaveInsta = async () => {
    const scraped = await scrapeInstaThumbnails(instaForm);
    setInstaForm(scraped);
    instaPosts.save({ posts: scraped });
  };

  const handleReloadThumbnails = async () => {
    const reset = instaForm.map(p => ({ ...p, thumbnail: "", status: "pending" as const }));
    const scraped = await scrapeInstaThumbnails(reset);
    setInstaForm(scraped);
    instaPosts.save({ posts: scraped });
  };

  // ── Condo Menu ──
  const condoMenu = useSiteSettings<CondoMenuSettings>("condo_menu");
  const [condoMenuForm, setCondoMenuForm] = useState<CondoMenuSettings>({ featured: [], regions: [] });
  useEffect(() => {
    if (condoMenu.data) {
      setCondoMenuForm({
        featured: condoMenu.data.featured || [],
        regions: condoMenu.data.regions || []
      });
    }
  }, [condoMenu.data]);

  const addCondoFeatured = () => {
    setCondoMenuForm(prev => ({
      ...prev,
      featured: [...prev.featured, { name: "", href: "", image: "" }]
    }));
  };

  const removeCondoFeatured = (i: number) => {
    setCondoMenuForm(prev => ({
      ...prev,
      featured: prev.featured.filter((_, idx) => idx !== i)
    }));
  };

  const updateCondoFeatured = (i: number, field: keyof CondoLink, val: string) => {
    setCondoMenuForm(prev => ({
      ...prev,
      featured: prev.featured.map((item, idx) => idx === i ? { ...item, [field]: val } : item)
    }));
  };

  const addCondoRegion = () => {
    setCondoMenuForm(prev => ({
      ...prev,
      regions: [...prev.regions, { title: "", links: [] }]
    }));
  };

  const removeCondoRegion = (i: number) => {
    setCondoMenuForm(prev => ({
      ...prev,
      regions: prev.regions.filter((_, idx) => idx !== i)
    }));
  };

  const updateCondoRegionTitle = (i: number, title: string) => {
    setCondoMenuForm(prev => ({
      ...prev,
      regions: prev.regions.map((reg, idx) => idx === i ? { ...reg, title } : reg)
    }));
  };

  const addCondoRegionLink = (regIndex: number) => {
    setCondoMenuForm(prev => ({
      ...prev,
      regions: prev.regions.map((reg, idx) => 
        idx === regIndex ? { ...reg, links: [...reg.links, { name: "", href: "" }] } : reg
      )
    }));
  };

  const removeCondoRegionLink = (regIndex: number, linkIndex: number) => {
    setCondoMenuForm(prev => ({
      ...prev,
      regions: prev.regions.map((reg, idx) => 
        idx === regIndex ? { ...reg, links: reg.links.filter((_, lIdx) => lIdx !== linkIndex) } : reg
      )
    }));
  };

  const updateCondoRegionLink = (regIndex: number, linkIndex: number, field: keyof CondoLink, val: string) => {
    setCondoMenuForm(prev => ({
      ...prev,
      regions: prev.regions.map((reg, idx) => 
        idx === regIndex ? { 
          ...reg, 
          links: reg.links.map((link, lIdx) => lIdx === linkIndex ? { ...link, [field]: val } : link) 
        } : reg
      )
    }));
  };

  // ── Footer ──
  const footer = useSiteSettings<FooterSettings>("footer");
  const [footerForm, setFooterForm] = useState<FooterSettings>({ copyright_text: "", tagline: "" });
  useEffect(() => { if (footer.data) setFooterForm(footer.data); }, [footer.data]);

  // ── Helper: render headline with italic ──
  const renderHeadline = (text: string) => {
    const parts = text.split(/\*(.*?)\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <em key={i} className="italic">{part}</em> : <span key={i}>{part}</span>
    );
  };

  // Slide ativo no preview (clamp defensivo)
  const previewSlide = heroForm.slides[Math.min(activePreviewSlide, heroForm.slides.length - 1)];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[Raleway] text-2xl font-semibold tracking-tight text-foreground">Identidade & Marca</h1>
          <p className="font-[Inter] text-sm text-muted-foreground mt-1">Personalize a aparência e conteúdo do site público.</p>
        </div>
        <Avatar className="h-8 w-8 border border-border/50">
          <AvatarFallback className="bg-muted text-xs">
            <User className="h-3.5 w-3.5" />
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Settings blocks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Block 1: Hero — Multi-slide editorial banners */}
          <SettingsBlock title="Homepage Hero" onSave={() => hero.save(heroForm)} isSaving={hero.isSaving}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-[Inter] text-xs text-muted-foreground">
                  Banners do topo ({heroForm.slides.length}/5) — exibidos em rotação
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSlide}
                  disabled={heroForm.slides.length >= 5}
                  className="h-8 text-xs rounded-sm border-border/50 gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar banner
                </Button>
              </div>

              {heroForm.slides.length === 0 ? (
                <div className="border border-dashed border-border/50 rounded-sm p-8 text-center text-xs text-muted-foreground">
                  Nenhum banner configurado. Clique em "Adicionar banner" para começar.
                </div>
              ) : (
                <div className="space-y-3">
                  {heroForm.slides.map((slide, i) => (
                    <HeroSlideEditor
                      key={slide.id}
                      slide={slide}
                      index={i}
                      total={heroForm.slides.length}
                      onChange={(next) => updateSlide(i, next)}
                      onRemove={() => removeSlide(i)}
                      onMove={(dir) => moveSlide(i, dir)}
                    />
                  ))}
                </div>
              )}
            </div>
          </SettingsBlock>

          {/* Block 1.5: Homepage Featured Properties Carousel */}
          <SettingsBlock
            title='Carrossel "Nossas propriedades especiais"'
            onSave={() => homeFeatured.save({ property_ids: homeFeaturedIds })}
            isSaving={homeFeatured.isSaving}
          >
            <p className="font-[Inter] text-xs text-muted-foreground -mt-1">
              Selecione até 12 imóveis para destacar no carrossel da página inicial. Se nenhum for selecionado,
              os 12 mais recentes (com foto) serão exibidos automaticamente.
            </p>
            <PropertyMultiSelect
              selectedIds={homeFeaturedIds}
              onChange={setHomeFeaturedIds}
              properties={properties ?? []}
              max={12}
            />
          </SettingsBlock>

          {/* Block 1.6: Homepage Carousel 2 */}
          <SettingsBlock
            title="Carrossel Adicional 1"
            onSave={() => carousel2.save(carousel2Form)}
            isSaving={carousel2.isSaving}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-border/30 rounded-sm bg-muted/5">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Ativar carrossel na Home</Label>
                  <p className="text-xs text-muted-foreground">Exibir esta seção na página inicial</p>
                </div>
                <Switch
                  checked={carousel2Form.is_active}
                  onCheckedChange={(checked) => setCarousel2Form({ ...carousel2Form, is_active: checked })}
                />
              </div>
              
              <div>
                <Label className="font-[Inter] text-xs text-muted-foreground">Título da Seção</Label>
                <Input
                  value={carousel2Form.title}
                  onChange={(e) => setCarousel2Form({ ...carousel2Form, title: e.target.value })}
                  placeholder="Ex: Oportunidades Únicas"
                  className="mt-1 h-9 text-sm border-border/50"
                />
              </div>

              <PropertyMultiSelect
                selectedIds={carousel2Form.property_ids || []}
                onChange={(ids) => setCarousel2Form({ ...carousel2Form, property_ids: ids })}
                properties={properties ?? []}
                max={12}
              />
            </div>
          </SettingsBlock>

          {/* Block 1.7: Homepage Carousel 3 */}
          <SettingsBlock
            title="Carrossel Adicional 2"
            onSave={() => carousel3.save(carousel3Form)}
            isSaving={carousel3.isSaving}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-border/30 rounded-sm bg-muted/5">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Ativar carrossel na Home</Label>
                  <p className="text-xs text-muted-foreground">Exibir esta seção na página inicial</p>
                </div>
                <Switch
                  checked={carousel3Form.is_active}
                  onCheckedChange={(checked) => setCarousel3Form({ ...carousel3Form, is_active: checked })}
                />
              </div>
              
              <div>
                <Label className="font-[Inter] text-xs text-muted-foreground">Título da Seção</Label>
                <Input
                  value={carousel3Form.title}
                  onChange={(e) => setCarousel3Form({ ...carousel3Form, title: e.target.value })}
                  placeholder="Ex: Destaques da Semana"
                  className="mt-1 h-9 text-sm border-border/50"
                />
              </div>

              <PropertyMultiSelect
                selectedIds={carousel3Form.property_ids || []}
                onChange={(ids) => setCarousel3Form({ ...carousel3Form, property_ids: ids })}
                properties={properties ?? []}
                max={12}
              />
            </div>
          </SettingsBlock>

          {/* Block 2: Design Tokens */}
          <SettingsBlock
            title="Design System"
            onSave={() => tokens.save(tokensForm)}
            isSaving={tokens.isSaving}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ColorField label="Cor de Acento" value={tokensForm.accent_color} onChange={(v) => setTokensForm({ ...tokensForm, accent_color: v })} />
              <ColorField label="Cor de Fundo" value={tokensForm.background_color} onChange={(v) => setTokensForm({ ...tokensForm, background_color: v })} />
              <ColorField label="Cor Secundária" value={tokensForm.secondary_color} onChange={(v) => setTokensForm({ ...tokensForm, secondary_color: v })} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground gap-1.5 mt-2"
              onClick={() => setTokensForm(DEFAULT_TOKENS)}
            >
              <RotateCcw className="h-3 w-3" />
              Resetar Padrão
            </Button>
          </SettingsBlock>

          {/* Block 2.5: Condo Mega Menu */}
          <SettingsBlock title="Menu de Condomínios (Cabeçalho)" onSave={() => condoMenu.save(condoMenuForm)} isSaving={condoMenu.isSaving}>
            <div className="space-y-6">
              {/* Featured Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-[Inter] text-xs font-semibold uppercase tracking-wider text-muted-foreground">Condomínios Destaque (Coluna 1)</Label>
                  <Button variant="outline" size="sm" onClick={addCondoFeatured} className="h-7 text-[10px] gap-1 px-2">
                    <Plus className="h-3 w-3" /> Adicionar Destaque
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {condoMenuForm.featured.map((item, i) => (
                    <div key={i} className="border border-border/30 rounded-sm p-3 space-y-3 bg-muted/5 relative">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 absolute top-1 right-1 text-muted-foreground hover:text-destructive" 
                        onClick={() => removeCondoFeatured(i)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <div>
                        <Label className="text-[10px] text-muted-foreground uppercase">Nome</Label>
                        <Input 
                          value={item.name} 
                          onChange={(e) => updateCondoFeatured(i, "name", e.target.value)} 
                          className="h-8 text-xs mt-1" 
                          placeholder="Ex: Tamboré 3"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground uppercase">Link</Label>
                        <Input 
                          value={item.href} 
                          onChange={(e) => updateCondoFeatured(i, "href", e.target.value)} 
                          className="h-8 text-xs mt-1" 
                          placeholder="/busca?condominio=..."
                        />
                      </div>
                      <PhotoDrop 
                        label="Imagem (opcional)" 
                        value={item.image || ""} 
                        onUpload={(url) => updateCondoFeatured(i, "image", url)} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground/70 italic">
                A coluna "Por Condomínio" do mega menu é gerada automaticamente a partir dos imóveis ativos cadastrados, agrupando nomes com sufixo numérico (ex.: Alphaville 1, 2, 3…).
              </p>

            </div>
          </SettingsBlock>

          {/* Block 3: Featured Banner */}
          <SettingsBlock title="Banner de Destaque (Condomínios)" onSave={() => featured.save(featuredForm)} isSaving={featured.isSaving}>
            <div className="space-y-4">
              <div>
                <Label className="font-[Inter] text-xs text-muted-foreground">Tagline</Label>
                <Input
                  value={featuredForm.tagline}
                  onChange={(e) => setFeaturedForm({ ...featuredForm, tagline: e.target.value })}
                  placeholder="Conheça os condomínios"
                  className="mt-1 h-9 text-sm border-border/50"
                />
              </div>
              <div>
                <Label className="font-[Inter] text-xs text-muted-foreground">
                  Título <span className="text-muted-foreground/50">— use *asteriscos* para itálico</span>
                </Label>
                <Input
                  value={featuredForm.title}
                  onChange={(e) => setFeaturedForm({ ...featuredForm, title: e.target.value })}
                  placeholder="As propriedades mais que especiais em *Alphaville*"
                  className="mt-1 h-9 text-sm border-border/50"
                />
              </div>
              <div>
                <Label className="font-[Inter] text-xs text-muted-foreground">Descrição</Label>
                <Textarea
                  value={featuredForm.description}
                  onChange={(e) => setFeaturedForm({ ...featuredForm, description: e.target.value })}
                  placeholder="Descubra os melhores condomínios..."
                  className="mt-1 text-sm border-border/50 min-h-[50px]"
                />
              </div>
              <PhotoDrop
                label="Imagem de fundo"
                value={featuredForm.background_image}
                onUpload={(url) => setFeaturedForm({ ...featuredForm, background_image: url })}
              />
              <div>
                <Label className="font-[Inter] text-xs text-muted-foreground mb-2 block">Botões de condomínio</Label>
                <p className="text-[10px] text-muted-foreground/70 mb-2 leading-snug">
                  O título do botão é livre. O link é montado automaticamente a partir do condomínio selecionado, garantindo que a busca abra com o filtro correto.
                </p>
                <div className="space-y-2">
                  {featuredForm.buttons.map((btn, i) => {
                    const hasDestination = !!btn.condominium;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Input
                            value={btn.label}
                            onChange={(e) => updateFeaturedButton(i, "label", e.target.value)}
                            placeholder="Texto do botão (ex.: Tamboré I)"
                            className="h-8 text-sm border-border/50 flex-1"
                          />
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "h-8 text-sm border-border/50 flex-1 justify-between font-normal",
                                  !hasDestination && "text-muted-foreground"
                                )}
                              >
                                <span className="truncate">
                                  {btn.condominium || "Selecione o condomínio"}
                                </span>
                                <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-2" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[280px] p-0" align="start">
                              <Command
                                filter={(value, search) => {
                                  const q = normalizeCondoTokens(search);
                                  if (!q.length) return 1;
                                  const tokens = new Set(normalizeCondoTokens(value));
                                  return q.every((t) => [...tokens].some((c) => c.includes(t))) ? 1 : 0;
                                }}
                              >
                                <CommandInput placeholder="Buscar condomínio..." className="h-9" />

                                <CommandList>
                                  <CommandEmpty>Nenhum condomínio encontrado.</CommandEmpty>
                                  <CommandGroup>
                                    {allCondos.map((name) => (
                                      <CommandItem
                                        key={name}
                                        value={name}
                                        onSelect={() => updateFeaturedButton(i, "condominium", name)}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-3.5 w-3.5",
                                            btn.condominium === name ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeFeaturedButton(i)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {!hasDestination && (
                          <p className="text-[10px] text-amber-700/80 pl-1">
                            Selecione um condomínio para este botão ficar ativo.
                          </p>
                        )}
                      </div>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 border-border/50 rounded-sm"
                    onClick={addFeaturedButton}
                  >
                    <Plus className="h-3 w-3" />
                    Adicionar Botão
                  </Button>
                </div>
              </div>
            </div>
          </SettingsBlock>

          {/* Block 4: Lifestyle Categories */}
          <SettingsBlock title="Categorias de Lifestyle" onSave={() => lifestyle.save({ categories: lifestyleForm })} isSaving={lifestyle.isSaving}>
            <div className="space-y-4">
              {lifestyleForm.map((cat, i) => (
                <div key={i} className="border border-border/30 rounded-sm p-3 space-y-2">
                  <div>
                    <Label className="font-[Inter] text-xs text-muted-foreground">Título</Label>
                    <Input value={cat.title} onChange={(e) => updateLifestyle(i, "title", e.target.value)} className="mt-1 h-8 text-sm border-border/50" />
                  </div>
                  <div>
                    <Label className="font-[Inter] text-xs text-muted-foreground">Tag de filtro</Label>
                    <Input
                      value={cat.tag}
                      onChange={(e) => updateLifestyle(i, "tag", e.target.value)}
                      placeholder="ex: refugio, assinado, familia"
                      className="mt-1 h-8 text-sm border-border/50"
                    />
                    <p className="text-[10px] text-muted-foreground/70 mt-1 leading-snug">
                      Card direciona para <span className="font-mono">/busca?tag={cat.tag || "sua-tag"}</span>. Marque essa mesma palavra em <span className="font-medium">Destaques de Engenharia</span> ao cadastrar um imóvel para que ele apareça neste filtro.
                    </p>
                  </div>
                  <PhotoDrop label="Imagem" value={cat.image} onUpload={(url) => updateLifestyle(i, "image", url)} />
                </div>
              ))}
            </div>
          </SettingsBlock>

          {/* Block 5: Team */}
          <SettingsBlock title="Equipe / Sócios" onSave={() => team.save({ members: teamForm })} isSaving={team.isSaving}>
            <div className="space-y-4">
              {teamForm.map((m, i) => (
                <div key={i} className="border border-border/30 rounded-sm p-3 space-y-2">
                  <div className="flex items-start gap-3">
                    <PhotoDrop label="" value={m.photo} onUpload={(url) => updateTeam(i, "photo", url)} />
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="font-[Inter] text-xs text-muted-foreground">Nome</Label>
                          <Input value={m.name} onChange={(e) => updateTeam(i, "name", e.target.value)} className="mt-1 h-8 text-sm border-border/50" />
                        </div>
                        <div>
                          <Label className="font-[Inter] text-xs text-muted-foreground">Cargo</Label>
                          <Input value={m.role} onChange={(e) => updateTeam(i, "role", e.target.value)} className="mt-1 h-8 text-sm border-border/50" />
                        </div>
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label className="font-[Inter] text-xs text-muted-foreground">CRECI</Label>
                          <Input value={m.creci} onChange={(e) => updateTeam(i, "creci", e.target.value)} className="mt-1 h-8 text-sm border-border/50" />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setTeamForm((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 border-border/50 rounded-sm"
                onClick={() => setTeamForm((prev) => [...prev, { name: "", role: "", creci: "", photo: "" }])}
              >
                <Plus className="h-3 w-3" />
                Adicionar Membro
              </Button>
            </div>
          </SettingsBlock>

          {/* Block 6: Contact */}
          <SettingsBlock title="Contato e Redes" onSave={() => contact.save(contactForm)} isSaving={contact.isSaving}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-[Inter] text-xs text-muted-foreground">Telefone</Label>
                <Input
                  value={contactForm.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                    let masked = digits;
                    if (digits.length > 2) masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                    if (digits.length > 7) masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                    setContactForm({ ...contactForm, phone: masked });
                  }}
                  placeholder="(11) 99999-9999"
                  className="mt-1 h-9 text-sm border-border/50"
                />
              </div>
              <div>
                <Label className="font-[Inter] text-xs text-muted-foreground">E-mail</Label>
                <Input value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="mt-1 h-9 text-sm border-border/50" />
              </div>
              <div>
                <Label className="font-[Inter] text-xs text-muted-foreground">Instagram</Label>
                <Input value={contactForm.instagram} onChange={(e) => setContactForm({ ...contactForm, instagram: e.target.value })} placeholder="@" className="mt-1 h-9 text-sm border-border/50" />
              </div>
              <div>
                <Label className="font-[Inter] text-xs text-muted-foreground">Endereço</Label>
                <Input value={contactForm.address} onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })} className="mt-1 h-9 text-sm border-border/50" />
              </div>
            </div>
          </SettingsBlock>

          {/* Block 7: Instagram Posts */}
          <SettingsBlock title="Destaques Social" onSave={handleSaveInsta} isSaving={instaPosts.isSaving || scrapingInsta}>
            <p className="font-[Inter] text-xs text-muted-foreground -mt-2 mb-1">
              Insira as URLs de até 6 postagens do Instagram. A thumbnail será capturada automaticamente.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground gap-1.5 mb-3"
              onClick={handleReloadThumbnails}
              disabled={scrapingInsta}
            >
              {scrapingInsta ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Recarregar Thumbnails
            </Button>
            <div className="grid grid-cols-2 gap-4">
              {instaForm.map((post, i) => (
                <div key={i} className="border border-border/30 rounded-sm p-3 space-y-2">
                  <Label className="font-[Inter] text-xs text-muted-foreground">Post {i + 1}</Label>
                  <Input
                    value={post.url}
                    onChange={(e) => updateInstaField(i, "url", e.target.value)}
                    placeholder="https://www.instagram.com/p/..."
                    className="h-9 text-sm border-border/50"
                  />
                  <div className="flex items-center gap-2">
                    {post.thumbnail ? (
                      <>
                        <img src={post.thumbnail} alt="" className="w-12 h-12 object-cover rounded-sm border border-border/30" />
                        <Badge variant="outline" className="text-[10px] gap-1 border-emerald-200 text-emerald-700 bg-emerald-50">
                          <CheckCircle2 className="h-3 w-3" /> Capturado
                        </Badge>
                      </>
                    ) : post.url.trim() && post.status === "failed" ? (
                      <Badge variant="outline" className="text-[10px] gap-1 border-red-200 text-red-700 bg-red-50">
                        <AlertCircle className="h-3 w-3" /> Falhou — envie manualmente
                      </Badge>
                    ) : post.url.trim() ? (
                      <Badge variant="outline" className="text-[10px] gap-1 border-amber-200 text-amber-700 bg-amber-50">
                        <Loader2 className="h-3 w-3" /> Pendente
                      </Badge>
                    ) : null}
                  </div>
                  {post.url.trim() && post.status === "failed" && !post.thumbnail && (
                    <PhotoDrop
                      label="Subir Imagem Manualmente"
                      value={post.thumbnail}
                      onUpload={(url) => {
                        setInstaForm((prev) => prev.map((p, idx) => idx === i ? { ...p, thumbnail: url, status: "success" as const } : p));
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </SettingsBlock>

          {/* Block 8: Footer */}
          <SettingsBlock title="Rodapé" onSave={() => footer.save(footerForm)} isSaving={footer.isSaving}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-[Inter] text-xs text-muted-foreground">Copyright</Label>
                <Input value={footerForm.copyright_text} onChange={(e) => setFooterForm({ ...footerForm, copyright_text: e.target.value })} className="mt-1 h-9 text-sm border-border/50" />
              </div>
              <div>
                <Label className="font-[Inter] text-xs text-muted-foreground">Tagline</Label>
                <Input value={footerForm.tagline} onChange={(e) => setFooterForm({ ...footerForm, tagline: e.target.value })} className="mt-1 h-9 text-sm border-border/50" />
              </div>
            </div>
          </SettingsBlock>
        </div>

        {/* Right: Mini Preview */}
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <Card className="bg-white border-border/50 shadow-none rounded-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="font-[Raleway] text-sm font-semibold tracking-tight">Mini Preview</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full overflow-hidden rounded-b-sm" style={{ height: 500 }}>
                  <div
                    className="origin-top-left"
                    style={{
                      transform: "scale(0.32)",
                      width: "312.5%",
                      height: "312.5%",
                    }}
                  >
                    {/* Simulated hero — multi-slide */}
                    <div className="h-[400px] relative overflow-hidden bg-black">
                      {previewSlide?.media_url ? (
                        previewSlide.media_type === "video" ? (
                          <video
                            src={previewSlide.media_url}
                            muted
                            playsInline
                            poster={previewSlide.poster_url}
                            className="absolute inset-0 w-full h-full object-cover opacity-80"
                          />
                        ) : (
                          <img
                            src={previewSlide.media_url}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover opacity-80"
                          />
                        )
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="relative z-10 h-full flex flex-col justify-end p-8">
                        <p className="font-[Inter] text-xs tracking-[0.3em] uppercase text-white/60 mb-2">
                          {previewSlide?.tagline || ""}
                        </p>
                        <h2 className="font-[Raleway] text-3xl font-light text-white leading-tight">
                          {previewSlide ? renderHeadline(previewSlide.title) : null}
                        </h2>
                        {previewSlide?.subtitle && (
                          <p className="text-sm text-white/70 mt-2 max-w-md">{previewSlide.subtitle}</p>
                        )}
                        {previewSlide?.cta_label && (
                          <span className="inline-block mt-4 px-4 py-2 text-[10px] tracking-widest uppercase text-white border border-white/30 rounded-full self-start" style={{ backgroundColor: "#2A070C" }}>
                            {previewSlide.cta_label}
                          </span>
                        )}
                        {heroForm.slides.length > 1 && (
                          <div className="flex gap-2 mt-4">
                            {heroForm.slides.map((s, i) => (
                              <button
                                key={s.id}
                                onClick={() => setActivePreviewSlide(i)}
                                className={`h-1.5 rounded-full transition-all ${i === activePreviewSlide ? "bg-white w-6" : "bg-white/40 w-1.5"}`}
                                aria-label={`Visualizar slide ${i + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>


                    {/* Simulated featured banner */}
                    <div className="h-[250px] relative overflow-hidden">
                      {featuredForm.background_image ? (
                        <img src={featuredForm.background_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
                      )}
                      <div className="absolute inset-0 bg-[hsl(350,60%,5%)]/80" />
                      <div className="relative z-10 flex flex-col items-center justify-center text-center h-full p-6">
                        <p className="font-[Inter] text-[10px] tracking-[0.3em] uppercase text-white/50 mb-2">
                          {featuredForm.tagline}
                        </p>
                        <h3 className="font-[Raleway] text-2xl font-light text-white">
                          {renderHeadline(featuredForm.title)}
                        </h3>
                        <div className="flex gap-2 mt-4">
                          {featuredForm.buttons.map((btn, i) => (
                            <span key={i} className="text-[9px] tracking-widest uppercase px-3 py-1.5 border border-white/30 text-white">
                              {btn.label || "..."}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Simulated lifestyle */}
                    <div className="p-8" style={{ backgroundColor: tokensForm.background_color }}>
                      <h3 className="font-[Raleway] text-xl font-semibold mb-4" style={{ color: tokensForm.accent_color }}>
                        Navegue pelo seu estilo de vida
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {lifestyleForm.map((cat, i) => (
                          <div key={i} className="rounded-sm overflow-hidden" style={{ border: `1px solid ${tokensForm.secondary_color}30` }}>
                            {cat.image ? (
                              <img src={cat.image} alt="" className="h-24 w-full object-cover" />
                            ) : (
                              <div className="h-24 bg-muted/20" />
                            )}
                            <div className="p-2">
                              <p className="font-[Raleway] text-sm font-medium" style={{ color: tokensForm.accent_color }}>{cat.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Simulated team */}
                    <div className="p-8" style={{ backgroundColor: "#fff" }}>
                      <h3 className="font-[Raleway] text-xl font-semibold mb-4" style={{ color: tokensForm.accent_color }}>
                        Nossa Equipe
                      </h3>
                      <div className="flex gap-6">
                        {teamForm.map((m, i) => (
                          <div key={i} className="text-center">
                            {m.photo ? (
                              <img src={m.photo} alt="" className="h-16 w-16 rounded-full object-cover mx-auto mb-2" />
                            ) : (
                              <div className="h-16 w-16 rounded-full bg-muted/30 mx-auto mb-2 flex items-center justify-center">
                                <User className="h-6 w-6 text-muted-foreground/40" />
                              </div>
                            )}
                            <p className="font-[Raleway] text-sm font-medium" style={{ color: tokensForm.accent_color }}>{m.name}</p>
                            <p className="font-[Inter] text-xs" style={{ color: tokensForm.secondary_color }}>{m.role}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteSettings;
