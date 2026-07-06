import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, Pencil, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LUCIDE_ICON_NAMES, getLucideIcon, normalizeCondoName } from "@/lib/lucideIconMap";
import { fetchAllPropertyCondoRows } from "@/lib/propertyQueries";
import { useAuth } from "@/hooks/useAuth";


type Highlight = { icon: string; label: string };
type Condo = {
  id: string;
  name: string;
  region: string | null;
  city: string | null;
  description: string | null;
  highlights: Highlight[];
  cover_image: string | null;
  is_active: boolean;
};

const emptyCondo = (): Condo => ({
  id: "",
  name: "",
  region: "",
  city: "",
  description: "",
  highlights: [],
  cover_image: null,
  is_active: true,
});

const Condominiums = () => {
  const [items, setItems] = useState<Condo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Condo | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("condominiums" as never)
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } else {
      setItems(((data ?? []) as any[]).map((c) => ({
        ...c,
        highlights: Array.isArray(c.highlights) ? c.highlights : [],
      })));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.region ?? "").toLowerCase().includes(q) ||
      (c.city ?? "").toLowerCase().includes(q),
    );
  }, [items, search]);

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: editing.name.trim(),
      region: editing.region?.trim() || null,
      city: editing.city?.trim() || null,
      description: editing.description?.trim() || null,
      highlights: editing.highlights.filter((h) => h.label.trim()),
      cover_image: editing.cover_image || null,
      is_active: editing.is_active,
    };
    const { error } = editing.id
      ? await supabase.from("condominiums" as never).update(payload as never).eq("id", editing.id)
      : await supabase.from("condominiums" as never).insert(payload as never);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Salvo com sucesso" });
    setEditing(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("condominiums" as never).delete().eq("id", deleting);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Condomínio removido" });
      load();
    }
    setDeleting(null);
  };

  const handleSyncFromProperties = async () => {
    setSyncing(true);
    const data = await fetchAllPropertyCondoRows().catch(() => null);
    if (!data) {
      toast({ title: "Erro ao buscar imóveis", variant: "destructive" });
      setSyncing(false);
      return;
    }
    const existingNorm = new Set(items.map((c) => normalizeCondoName(c.name)));
    const seen = new Set<string>();
    const newOnes: { name: string }[] = [];
    for (const row of data) {
      const raw = row.condominium;
      if (!raw) continue;
      const name = raw.trim().replace(/\s+/g, " ");
      const norm = normalizeCondoName(name);
      if (!norm || existingNorm.has(norm) || seen.has(norm)) continue;
      seen.add(norm);
      newOnes.push({ name });
    }
    if (newOnes.length === 0) {
      toast({ title: "Tudo sincronizado", description: "Nenhum novo condomínio para importar." });
      setSyncing(false);
      return;
    }
    const { error: insErr } = await supabase
      .from("condominiums" as never)
      .insert(newOnes as never);
    if (insErr) {
      toast({ title: "Erro ao sincronizar", description: insErr.message, variant: "destructive" });
    } else {
      toast({ title: `${newOnes.length} condomínio(s) importado(s)` });
      load();
    }
    setSyncing(false);
  };

  const updateHighlight = (idx: number, patch: Partial<Highlight>) => {
    if (!editing) return;
    const next = [...editing.highlights];
    next[idx] = { ...next[idx], ...patch };
    setEditing({ ...editing, highlights: next });
  };

  const addHighlight = () => {
    if (!editing) return;
    setEditing({ ...editing, highlights: [...editing.highlights, { icon: "MapPin", label: "" }] });
  };

  const removeHighlight = (idx: number) => {
    if (!editing) return;
    setEditing({ ...editing, highlights: editing.highlights.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-[Raleway] text-3xl font-light text-foreground">Condomínios</h1>
          <p className="font-[Inter] text-sm text-muted-foreground mt-1">
            Gerencie informações exibidas em cada imóvel: região, descrição e destaques do bairro.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncFromProperties} disabled={syncing}>
            {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Sincronizar com imóveis
          </Button>
          <Button onClick={() => setEditing(emptyCondo())}>
            <Plus className="mr-2 h-4 w-4" /> Novo Condomínio
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, região ou cidade"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Região</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Destaques</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  <Loader2 className="inline animate-spin mr-2 h-4 w-4" /> Carregando…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhum condomínio cadastrado. Use “Sincronizar com imóveis” para importar.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.region || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.city || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{c.highlights.length}</Badge>
                  </TableCell>
                  <TableCell>
                    {c.is_active ? (
                      <Badge className="bg-foreground text-background">Ativo</Badge>
                    ) : (
                      <Badge variant="outline">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-[Raleway] text-2xl font-light">
              {editing?.id ? "Editar Condomínio" : "Novo Condomínio"}
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-5 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome *</Label>
                  <Input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="Condomínio Vintage"
                  />
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label>Ativo</Label>
                    <div className="h-10 flex items-center">
                      <Switch
                        checked={editing.is_active}
                        onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Região / Bairro</Label>
                  <Input
                    value={editing.region ?? ""}
                    onChange={(e) => setEditing({ ...editing, region: e.target.value })}
                    placeholder="Granja Viana"
                  />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={editing.city ?? ""}
                    onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                    placeholder="Cotia"
                  />
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  rows={5}
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Texto exibido na seção “Sobre o bairro” da página do imóvel."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Destaques da região</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addHighlight}>
                    <Plus className="mr-1 h-3 w-3" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {editing.highlights.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      Nenhum destaque cadastrado. Esses itens aparecem em cards na página do imóvel.
                    </p>
                  )}
                  {editing.highlights.map((h, i) => {
                    const Icon = getLucideIcon(h.icon);
                    return (
                      <div key={i} className="flex gap-2 items-center">
                        <Select value={h.icon} onValueChange={(v) => updateHighlight(i, { icon: v })}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue>
                              <span className="flex items-center gap-2">
                                <Icon size={14} strokeWidth={1.5} />
                                {h.icon}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {LUCIDE_ICON_NAMES.map((name) => {
                              const I = getLucideIcon(name);
                              return (
                                <SelectItem key={name} value={name}>
                                  <span className="flex items-center gap-2">
                                    <I size={14} strokeWidth={1.5} />
                                    {name}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <Input
                          value={h.label}
                          onChange={(e) => updateHighlight(i, { label: e.target.value })}
                          placeholder="Shopping Iguatemi Alphaville"
                          className="flex-1"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeHighlight(i)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir condomínio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Os imóveis vinculados continuarão existindo, mas perderão as
              informações personalizadas do condomínio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Condominiums;
