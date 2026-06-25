import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PipelineStage, StageBehavior } from "@/hooks/usePipelineStages";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BEHAVIORS: { value: StageBehavior; label: string }[] = [
  { value: "initial", label: "Inicial" },
  { value: "intermediate", label: "Intermediário" },
  { value: "won", label: "Ganho" },
  { value: "lost", label: "Perdido" },
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);

export function PipelineStagesDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [items, setItems] = useState<PipelineStage[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PipelineStage | null>(null);
  const [reassignTo, setReassignTo] = useState<string>("");

  const { data: dbStages = [] } = useQuery({
    queryKey: ["pipeline_stages_admin", open],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_stages")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as PipelineStage[];
    },
  });

  useEffect(() => {
    if (open) setItems(dbStages);
  }, [open, dbStages]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    setItems(arrayMove(items, oldIdx, newIdx));
  };

  const updateItem = (id: string, patch: Partial<PipelineStage>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const addStage = () => {
    const tempId = `new-${Date.now()}`;
    setItems((prev) => [
      ...prev,
      {
        id: tempId,
        key: "",
        label: "Novo estágio",
        color: "#6B2D3E",
        sort_order: prev.length * 10 + 10,
        is_active: true,
        behavior: "intermediate",
        overdue_days: 7,
      },
    ]);
  };

  const handleSave = async () => {
    // valida labels e gera keys para novos
    for (const it of items) {
      if (!it.label.trim()) {
        toast({ title: "Etiqueta obrigatória em todos os estágios", variant: "destructive" });
        return;
      }
    }
    setSaving(true);
    try {
      // separa inserts vs updates
      const toInsert = items.filter((i) => i.id.startsWith("new-"));
      const toUpdate = items.filter((i) => !i.id.startsWith("new-"));

      // gera keys únicas para novos
      const existingKeys = new Set(dbStages.map((s) => s.key));
      const finalInserts = toInsert.map((it, idx) => {
        let base = slugify(it.label) || `estagio_${Date.now()}_${idx}`;
        let k = base;
        let n = 1;
        while (existingKeys.has(k)) {
          k = `${base}_${n++}`;
        }
        existingKeys.add(k);
        return { ...it, key: k };
      });

      // updates (com nova ordem)
      const updates = toUpdate.map((it, idx) => ({
        id: it.id,
        label: it.label,
        color: it.color,
        sort_order: items.findIndex((x) => x.id === it.id) * 10 + 10,
        is_active: it.is_active,
        behavior: it.behavior,
        overdue_days: it.overdue_days,
      }));

      for (const u of updates) {
        const { error } = await supabase
          .from("pipeline_stages")
          .update({
            label: u.label,
            color: u.color,
            sort_order: u.sort_order,
            is_active: u.is_active,
            behavior: u.behavior,
            overdue_days: u.overdue_days,
          })
          .eq("id", u.id);
        if (error) throw error;
      }

      for (const ins of finalInserts) {
        const orderIdx = items.findIndex((x) => x.id === ins.id);
        const { error } = await supabase.from("pipeline_stages").insert({
          key: ins.key,
          label: ins.label,
          color: ins.color,
          sort_order: orderIdx * 10 + 10,
          is_active: ins.is_active,
          behavior: ins.behavior,
          overdue_days: ins.overdue_days,
        });
        if (error) throw error;
      }

      toast({ title: "Estágios atualizados" });
      qc.invalidateQueries({ queryKey: ["pipeline_stages"] });
      qc.invalidateQueries({ queryKey: ["pipeline_stages_admin"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !reassignTo) return;
    const { error } = await supabase.rpc("delete_pipeline_stage", {
      p_key: deleteTarget.key,
      p_reassign_to: reassignTo,
    });
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Estágio removido", description: "Leads foram movidos com sucesso." });
    setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    setDeleteTarget(null);
    setReassignTo("");
    qc.invalidateQueries({ queryKey: ["pipeline_stages"] });
    qc.invalidateQueries({ queryKey: ["pipeline_stages_admin"] });
    qc.invalidateQueries({ queryKey: ["leads"] });
  };

  const deleteOptions = useMemo(
    () => items.filter((i) => deleteTarget && i.id !== deleteTarget.id && !i.id.startsWith("new-")),
    [items, deleteTarget],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-[Raleway]">Estágios do pipeline</DialogTitle>
            <DialogDescription className="font-[Inter] text-xs">
              Crie, renomeie, reordene (arrastando) e personalize cada coluna do pipeline. Mudanças refletem
              em todo o CRM, regras de atribuição, relatórios e alertas.
            </DialogDescription>
          </DialogHeader>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map((stage) => (
                  <SortableRow
                    key={stage.id}
                    stage={stage}
                    onChange={(patch) => updateItem(stage.id, patch)}
                    onDelete={() => {
                      if (stage.id.startsWith("new-")) {
                        setItems((prev) => prev.filter((i) => i.id !== stage.id));
                      } else {
                        setDeleteTarget(stage);
                        setReassignTo("");
                      }
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button variant="outline" onClick={addStage} className="mt-3 font-[Inter]">
            <Plus className="h-4 w-4 mr-2" /> Adicionar estágio
          </Button>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-[Raleway]">Excluir “{deleteTarget?.label}”</AlertDialogTitle>
            <AlertDialogDescription className="font-[Inter] text-xs">
              Selecione para qual coluna os leads deste estágio serão movidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label className="text-xs font-[Inter]">Mover leads para</Label>
            <Select value={reassignTo} onValueChange={setReassignTo}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent className="z-[80] bg-popover">
                {deleteOptions.map((s) => (
                  <SelectItem key={s.id} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={!reassignTo} onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SortableRow({
  stage,
  onChange,
  onDelete,
}: {
  stage: PipelineStage;
  onChange: (patch: Partial<PipelineStage>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[auto_1fr_120px_140px_110px_60px_auto] gap-2 items-center rounded-md border border-border/50 bg-card p-2"
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground hover:text-foreground p-1"
        {...attributes}
        {...listeners}
        aria-label="Reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Input
        value={stage.label}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="Nome do estágio"
        className="h-9"
      />
      <Select value={stage.behavior} onValueChange={(v) => onChange({ behavior: v as StageBehavior })}>
        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent className="z-[70] bg-popover">
          {BEHAVIORS.map((b) => (
            <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={stage.color}
          onChange={(e) => onChange({ color: e.target.value })}
          className="h-9 w-10 rounded border border-border/60 cursor-pointer bg-transparent"
        />
        <Input
          value={stage.color}
          onChange={(e) => onChange({ color: e.target.value })}
          className="h-9 text-xs uppercase"
        />
      </div>
      <Input
        type="number"
        min={0}
        value={stage.overdue_days ?? ""}
        placeholder="—"
        onChange={(e) => onChange({ overdue_days: e.target.value === "" ? null : Number(e.target.value) })}
        className="h-9 text-xs"
        title="Dias sem contato para marcar atraso (vazio = nunca)"
      />
      <Switch
        checked={stage.is_active}
        onCheckedChange={(v) => onChange({ is_active: v })}
        aria-label="Ativo"
      />
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
