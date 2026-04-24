import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mic, MicOff, Plus, Sparkles, Trash2, Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SortablePhotoGrid } from "@/components/admin/property/SortablePhotoGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const CONDOMINIUMS = ["Residencial 1", "Residencial 2", "Tamboré", "Alphaville 11", "Alphaville 0", "Outro"];

const PropertyForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(isEditing ? "basics" : "ai");

  // Lifestyle tag suggestions (from site_settings.lifestyle_categories).
  const { data: lifestyleData } = useSiteSettings<{ categories: { title: string; tag?: string }[] }>("lifestyle_categories");
  const lifestyleTags = (lifestyleData?.categories ?? [])
    .map((c) => c.tag?.trim())
    .filter((t): t is string => !!t);

  // AI input
  const [aiText, setAiText] = useState("");
  const [aiProcessing, setAiProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Basic data
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [propertyType, setPropertyType] = useState("casa");
  const [transactionType, setTransactionType] = useState("venda");
  const [condominium, setCondominium] = useState("");
  const [address, setAddress] = useState("");
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [parkingSpots, setParkingSpots] = useState(0);
  const [areaTotal, setAreaTotal] = useState("");
  const [areaBuilt, setAreaBuilt] = useState("");
  const [price, setPrice] = useState("");
  const [rentalPrice, setRentalPrice] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  // Photos
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Engineering
  const [highlights, setHighlights] = useState<string[]>([""]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = "pt-BR";
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setAiText(transcript);
      };

      rec.onerror = () => {
        setIsListening(false);
        toast({ title: "Erro no microfone", description: "Não foi possível capturar áudio.", variant: "destructive" });
      };

      rec.onend = () => setIsListening(false);

      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      toast({ title: "Não suportado", description: "Seu navegador não suporta transcrição por voz.", variant: "destructive" });
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleAiProcess = async () => {
    if (!aiText.trim()) {
      toast({ title: "Descreva o imóvel", description: "Digite ou dite uma descrição antes de processar.", variant: "destructive" });
      return;
    }

    setAiProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-property", {
        body: { text: aiText },
      });

      if (error) throw error;

      // Fill form fields with AI response
      if (data.title) setTitle(data.title);
      if (data.code) setCode(data.code);
      if (data.description) setDescription(data.description);
      if (data.property_type) setPropertyType(data.property_type);
      if (data.transaction_type) setTransactionType(data.transaction_type);
      if (data.condominium) setCondominium(data.condominium);
      if (data.address) setAddress(data.address);
      if (data.bedrooms != null) setBedrooms(data.bedrooms);
      if (data.bathrooms != null) setBathrooms(data.bathrooms);
      if (data.parking_spots != null) setParkingSpots(data.parking_spots);
      if (data.area_total != null) setAreaTotal(String(data.area_total));
      if (data.area_built != null) setAreaBuilt(String(data.area_built));
      if (data.price != null) setPrice(String(data.price));
      if (data.rental_price != null) setRentalPrice(String(data.rental_price));
      if (data.engineering_highlights?.length) setHighlights(data.engineering_highlights);

      toast({ title: "Dados extraídos com sucesso", description: "Revise os campos preenchidos nas abas seguintes." });
      setActiveTab("basics");
    } catch (e: any) {
      const msg = e?.message || "Erro ao processar com IA";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setAiProcessing(false);
    }
  };

  // Load existing property
  useEffect(() => {
    if (!isEditing) return;
    const load = async () => {
      const { data } = await supabase.from("properties").select("*").eq("id", id).single();
      if (!data) return;
      setCode(data.code);
      setTitle(data.title);
      setDescription(data.description ?? "");
      setPropertyType(data.property_type);
      setTransactionType(data.transaction_type);
      setCondominium(data.condominium ?? "");
      setAddress(data.address ?? "");
      setBedrooms(data.bedrooms ?? 0);
      setBathrooms(data.bathrooms ?? 0);
      setParkingSpots(data.parking_spots ?? 0);
      setAreaTotal(data.area_total?.toString() ?? "");
      setAreaBuilt(data.area_built?.toString() ?? "");
      setPrice(data.price?.toString() ?? "");
      setRentalPrice(data.rental_price?.toString() ?? "");
      setIsFeatured(data.is_featured ?? false);
      setVideoUrl(data.video_url ?? "");
      setPhotos(data.photos ?? []);
      setHighlights(data.engineering_highlights?.length ? data.engineering_highlights : [""]);
    };
    load();
  }, [id, isEditing]);

  const handleSave = async () => {
    if (!code || !title) {
      toast({ title: "Preencha código e título", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      code,
      title,
      description: description || null,
      property_type: propertyType,
      transaction_type: transactionType,
      condominium: condominium || null,
      address: address || null,
      bedrooms,
      bathrooms,
      parking_spots: parkingSpots,
      area_total: areaTotal ? parseFloat(areaTotal) : null,
      area_built: areaBuilt ? parseFloat(areaBuilt) : null,
      price: price ? parseFloat(price) : null,
      rental_price: rentalPrice ? parseFloat(rentalPrice) : null,
      is_featured: isFeatured,
      video_url: videoUrl || null,
      photos,
      engineering_highlights: highlights.filter(Boolean),
    };

    const { error } = isEditing
      ? await supabase.from("properties").update(payload).eq("id", id)
      : await supabase.from("properties").insert(payload);

    setSaving(false);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: isEditing ? "Imóvel atualizado" : "Imóvel cadastrado" });
      navigate("/admin/imoveis");
    }
  };

  // Photo upload
  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true);
    const newPhotos: string[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${code || "temp"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from("property-photos").upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("property-photos").getPublicUrl(path);
        newPhotos.push(urlData.publicUrl);
      }
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
    setUploading(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }, [code]);

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Debounced persistence + cover-change toast for photo reorder/remove (edit mode only)
  const prevCoverRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isEditing || !id) return;
    const newCover = photos[0] ?? null;
    if (prevCoverRef.current !== null && newCover && prevCoverRef.current !== newCover) {
      toast({ title: "Nova capa do imóvel definida" });
    }
    prevCoverRef.current = newCover;

    const t = setTimeout(async () => {
      await supabase.from("properties").update({ photos }).eq("id", id);
    }, 1000);
    return () => clearTimeout(t);
  }, [photos, id, isEditing]);


  const inputClass = "h-10 bg-white border-border/50 font-[Inter] text-sm";
  const labelClass = "font-[Inter] text-xs uppercase tracking-widest text-muted-foreground";

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/imoveis")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-[Raleway] text-2xl font-semibold text-foreground tracking-tight">
            {isEditing ? "Editar Imóvel" : "Novo Imóvel"}
          </h1>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border/50 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-muted/30 font-[Inter]">
            {!isEditing && (
              <TabsTrigger value="ai" className="text-xs uppercase tracking-widest gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> IA
              </TabsTrigger>
            )}
            <TabsTrigger value="basics" className="text-xs uppercase tracking-widest">Dados Básicos</TabsTrigger>
            <TabsTrigger value="photos" className="text-xs uppercase tracking-widest">Fotos & Vídeos</TabsTrigger>
            <TabsTrigger value="engineering" className="text-xs uppercase tracking-widest">Engenharia</TabsTrigger>
          </TabsList>

          {/* Tab 0 — IA */}
          <TabsContent value="ai">
            <div className="space-y-6">
              <div className="text-center max-w-lg mx-auto mb-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#2A070C]/5 mb-4">
                  <Sparkles className="h-5 w-5 text-[#2A070C]/60" />
                </div>
                <h2 className="font-[Raleway] text-lg font-semibold text-foreground mb-1">Preenchimento Inteligente</h2>
                <p className="font-[Inter] text-sm text-muted-foreground">
                  Descreva o imóvel com suas palavras ou use o microfone. A IA extrairá os dados automaticamente.
                </p>
              </div>

              <div className="relative max-w-2xl mx-auto">
                <Textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  className="bg-white border-border/50 font-[Inter] text-sm min-h-[180px] pr-14 resize-none"
                  placeholder="Ex: Casa no Residencial 2, 4 suítes, 6 banheiros, 380m² construídos em terreno de 500m², piscina com raia, 4 vagas, preço de venda R$ 3.200.000. Acabamentos em mármore importado, automação completa..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleListening}
                  className={`absolute bottom-3 right-3 transition-colors ${
                    isListening
                      ? "text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>

              {isListening && (
                <div className="flex items-center justify-center gap-2 text-sm font-[Inter] text-red-500">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                  Ouvindo... fale agora
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  onClick={handleAiProcess}
                  disabled={aiProcessing || !aiText.trim()}
                  className="font-[Inter] text-xs uppercase tracking-widest gap-2"
                >
                  {aiProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Processar com IA
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Tab 1 — Dados Básicos */}
          <TabsContent value="basics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label className={labelClass}>Código *</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} placeholder="ALF-001" />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label className={labelClass}>Título *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Casa em Alphaville" />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Tipo</Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="apartamento">Apartamento</SelectItem>
                    <SelectItem value="terreno">Terreno</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Transação</Label>
                <Select value={transactionType} onValueChange={setTransactionType}>
                  <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venda">Venda</SelectItem>
                    <SelectItem value="locacao">Locação</SelectItem>
                    <SelectItem value="ambos">Venda e Locação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Condomínio</Label>
                <Input
                  value={condominium}
                  onChange={(e) => setCondominium(e.target.value)}
                  className={inputClass}
                  placeholder="Ex: Alphaville 4, Edifício Saint Paul"
                  list="condo-suggestions"
                />
                <datalist id="condo-suggestions">
                  {CONDOMINIUMS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label className={labelClass}>Endereço</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="Rua..." />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Quartos</Label>
                <Input type="number" value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))} className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Banheiros</Label>
                <Input type="number" value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))} className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Vagas</Label>
                <Input type="number" value={parkingSpots} onChange={(e) => setParkingSpots(Number(e.target.value))} className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Área Total (m²)</Label>
                <Input value={areaTotal} onChange={(e) => setAreaTotal(e.target.value)} className={inputClass} placeholder="500" />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Área Construída (m²)</Label>
                <Input value={areaBuilt} onChange={(e) => setAreaBuilt(e.target.value)} className={inputClass} placeholder="350" />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Preço Venda (R$)</Label>
                <Input value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} placeholder="2500000" />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Preço Locação (R$)</Label>
                <Input value={rentalPrice} onChange={(e) => setRentalPrice(e.target.value)} className={inputClass} placeholder="15000" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                <Label className="font-[Inter] text-sm text-foreground">Imóvel em destaque</Label>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2 — Fotos & Vídeos */}
          <TabsContent value="photos">
            <div className="space-y-6">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? "border-primary bg-primary/5" : "border-border/50"
                }`}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
                <p className="font-[Inter] text-sm text-muted-foreground mb-2">
                  Arraste fotos aqui ou clique para selecionar
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && uploadFiles(e.target.files)}
                  />
                  <Button variant="outline" size="sm" className="font-[Inter] text-xs" asChild>
                    <span>{uploading ? "Enviando..." : "Selecionar Arquivos"}</span>
                  </Button>
                </label>
              </div>

              {photos.length > 0 && (
                <SortablePhotoGrid
                  photos={photos}
                  onChange={setPhotos}
                  onRemove={removePhoto}
                />
              )}

              <div className="space-y-2">
                <Label className={labelClass}>URL do Vídeo Tour</Label>
                <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={inputClass} placeholder="https://youtube.com/..." />
              </div>
            </div>
          </TabsContent>

          {/* Tab 3 — Engenharia */}
          <TabsContent value="engineering">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className={labelClass}>Descrição</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-white border-border/50 font-[Inter] text-sm min-h-[120px]"
                  placeholder="Descreva o imóvel..."
                />
              </div>

              <div className="space-y-3">
                <Label className={labelClass}>Destaques de Engenharia</Label>
                {lifestyleTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    <span className="text-[10px] text-muted-foreground/80 self-center mr-1">
                      Tags de Lifestyle (clique para adicionar):
                    </span>
                    {lifestyleTags.map((t) => {
                      const already = highlights.some((h) => h.trim().toLowerCase() === t.toLowerCase());
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={already}
                          onClick={() => {
                            const empty = highlights.findIndex((h) => !h.trim());
                            if (empty >= 0) {
                              const copy = [...highlights];
                              copy[empty] = t;
                              setHighlights(copy);
                            } else {
                              setHighlights([...highlights, t]);
                            }
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                            already
                              ? "border-primary/40 bg-primary/10 text-primary cursor-default"
                              : "border-border/60 bg-background hover:border-primary/40 hover:bg-primary/5"
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                )}
                {highlights.map((h, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={h}
                      onChange={(e) => {
                        const copy = [...highlights];
                        copy[i] = e.target.value;
                        setHighlights(copy);
                      }}
                      className={inputClass + " flex-1"}
                      placeholder="Ex: Piso radiante em mármore importado"
                    />
                    {highlights.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => setHighlights(highlights.filter((_, j) => j !== i))}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setHighlights([...highlights, ""])} className="font-[Inter] text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Adicionar Destaque
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border/50">
          <Button variant="outline" onClick={() => navigate("/admin/imoveis")} className="font-[Inter] text-xs uppercase tracking-widest">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="font-[Inter] text-xs uppercase tracking-widest">
            {saving ? "Salvando..." : isEditing ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PropertyForm;
