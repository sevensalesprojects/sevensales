import { DBLead } from "@/hooks/useLeads";
import { X, Phone, Mail, Instagram, MessageCircle, FileText, CheckSquare, BarChart3, ShoppingBag } from "lucide-react";
import { useState } from "react";

interface LeadDetailPanelProps {
  lead: DBLead;
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
  const [activeTab, setActiveTab] = useState("info");

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[480px] bg-card border-l border-border z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-card-foreground">{lead.name}</h2>
            <p className="text-xs text-muted-foreground">{lead.source || "Sem origem"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Quick Info */}
        <div className="px-5 py-3 border-b border-border flex items-center gap-4 shrink-0">
          {lead.phone && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="w-3.5 h-3.5" />
              {lead.phone}
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="w-3.5 h-3.5" />
              {lead.email}
            </div>
          )}
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
      <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conversa registrada ainda.</p>
      <div className="mt-6 flex items-center gap-2 border border-input rounded-lg p-2">
        <input type="text" placeholder="Digite sua mensagem..." className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground" />
        <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">Enviar</button>
      </div>
    </div>
  );
}

function InfoTab({ lead }: { lead: DBLead }) {
  return (
    <div className="space-y-4">
      {[
        { label: "Nome", value: lead.name },
        { label: "Email", value: lead.email || "—" },
        { label: "Telefone", value: lead.phone || "—" },
        { label: "Origem", value: lead.source || "—" },
        { label: "Canal", value: lead.channel || "—" },
        { label: "Data de Criação", value: new Date(lead.created_at).toLocaleDateString("pt-BR") },
        { label: "Valor Estimado", value: lead.value_estimate ? `R$ ${lead.value_estimate.toLocaleString("pt-BR")}` : "—" },
      ].map((item) => (
        <div key={item.label}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{item.label}</p>
          <p className="text-sm text-foreground">{item.value}</p>
        </div>
      ))}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Tags</p>
        <div className="flex flex-wrap gap-1">
          {lead.tags.length > 0 ? lead.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
          )) : <span className="text-xs text-muted-foreground">Nenhuma tag</span>}
        </div>
      </div>
    </div>
  );
}

function NotesTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma nota registrada.</p>
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
      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa registrada.</p>
    </div>
  );
}

function MetricsTab() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: "Mensagens", value: "0" },
        { label: "Tempo de Resposta", value: "—" },
        { label: "Dias no Funil", value: "—" },
        { label: "Interações", value: "0" },
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
      <p className="text-xs text-muted-foreground text-center py-4">Nenhuma compra registrada.</p>
    </div>
  );
}
