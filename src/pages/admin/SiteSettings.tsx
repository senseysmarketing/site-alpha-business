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
import { Save, RotateCcw, Plus, Trash2, Upload, User, RefreshCw, CheckCircle2, AlertCircle, Loader2, X, GripVertical } from "lucide-react";
import { useDropzone } from "react-dropzone";

// ── Types ──────────────────────────────────────────
interface HeroSettings {
  tagline: string;
  headline: string;
  carousel_property_ids: string[];
}

interface DesignTokens {
  accent_color: string;
  background_color: string;
  secondary_color: string;
}

interface FeaturedBannerSettings {
  tagline: string;
  title: string;
  description: string;
  background_image: string;
  buttons: { label: string; href: string }[];
}

interface LifestyleCategory {
  title: string;
  image: string;
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

const DEFAULT_TOKENS: DesignTokens = {
  accent_color: "#2A070C",
  background_color: "#F5F0EB",
  secondary_color: "#8B7D6B",
};

const DEFAULT_HERO: HeroSettings = {
  tagline: "Prepare-se para sonhar alto",
  headline: "Se você está buscando *imóveis de luxo*, aqui é o seu lugar",
  carousel_property_ids: [],
};

const DEFAULT_FEATURED: FeaturedBannerSettings = {
  tagline: "Conheça os condomínios",
  title: "As propriedades mais que especiais em *Alphaville*",
  description: "Descubra os melhores condomínios da região e encontre o imóvel perfeito para o seu estilo de vida.",
  background_image: "",
  buttons: [
    { label: "Tamboré I", href: "/busca?condominio=tambore-1" },
    { label: "Tamboré II", href: "/busca?condominio=tambore-2" },
    { label: "Tamboré III", href: "/busca?condominio=tambore-3" },
  ],
};

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
  useEffect(() => {
    if (hero.data) {
      setHeroForm({
        tagline: hero.data.tagline || DEFAULT_HERO.tagline,
        headline: hero.data.headline || DEFAULT_HERO.headline,
        carousel_property_ids: hero.data.carousel_property_ids || [],
      });
    }
  }, [hero.data]);

  // ── Tokens ──
  const tokens = useSiteSettings<DesignTokens>("design_tokens");
  const [tokensForm, setTokensForm] = useState<DesignTokens>(DEFAULT_TOKENS);
  useEffect(() => { if (tokens.data) setTokensForm(tokens.data); }, [tokens.data]);

  useEffect(() => {
    document.documentElement.style.setProperty("--color-accent-preview", tokensForm.accent_color);
  }, [tokensForm.accent_color]);

  // ── Featured Banner ──
  const featured = useSiteSettings<FeaturedBannerSettings>("featured_banner");
  const [featuredForm, setFeaturedForm] = useState<FeaturedBannerSettings>(DEFAULT_FEATURED);
  useEffect(() => {
    if (featured.data) {
      setFeaturedForm({
        tagline: featured.data.tagline || DEFAULT_FEATURED.tagline,
        title: featured.data.title || DEFAULT_FEATURED.title,
        description: featured.data.description || DEFAULT_FEATURED.description,
        background_image: featured.data.background_image || "",
        buttons: featured.data.buttons?.length ? featured.data.buttons : DEFAULT_FEATURED.buttons,
      });
    }
  }, [featured.data]);

  const addFeaturedButton = () => {
    setFeaturedForm((prev) => ({
      ...prev,
      buttons: [...prev.buttons, { label: "", href: "" }],
    }));
  };

  const removeFeaturedButton = (i: number) => {
    setFeaturedForm((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((_, idx) => idx !== i),
    }));
  };

  const updateFeaturedButton = (i: number, field: "label" | "href", val: string) => {
    setFeaturedForm((prev) => ({
      ...prev,
      buttons: prev.buttons.map((b, idx) => (idx === i ? { ...b, [field]: val } : b)),
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

  // Get selected carousel properties for preview
  const carouselPreviewProperties = heroForm.carousel_property_ids
    .map((id) => properties?.find((p) => p.id === id))
    .filter(Boolean) as NonNullable<typeof properties>[number][];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[Raleway] text-xl font-semibold tracking-tight">Identidade & Marca</h1>
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
          {/* Block 1: Hero */}
          <SettingsBlock title="Homepage Hero" onSave={() => hero.save(heroForm)} isSaving={hero.isSaving}>
            <div className="space-y-4">
              <div>
                <Label className="font-[Inter] text-xs text-muted-foreground">Frase de apoio (tagline)</Label>
                <Input
                  value={heroForm.tagline}
                  onChange={(e) => setHeroForm({ ...heroForm, tagline: e.target.value })}
                  placeholder="Prepare-se para sonhar alto"
                  className="mt-1 h-9 text-sm border-border/50"
                />
              </div>
              <div>
                <Label className="font-[Inter] text-xs text-muted-foreground">
                  Título principal <span className="text-muted-foreground/50">— use *asteriscos* para itálico</span>
                </Label>
                <Textarea
                  value={heroForm.headline}
                  onChange={(e) => setHeroForm({ ...heroForm, headline: e.target.value })}
                  placeholder="Se você está buscando *imóveis de luxo*, aqui é o seu lugar"
                  className="mt-1 text-sm border-border/50 min-h-[60px]"
                />
              </div>
              <PropertyMultiSelect
                selectedIds={heroForm.carousel_property_ids}
                onChange={(ids) => setHeroForm({ ...heroForm, carousel_property_ids: ids })}
                properties={properties ?? []}
                max={5}
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
                <div className="space-y-2">
                  {featuredForm.buttons.map((btn, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={btn.label}
                        onChange={(e) => updateFeaturedButton(i, "label", e.target.value)}
                        placeholder="Label"
                        className="h-8 text-sm border-border/50 flex-1"
                      />
                      <Input
                        value={btn.href}
                        onChange={(e) => updateFeaturedButton(i, "href", e.target.value)}
                        placeholder="/busca?condominio=..."
                        className="h-8 text-sm border-border/50 flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFeaturedButton(i)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
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
                    {/* Simulated hero carousel */}
                    <div className="h-[400px] relative overflow-hidden bg-black">
                      {carouselPreviewProperties.length > 0 ? (
                        <img
                          src={carouselPreviewProperties[0].photos?.[0] || ""}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover opacity-70"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="relative z-10 h-full flex flex-col justify-end p-8">
                        <p className="font-[Inter] text-xs tracking-[0.3em] uppercase text-white/60 mb-2">
                          {heroForm.tagline}
                        </p>
                        <h2 className="font-[Raleway] text-3xl font-light text-white leading-tight">
                          {renderHeadline(heroForm.headline)}
                        </h2>
                        {carouselPreviewProperties.length > 0 && (
                          <div className="flex gap-2 mt-4">
                            {carouselPreviewProperties.map((_, i) => (
                              <div
                                key={i}
                                className={`h-1.5 rounded-full ${i === 0 ? "bg-white w-6" : "bg-white/40 w-1.5"}`}
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
