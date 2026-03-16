import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mic, Plus, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

const CONDOMINIUMS = ["Residencial 1", "Residencial 2", "Tamboré", "Alphaville 11", "Alphaville 0", "Outro"];

const PropertyForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basics");

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

  const handleMicClick = () => {
    toast({
      title: "Em breve",
      description: "Funcionalidade de transcrição por voz será integrada em breve.",
    });
  };

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
            <TabsTrigger value="basics" className="text-xs uppercase tracking-widest">Dados Básicos</TabsTrigger>
            <TabsTrigger value="photos" className="text-xs uppercase tracking-widest">Fotos & Vídeos</TabsTrigger>
            <TabsTrigger value="engineering" className="text-xs uppercase tracking-widest">Engenharia</TabsTrigger>
          </TabsList>

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
                <Select value={condominium} onValueChange={setCondominium}>
                  <SelectTrigger className={inputClass}><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {CONDOMINIUMS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {photos.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-md overflow-hidden border border-border/50">
                      <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
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
                <div className="relative">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-white border-border/50 font-[Inter] text-sm min-h-[120px] pr-12"
                    placeholder="Descreva o imóvel..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleMicClick}
                    className="absolute bottom-2 right-2 text-muted-foreground hover:text-foreground"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className={labelClass}>Destaques de Engenharia</Label>
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
