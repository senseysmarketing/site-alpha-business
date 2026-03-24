import { useState, useEffect, useCallback } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Save, RotateCcw, Plus, Trash2, Upload, User } from "lucide-react";
import { useDropzone } from "react-dropzone";

// ── Types ──────────────────────────────────────────
interface HeroSettings {
  video_url: string;
  fallback_image: string;
  title: string;
  subtitle: string;
}

interface DesignTokens {
  accent_color: string;
  background_color: string;
  secondary_color: string;
}

interface FeaturedProperty {
  property_id: string;
  custom_label: string;
}

interface LifestyleCategory {
  title: string;
  subtitle: string;
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

// ── Main page ──────────────────────────────────────
const SiteSettings = () => {
  const { user } = useAuth();

  // ── Hero ──
  const hero = useSiteSettings<HeroSettings>("hero");
  const [heroForm, setHeroForm] = useState<HeroSettings>({ video_url: "", fallback_image: "", title: "", subtitle: "" });
  useEffect(() => { if (hero.data) setHeroForm(hero.data); }, [hero.data]);

  // ── Tokens ──
  const tokens = useSiteSettings<DesignTokens>("design_tokens");
  const [tokensForm, setTokensForm] = useState<DesignTokens>(DEFAULT_TOKENS);
  useEffect(() => { if (tokens.data) setTokensForm(tokens.data); }, [tokens.data]);

  // Live preview of tokens
  useEffect(() => {
    document.documentElement.style.setProperty("--color-accent-preview", tokensForm.accent_color);
  }, [tokensForm.accent_color]);

  // ── Featured property ──
  const featured = useSiteSettings<FeaturedProperty>("featured_property");
  const [featuredForm, setFeaturedForm] = useState<FeaturedProperty>({ property_id: "", custom_label: "Destaque" });
  useEffect(() => { if (featured.data) setFeaturedForm(featured.data); }, [featured.data]);

  const { data: properties } = useQuery({
    queryKey: ["properties-list"],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id, code, title").order("title");
      return data ?? [];
    },
  });

  // ── Lifestyle ──
  const lifestyle = useSiteSettings<{ categories: LifestyleCategory[] }>("lifestyle_categories");
  const [lifestyleForm, setLifestyleForm] = useState<LifestyleCategory[]>([]);
  useEffect(() => { if (lifestyle.data?.categories) setLifestyleForm(lifestyle.data.categories); }, [lifestyle.data]);

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
  const instaPosts = useSiteSettings<{ urls: string[] }>("instagram_posts");
  const [instaForm, setInstaForm] = useState<string[]>(["", "", "", "", "", ""]);
  useEffect(() => { if (instaPosts.data?.urls) setInstaForm(instaPosts.data.urls); }, [instaPosts.data]);

  const updateInstaUrl = (i: number, val: string) => {
    setInstaForm((prev) => prev.map((u, idx) => (idx === i ? val : u)));
  };

  // ── Footer ──
  const footer = useSiteSettings<FooterSettings>("footer");
  const [footerForm, setFooterForm] = useState<FooterSettings>({ copyright_text: "", tagline: "" });
  useEffect(() => { if (footer.data) setFooterForm(footer.data); }, [footer.data]);

  return (
    <div className="max-w-[1400px] mx-auto">
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
            <div className="space-y-3">
              <div>
                <Label className="font-[Inter] text-xs text-muted-foreground">URL do Vídeo 4K</Label>
                <Input
                  value={heroForm.video_url}
                  onChange={(e) => setHeroForm({ ...heroForm, video_url: e.target.value })}
                  placeholder="https://..."
                  className="mt-1 h-9 text-sm border-border/50"
                />
              </div>
              <PhotoDrop
                label="Imagem Fallback"
                value={heroForm.fallback_image}
                onUpload={(url) => setHeroForm({ ...heroForm, fallback_image: url })}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-[Inter] text-xs text-muted-foreground">Título <span className="text-muted-foreground/50">(vazio = não exibir)</span></Label>
                  <Input
                    value={heroForm.title}
                    onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                    placeholder="Ex: Viver é uma arte."
                    className="mt-1 h-9 text-sm border-border/50"
                  />
                </div>
                <div>
                  <Label className="font-[Inter] text-xs text-muted-foreground">Subtítulo <span className="text-muted-foreground/50">(vazio = não exibir)</span></Label>
                  <Input
                    value={heroForm.subtitle}
                    onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                    placeholder="Ex: Encontre sua obra-prima em Alphaville."
                    className="mt-1 h-9 text-sm border-border/50"
                  />
                </div>
              </div>
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

          {/* Block 3: Featured Property */}
          <SettingsBlock title="Imóvel de Destaque" onSave={() => featured.save(featuredForm)} isSaving={featured.isSaving}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-[Inter] text-xs text-muted-foreground">Imóvel</Label>
                <Select value={featuredForm.property_id} onValueChange={(v) => setFeaturedForm({ ...featuredForm, property_id: v })}>
                  <SelectTrigger className="mt-1 h-9 text-sm border-border/50">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {properties?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.code} — {p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-[Inter] text-xs text-muted-foreground">Label</Label>
                <Input
                  value={featuredForm.custom_label}
                  onChange={(e) => setFeaturedForm({ ...featuredForm, custom_label: e.target.value })}
                  className="mt-1 h-9 text-sm border-border/50"
                />
              </div>
            </div>
          </SettingsBlock>

          {/* Block 4: Lifestyle Categories */}
          <SettingsBlock title="Categorias de Lifestyle" onSave={() => lifestyle.save({ categories: lifestyleForm })} isSaving={lifestyle.isSaving}>
            <div className="space-y-4">
              {lifestyleForm.map((cat, i) => (
                <div key={i} className="border border-border/30 rounded-sm p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="font-[Inter] text-xs text-muted-foreground">Título</Label>
                      <Input value={cat.title} onChange={(e) => updateLifestyle(i, "title", e.target.value)} className="mt-1 h-8 text-sm border-border/50" />
                    </div>
                    <div>
                      <Label className="font-[Inter] text-xs text-muted-foreground">Subtítulo</Label>
                      <Input value={cat.subtitle} onChange={(e) => updateLifestyle(i, "subtitle", e.target.value)} className="mt-1 h-8 text-sm border-border/50" />
                    </div>
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

          {/* Block 7: Footer */}
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
                    {/* Simulated hero */}
                    <div
                      className="h-[400px] flex items-center justify-center relative"
                      style={{ backgroundColor: tokensForm.background_color }}
                    >
                      {heroForm.fallback_image && (
                        <img src={heroForm.fallback_image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                      )}
                      <div className="relative z-10 text-center px-8">
                        <h2 className="font-[Raleway] text-4xl font-light mb-2" style={{ color: tokensForm.accent_color }}>
                          {heroForm.title || "Viver é uma arte."}
                        </h2>
                        <p className="font-[Inter] text-lg" style={{ color: tokensForm.secondary_color }}>
                          {heroForm.subtitle || "Encontre sua obra-prima em Alphaville."}
                        </p>
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
                              <p className="font-[Inter] text-xs" style={{ color: tokensForm.secondary_color }}>{cat.subtitle}</p>
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
