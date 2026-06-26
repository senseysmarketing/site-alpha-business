import { Shield, Briefcase, Handshake, Headphones, Check, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type RoleKey = "admin" | "gerente" | "corretor" | "assistente";

interface RoleCard {
  key: RoleKey;
  label: string;
  tagline: string;
  icon: typeof Shield;
  badgeClass: string;
  permissions: { label: string; allowed: boolean }[];
}

const ROLES: RoleCard[] = [
  {
    key: "admin",
    label: "Administrador",
    tagline: "Acesso total ao sistema",
    icon: Shield,
    badgeClass: "border-bordeaux/30 text-bordeaux bg-bordeaux/5",
    permissions: [
      { label: "Gerenciar imóveis, condomínios e blog", allowed: true },
      { label: "CRM completo (todas as leads, reatribuir e excluir)", allowed: true },
      { label: "Editar equipe e alterar cargos", allowed: true },
      { label: "Financeiro, Relatórios e Marketing", allowed: true },
      { label: "Configurações do site e regras do CRM", allowed: true },
      { label: "Logs de auditoria e atividades", allowed: true },
    ],
  },
  {
    key: "gerente",
    label: "Gerente",
    tagline: "Operação completa, sem identidade",
    icon: Briefcase,
    badgeClass: "border-amber-200 text-amber-800 bg-amber-50",
    permissions: [
      { label: "Gerenciar imóveis, condomínios e blog", allowed: true },
      { label: "CRM completo (todas as leads, reatribuir e excluir)", allowed: true },
      { label: "Visualizar e editar perfis da equipe", allowed: true },
      { label: "Financeiro, Relatórios e Marketing", allowed: true },
      { label: "Alterar cargos da equipe", allowed: false },
      { label: "Configurações do site", allowed: false },
    ],
  },
  {
    key: "corretor",
    label: "Corretor",
    tagline: "Foco em vendas e relacionamento",
    icon: Handshake,
    badgeClass: "border-emerald-200 text-emerald-700 bg-emerald-50",
    permissions: [
      { label: "Ver apenas leads atribuídas a si", allowed: true },
      { label: "Agenda própria de visitas", allowed: true },
      { label: "Consultar imóveis e condomínios", allowed: true },
      { label: "Financeiro e Configurações", allowed: false },
      { label: "Editar equipe ou reatribuir leads", allowed: false },
      { label: "Marketing avançado e auditoria", allowed: false },
    ],
  },
  {
    key: "assistente",
    label: "Assistente",
    tagline: "Apoio operacional ao time",
    icon: Headphones,
    badgeClass: "border-sky-200 text-sky-700 bg-sky-50",
    permissions: [
      { label: "Ver apenas leads atribuídas a si", allowed: true },
      { label: "Agenda própria", allowed: true },
      { label: "Consultar imóveis (somente leitura)", allowed: true },
      { label: "Financeiro e Relatórios", allowed: false },
      { label: "Configurações e edição de equipe", allowed: false },
      { label: "Reatribuir ou excluir leads", allowed: false },
    ],
  },
];

const RolePermissionsGrid = () => {
  return (
    <section className="mt-12">
      <div className="mb-5">
        <h2 className="font-[Raleway] text-lg font-semibold tracking-tight text-foreground">
          Permissões por Cargo
        </h2>
        <p className="text-xs text-muted-foreground font-[Inter] mt-1">
          O que cada cargo pode acessar dentro do AlphaBusiness.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {ROLES.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.key}
              className="bg-white rounded-sm border border-border/50 p-5 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-sm bg-muted/60 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-foreground/70" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-[Raleway] font-semibold text-sm text-foreground">
                      {r.label}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-[Inter] leading-tight mt-0.5">
                      {r.tagline}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[9px] uppercase tracking-wide ${r.badgeClass}`}>
                  {r.key}
                </Badge>
              </div>

              <Separator className="my-4" />

              <ul className="space-y-2.5 flex-1">
                {r.permissions.map((p, i) => (
                  <li
                    key={i}
                    className={`flex items-start gap-2 text-[11.5px] font-[Inter] leading-snug ${
                      p.allowed ? "text-foreground/80" : "text-muted-foreground/70 line-through decoration-muted-foreground/40"
                    }`}
                  >
                    {p.allowed ? (
                      <Check className="h-3.5 w-3.5 mt-px text-emerald-600 shrink-0" strokeWidth={2} />
                    ) : (
                      <X className="h-3.5 w-3.5 mt-px text-muted-foreground/50 shrink-0" strokeWidth={2} />
                    )}
                    <span>{p.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default RolePermissionsGrid;
