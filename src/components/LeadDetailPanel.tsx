import { Lead } from "@/data/mockData";
import { X, Phone, Mail, Instagram, MessageCircle, FileText, CheckSquare, BarChart3, ShoppingBag } from "lucide-react";
import { useState } from "react";

interface LeadDetailPanelProps {
  lead: Lead;
  onClose: () => void;
}

const tabs = [
  { id: "conversa", label: "Conversa", icon: MessageCircle },
  { id: "info", label: "Informações", icon: FileText },
  { id: "notas", label: "Notas", icon: FileText },
  { id: "tarefas", label: "Tarefas", icon: CheckSquare },
  { id: "metricas", label: "Métricas", icon: BarChart3 },
  { id: "compras", label: "Compras", icon: ShoppingBag },
];

export function LeadDetailPanel({ lead, onClose }: LeadDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("conversa");

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[480px] bg-card border-l border-border z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-card-foreground">{lead.name}</h2>
            <p className="text-xs text-muted-foreground">{lead.origin}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Quick Info */}
        <div className="px-5 py-3 border-b border-border flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="w-3.5 h-3.5" />
            {lead.phone}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="w-3.5 h-3.5" />
            {lead.email}
          </div>
          {lead.instagram && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Instagram className="w-3.5 h-3.5" />
              {lead.instagram}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="px-5 border-b border-border flex gap-0 shrink-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {activeTab === "conversa" && <ConversationTab />}
          {activeTab === "info" && <InfoTab lead={lead} />}
          {activeTab === "notas" && <NotesTab />}
          {activeTab === "tarefas" && <TasksTab />}
          {activeTab === "metricas" && <MetricsTab />}
          {activeTab === "compras" && <PurchasesTab />}
        </div>
      </div>
    </>
  );
}

function ConversationTab() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-medium text-primary">MS</span>
        </div>
        <div className="bg-muted rounded-lg rounded-tl-none px-3 py-2 max-w-[80%]">
          <p className="text-sm text-foreground">Olá! Vi o anúncio sobre o curso. Gostaria de saber mais informações.</p>
          <span className="text-[10px] text-muted-foreground mt-1 block">14:32 · WhatsApp</span>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <div className="bg-primary/10 rounded-lg rounded-tr-none px-3 py-2 max-w-[80%]">
          <p className="text-sm text-foreground">Olá! Tudo bem? O curso está com condições especiais essa semana! Posso te explicar melhor?</p>
          <span className="text-[10px] text-muted-foreground mt-1 block">14:35 · WhatsApp</span>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-medium text-primary">MS</span>
        </div>
        <div className="bg-muted rounded-lg rounded-tl-none px-3 py-2 max-w-[80%]">
          <p className="text-sm text-foreground">Sim, por favor! Qual o valor?</p>
          <span className="text-[10px] text-muted-foreground mt-1 block">14:40 · WhatsApp</span>
        </div>
      </div>

      {/* Input */}
      <div className="mt-6 flex items-center gap-2 border border-input rounded-lg p-2">
        <input
          type="text"
          placeholder="Digite sua mensagem..."
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
        />
        <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
          Enviar
        </button>
      </div>
    </div>
  );
}

function InfoTab({ lead }: { lead: Lead }) {
  return (
    <div className="space-y-4">
      {[
        { label: "Nome", value: lead.name },
        { label: "Email", value: lead.email },
        { label: "Telefone", value: lead.phone },
        { label: "Origem", value: lead.origin },
        { label: "SDR Responsável", value: lead.sdr },
        { label: "Data de Criação", value: lead.createdAt },
        { label: "Valor Estimado", value: lead.value ? `R$ ${lead.value.toLocaleString("pt-BR")}` : "—" },
      ].map((item) => (
        <div key={item.label}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{item.label}</p>
          <p className="text-sm text-foreground">{item.value}</p>
        </div>
      ))}

      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Tags</p>
        <div className="flex flex-wrap gap-1">
          {lead.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotesTab() {
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground mb-1">Carlos · 04/03/2026</p>
        <p className="text-sm text-foreground">Lead demonstrou interesse alto no curso. Agendar reunião para apresentação de proposta.</p>
      </div>
      <div className="p-3 rounded-lg bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground mb-1">Ana · 03/03/2026</p>
        <p className="text-sm text-foreground">Primeiro contato feito via WhatsApp. Lead respondeu rápido.</p>
      </div>
      <textarea
        placeholder="Adicionar uma nota..."
        className="w-full h-20 rounded-lg border border-input bg-muted/30 p-3 text-sm placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring resize-none"
      />
    </div>
  );
}

function TasksTab() {
  return (
    <div className="space-y-2">
      {[
        { text: "Enviar proposta comercial", done: false, date: "05/03" },
        { text: "Agendar call de follow-up", done: false, date: "06/03" },
        { text: "Primeiro contato via WhatsApp", done: true, date: "03/03" },
      ].map((task, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border">
          <div className={`w-4 h-4 rounded border-2 ${task.done ? "bg-primary border-primary" : "border-muted-foreground"}`} />
          <span className={`text-sm flex-1 ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.text}</span>
          <span className="text-[10px] text-muted-foreground">{task.date}</span>
        </div>
      ))}
    </div>
  );
}

function MetricsTab() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: "Mensagens", value: "24" },
        { label: "Tempo de Resposta", value: "12min" },
        { label: "Dias no Funil", value: "8" },
        { label: "Interações", value: "15" },
      ].map((m) => (
        <div key={m.label} className="p-3 rounded-lg bg-muted/30 border border-border text-center">
          <p className="text-lg font-semibold text-foreground">{m.value}</p>
          <p className="text-[10px] text-muted-foreground">{m.label}</p>
        </div>
      ))}
    </div>
  );
}

function PurchasesTab() {
  return (
    <div className="space-y-2">
      <div className="p-3 rounded-lg bg-success/10 border border-success/20">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-foreground">Curso Expert Digital</span>
          <span className="text-sm font-semibold text-success">R$ 2.497</span>
        </div>
        <p className="text-xs text-muted-foreground">Hotmart · Compra aprovada · 01/03/2026</p>
      </div>
      <p className="text-xs text-muted-foreground text-center py-4">Dados de compra sincronizados via Hotmart</p>
    </div>
  );
}
