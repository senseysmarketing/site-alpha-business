import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import type {
  AssignmentRule,
  AssignmentRuleMember,
  DistributionType,
  RuleConditions,
  RuleInput,
} from "@/hooks/useAssignmentRules";
import { usePipelineStages } from "@/hooks/usePipelineStages";

interface TeamProfile {
  user_id: string;
  full_name: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: AssignmentRule | null;
  members: AssignmentRuleMember[];
  team: TeamProfile[];
  nextPriority: number;
  onSave: (payload: RuleInput & { id?: string }) => void | Promise<void>;
}

const ORIGINS = [
  { value: "formulario_contato", label: "Formulário de contato" },
  { value: "agendamento_visita", label: "Agendamento de visita" },
  { value: "anunciar_imovel", label: "Anunciar imóvel" },
  { value: "rafa_ia", label: "Rafa IA" },
  { value: "manual", label: "Cadastro manual" },
];

// STAGES é carregado dinamicamente via usePipelineStages

const SCORES = [
  { value: "quente", label: "Quente" },
  { value: "morno", label: "Morno" },
  { value: "frio", label: "Frio" },
];

const ANY = "__any__";

export function AssignmentRuleEditor({
  open,
  onOpenChange,
  rule,
  members,
  team,
  nextPriority,
  onSave,
}: Props) {
  const { activeStages } = usePipelineStages();
  const STAGES = activeStages.map((s) => ({ value: s.key, label: s.label }));
  const [name, setName] = useState("");
  const [priority, setPriority] = useState<number>(10);
  const [isActive, setIsActive] = useState(true);
  const [distributionType, setDistributionType] = useState<DistributionType>("fixed");
  const [fixedUserId, setFixedUserId] = useState<string>("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [conditions, setConditions] = useState<RuleConditions>({});

  useEffect(() => {
    if (!open) return;
    if (rule) {
      setName(rule.name);
      setPriority(rule.priority);
      setIsActive(rule.is_active);
      setDistributionType(rule.distribution_type);
      setFixedUserId(rule.fixed_user_id ?? "");
      setConditions(rule.conditions ?? {});
      setSelectedMembers(
        members
          .filter((m) => m.rule_id === rule.id)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((m) => m.user_id),
      );
    } else {
      setName("");
      setPriority(nextPriority);
      setIsActive(true);
      setDistributionType("fixed");
      setFixedUserId("");
      setSelectedMembers([]);
      setConditions({});
    }
  }, [open, rule, members, nextPriority]);

  const toggleMember = (uid: string) => {
    setSelectedMembers((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid],
    );
  };

  const moveMember = (uid: string, dir: -1 | 1) => {
    setSelectedMembers((prev) => {
      const idx = prev.indexOf(uid);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const updateCondition = <K extends keyof RuleConditions>(key: K, value: RuleConditions[K] | undefined) => {
    setConditions((prev) => {
      const next = { ...prev };
      if (value === undefined || value === "" || value === null) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    if (distributionType === "fixed" && !fixedUserId) {
      toast({ title: "Selecione o responsável fixo", variant: "destructive" });
      return;
    }
    if (distributionType !== "fixed" && selectedMembers.length === 0) {
      toast({ title: "Adicione pelo menos um participante", variant: "destructive" });
      return;
    }

    await onSave({
      id: rule?.id,
      name: name.trim(),
      priority,
      is_active: isActive,
      conditions,
      distribution_type: distributionType,
      fixed_user_id: distributionType === "fixed" ? fixedUserId : null,
      members:
        distributionType === "fixed"
          ? []
          : selectedMembers.map((uid, idx) => ({ user_id: uid, sort_order: idx })),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-[Raleway]">
            {rule ? "Editar regra" : "Nova regra de atribuição"}
          </DialogTitle>
          <DialogDescription className="font-[Inter]">
            A primeira regra ativa compatível define o responsável. Se nenhuma casar, o fallback é usado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-3 items-end">
            <div className="space-y-2">
              <Label className="font-[Raleway] text-sm">Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Leads de agendamento" />
            </div>
            <div className="space-y-2">
              <Label className="font-[Raleway] text-sm">Prioridade</Label>
              <Input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center gap-2 h-10">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <span className="text-sm font-[Inter]">{isActive ? "Ativa" : "Inativa"}</span>
            </div>
          </div>

          {/* Condições */}
          <div className="rounded-md border border-border/40 p-4 space-y-3">
            <Label className="font-[Raleway] text-sm">Condições</Label>
            <p className="text-xs text-muted-foreground font-[Inter]">
              Todas as condições preenchidas devem casar. Deixe em branco para qualquer valor.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-[Inter]">Origem</Label>
                <Select
                  value={conditions.origin ?? ANY}
                  onValueChange={(v) => updateCondition("origin", v === ANY ? undefined : v)}
                >
                  <SelectTrigger><SelectValue placeholder="Qualquer" /></SelectTrigger>
                  <SelectContent className="z-[70] bg-popover">
                    <SelectItem value={ANY}>Qualquer</SelectItem>
                    {ORIGINS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-[Inter]">Estágio</Label>
                <Select
                  value={conditions.pipeline_stage ?? ANY}
                  onValueChange={(v) => updateCondition("pipeline_stage", v === ANY ? undefined : v)}
                >
                  <SelectTrigger><SelectValue placeholder="Qualquer" /></SelectTrigger>
                  <SelectContent className="z-[70] bg-popover">
                    <SelectItem value={ANY}>Qualquer</SelectItem>
                    {STAGES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-[Inter]">Score</Label>
                <Select
                  value={conditions.score ?? ANY}
                  onValueChange={(v) => updateCondition("score", v === ANY ? undefined : v)}
                >
                  <SelectTrigger><SelectValue placeholder="Qualquer" /></SelectTrigger>
                  <SelectContent className="z-[70] bg-popover">
                    <SelectItem value={ANY}>Qualquer</SelectItem>
                    {SCORES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-[Inter]">Imóvel (UUID)</Label>
                <Input
                  value={(conditions.property_id as string) ?? ""}
                  placeholder="opcional"
                  onChange={(e) => updateCondition("property_id", e.target.value || undefined)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-[Inter]">Valor mínimo (R$)</Label>
                <Input
                  type="number"
                  value={(conditions.deal_value_min as number | string) ?? ""}
                  onChange={(e) =>
                    updateCondition(
                      "deal_value_min",
                      e.target.value === "" ? undefined : Number(e.target.value),
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-[Inter]">Valor máximo (R$)</Label>
                <Input
                  type="number"
                  value={(conditions.deal_value_max as number | string) ?? ""}
                  onChange={(e) =>
                    updateCondition(
                      "deal_value_max",
                      e.target.value === "" ? undefined : Number(e.target.value),
                    )
                  }
                />
              </div>
            </div>
          </div>

          {/* Distribuição */}
          <div className="rounded-md border border-border/40 p-4 space-y-3">
            <Label className="font-[Raleway] text-sm">Tipo de distribuição</Label>
            <RadioGroup
              value={distributionType}
              onValueChange={(v) => setDistributionType(v as DistributionType)}
              className="grid grid-cols-3 gap-2"
            >
              <label className="flex items-center gap-2 text-sm font-[Inter] cursor-pointer rounded-md border border-border/40 p-2">
                <RadioGroupItem value="fixed" /> Fixo
              </label>
              <label className="flex items-center gap-2 text-sm font-[Inter] cursor-pointer rounded-md border border-border/40 p-2">
                <RadioGroupItem value="sequence" /> Sequência
              </label>
              <label className="flex items-center gap-2 text-sm font-[Inter] cursor-pointer rounded-md border border-border/40 p-2">
                <RadioGroupItem value="random" /> Aleatório
              </label>
            </RadioGroup>

            {distributionType === "fixed" ? (
              <div className="space-y-1">
                <Label className="text-xs font-[Inter]">Responsável fixo</Label>
                <Select value={fixedUserId} onValueChange={setFixedUserId}>
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent className="z-[70] bg-popover">
                    {team.map((t) => (
                      <SelectItem key={t.user_id} value={t.user_id}>{t.full_name || t.user_id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs font-[Inter]">
                  Participantes {distributionType === "sequence" ? "(ordem importa)" : ""}
                </Label>
                <div className="rounded-md border border-border/40 p-2 max-h-56 overflow-y-auto space-y-1.5">
                  {team.map((t) => (
                    <label
                      key={t.user_id}
                      className="flex items-center gap-2 text-sm font-[Inter] cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedMembers.includes(t.user_id)}
                        onCheckedChange={() => toggleMember(t.user_id)}
                      />
                      <span className="flex-1">{t.full_name || t.user_id}</span>
                    </label>
                  ))}
                </div>
                {distributionType === "sequence" && selectedMembers.length > 0 && (
                  <div className="space-y-1 pt-2">
                    <p className="text-xs text-muted-foreground font-[Inter]">Ordem da sequência:</p>
                    <ul className="space-y-1">
                      {selectedMembers.map((uid, idx) => {
                        const t = team.find((p) => p.user_id === uid);
                        return (
                          <li
                            key={uid}
                            className="flex items-center justify-between gap-2 rounded-md border border-border/40 px-2 py-1.5 text-sm font-[Inter]"
                          >
                            <span>
                              <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                              {t?.full_name || uid}
                            </span>
                            <span className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => moveMember(uid, -1)}
                                disabled={idx === 0}
                              >
                                ↑
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => moveMember(uid, 1)}
                                disabled={idx === selectedMembers.length - 1}
                              >
                                ↓
                              </Button>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar regra</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
