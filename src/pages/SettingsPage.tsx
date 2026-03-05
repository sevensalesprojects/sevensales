import { useState } from "react";
import { useExpert } from "@/contexts/ExpertContext";
import { toast } from "@/hooks/use-toast";
import {
  Building2, Globe, Clock, Palette, Users, Kanban, Tags,
  Zap, Plus, Pencil, Trash2, GripVertical, Save, ChevronRight,
} from "lucide-react";

type SettingsTab = "system" | "experts" | "funnels" | "tags" | "automation";

const tabItems = [
  { id: "system" as const, label: "Sistema", icon: Building2 },
  { id: "experts" as const, label: "Projetos / Experts", icon: Users },
  { id: "funnels" as const, label: "Funis", icon: Kanban },
  { id: "tags" as const, label: "Tags", icon: Tags },
  { id: "automation" as const, label: "Automações", icon: Zap },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("system");

  return (
    <div className="flex h-full overflow-hidden">
      {/* Settings Sidebar */}
      <div className="w-56 border-r border-border shrink-0 py-4">
        <p className="px-4 text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Configurações</p>
        <nav className="space-y-0.5 px-2">
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                activeTab === tab.id ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "system" && <SystemSettings />}
        {activeTab === "experts" && <ExpertsSettings />}
        {activeTab === "funnels" && <FunnelsSettings />}
        {activeTab === "tags" && <TagsSettings />}
        {activeTab === "automation" && <AutomationSettings />}
      </div>
    </div>
  );
}

function SystemSettings() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Configurações do Sistema</h2>
        <p className="text-sm text-muted-foreground">Configurações globais do CRM</p>
      </div>

      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        {[
          { label: "Nome da Empresa", value: "VendaFlow", icon: Building2 },
          { label: "Fuso Horário", value: "América/São Paulo (BRT -3)", icon: Clock },
          { label: "Idioma", value: "Português (Brasil)", icon: Globe },
        ].map((item) => (
          <div key={item.label} className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.value}</p>
              </div>
            </div>
            <button className="h-7 px-2.5 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted transition-colors">
              Editar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpertsSettings() {
  const { experts } = useExpert();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Projetos / Experts</h2>
          <p className="text-sm text-muted-foreground">Gerencie os experts e seus projetos</p>
        </div>
        <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
          <Plus className="w-3.5 h-3.5" /> Novo Expert
        </button>
      </div>

      <div className="space-y-3">
        {experts.map((expert) => (
          <div key={expert.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: expert.color, color: "#fff" }}>
                {expert.initials}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{expert.name}</p>
                <p className="text-xs text-muted-foreground">2 funis · 48 leads · WhatsApp conectado</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
              <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelsSettings() {
  const stages = [
    { name: "Lead Novo", color: "hsl(205, 80%, 50%)" },
    { name: "Contato Iniciado", color: "hsl(175, 80%, 36%)" },
    { name: "Qualificação", color: "hsl(38, 92%, 50%)" },
    { name: "Agendamento", color: "hsl(280, 65%, 55%)" },
    { name: "Proposta", color: "hsl(340, 75%, 55%)" },
    { name: "Fechado", color: "hsl(152, 69%, 40%)" },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Configuração de Funis</h2>
          <p className="text-sm text-muted-foreground">Personalize as etapas dos funis de vendas</p>
        </div>
        <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
          <Plus className="w-3.5 h-3.5" /> Novo Funil
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Funil Lançamento</h3>
          <span className="text-xs text-muted-foreground">6 etapas</span>
        </div>
        <div className="divide-y divide-border">
          {stages.map((stage, i) => (
            <div key={stage.name} className="px-4 py-3 flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
              <span className="text-sm text-foreground flex-1">{stage.name}</span>
              <span className="text-xs text-muted-foreground">Etapa {i + 1}</span>
              <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
              <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-border">
          <button className="h-8 px-3 rounded-md border border-dashed border-input text-xs text-muted-foreground hover:bg-muted flex items-center gap-1.5 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Adicionar Etapa
          </button>
        </div>
      </div>
    </div>
  );
}

function TagsSettings() {
  const tags = [
    { name: "Instagram Orgânico", category: "Origem", color: "bg-chart-5/15 text-chart-5" },
    { name: "Tráfego Pago", category: "Origem", color: "bg-info/15 text-info" },
    { name: "YouTube", category: "Origem", color: "bg-destructive/15 text-destructive" },
    { name: "Lead Quente", category: "Temperatura", color: "bg-destructive/15 text-destructive" },
    { name: "Lead Morno", category: "Temperatura", color: "bg-warning/15 text-warning" },
    { name: "Lead Frio", category: "Temperatura", color: "bg-info/15 text-info" },
    { name: "Aluno", category: "Status", color: "bg-success/15 text-success" },
    { name: "VIP", category: "Status", color: "bg-primary/15 text-primary" },
    { name: "Upsell", category: "Status", color: "bg-chart-4/15 text-chart-4" },
  ];

  const categories = Array.from(new Set(tags.map((t) => t.category)));

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Gestão de Tags</h2>
          <p className="text-sm text-muted-foreground">Crie e organize tags para segmentação de leads</p>
        </div>
        <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
          <Plus className="w-3.5 h-3.5" /> Nova Tag
        </button>
      </div>

      {categories.map((cat) => (
        <div key={cat} className="bg-card border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">{cat}</h3>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {tags.filter((t) => t.category === cat).map((tag) => (
              <div key={tag.name} className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium ${tag.color}`}>
                {tag.name}
                <button className="hover:opacity-70"><Pencil className="w-3 h-3" /></button>
                <button className="hover:opacity-70"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AutomationSettings() {
  const automations = [
    { name: "Mensagem de boas-vindas", description: "Enviar mensagem automática quando lead entrar no funil", trigger: "Lead criado", action: "Enviar WhatsApp", active: true },
    { name: "Mover para Cliente", description: "Quando compra for aprovada na Hotmart, mover lead para etapa Cliente", trigger: "Compra Hotmart", action: "Mover etapa", active: true },
    { name: "Follow-up inatividade", description: "Criar tarefa para SDR quando lead ficar 3 dias sem interação", trigger: "Inatividade 3 dias", action: "Criar tarefa", active: false },
    { name: "Distribuição automática", description: "Distribuir novos leads entre SDRs ativos automaticamente", trigger: "Lead criado", action: "Atribuir SDR", active: false },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Automações</h2>
        <p className="text-sm text-muted-foreground">Configure regras automáticas para o CRM</p>
      </div>

      <div className="space-y-3">
        {automations.map((auto) => (
          <div key={auto.name} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${auto.active ? "bg-primary/10" : "bg-muted"}`}>
                <Zap className={`w-5 h-5 ${auto.active ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{auto.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${auto.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {auto.active ? "Ativa" : "Inativa"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{auto.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Gatilho: {auto.trigger}</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Ação: {auto.action}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-7 px-2.5 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted transition-colors">
                Editar
              </button>
              <div className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${auto.active ? "bg-primary" : "bg-muted"}`}>
                <div className={`w-4 h-4 rounded-full bg-card absolute top-0.5 transition-transform ${auto.active ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
