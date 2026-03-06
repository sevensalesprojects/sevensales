import { useState, useEffect, useCallback } from "react";
import { useOnboarding, ONBOARDING_STAGES, OnboardingProcess, ChecklistItem, OnboardingHistory } from "@/hooks/useOnboarding";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Loader2, Plus, Filter, X, Phone, Mail, Users, CalendarDays,
  CheckCircle2, MessageCircle, FileText, Clock, Video, Link2,
  ChevronRight, AlertTriangle, SlidersHorizontal, ClipboardList,
  ExternalLink,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ─── Metrics ─── */
function OnboardingMetrics({ items }: { items: OnboardingProcess[] }) {
  const active = items.filter(i => i.status === "active");
  const total = active.length;
  const scheduled = active.filter(i => i.scheduled_call_date).length;
  const callsDone = active.filter(i => ["call_onboarding_shopify", "call_dominio_gateway", "concluido"].includes(i.stage)).length;
  const completed = active.filter(i => i.stage === "concluido").length;

  // Avg time for completed
  const completedItems = items.filter(i => i.stage === "concluido");
  let avgDays = 0;
  if (completedItems.length > 0) {
    const totalDays = completedItems.reduce((acc, i) => {
      const start = new Date(i.created_at).getTime();
      const end = new Date(i.updated_at).getTime();
      return acc + (end - start) / (1000 * 60 * 60 * 24);
    }, 0);
    avgDays = Math.round(totalDays / completedItems.length);
  }

  const metrics = [
    { label: "Em Onboarding", value: total, color: "text-primary" },
    { label: "Calls Agendadas", value: scheduled, color: "text-warning" },
    { label: "Calls Realizadas", value: callsDone, color: "text-info" },
    { label: "Concluídos", value: completed, color: "text-success" },
    { label: "Tempo Médio", value: `${avgDays}d`, color: "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 px-4 md:px-6 py-3">
      {metrics.map((m) => (
        <div key={m.label} className="bg-card border border-border rounded-lg px-3 py-2.5 text-center">
          <p className={`text-lg md:text-xl font-bold ${m.color}`}>{m.value}</p>
          <p className="text-[10px] text-muted-foreground">{m.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Onboarding Card ─── */
function OnboardingCard({
  item,
  onDragStart,
  onClick,
}: {
  item: OnboardingProcess;
  onDragStart: () => void;
  onClick: () => void;
}) {
  // Check for alerts
  const hoursSinceUpdate = (Date.now() - new Date(item.updated_at).getTime()) / (1000 * 60 * 60);
  const isStale = item.stage !== "concluido" && hoursSinceUpdate > 48;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all group relative"
    >
      {isStale && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive flex items-center justify-center" title="Sem progresso há 48h+">
          <AlertTriangle className="w-2.5 h-2.5 text-destructive-foreground" />
        </div>
      )}
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium text-card-foreground leading-tight">{item.lead_name}</p>
      </div>
      {item.lead_phone && (
        <div className="flex items-center gap-2 mb-2">
          <Phone className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{item.lead_phone}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-1 mb-2">
        {(item.lead_tags || []).map(tag => (
          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">{tag}</span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{item.assigned_user_name || "Sem responsável"}</span>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          {new Date(item.updated_at).toLocaleDateString("pt-BR")}
        </div>
      </div>
    </div>
  );
}

/* ─── Detail Panel ─── */
function OnboardingDetailPanel({
  item,
  onClose,
  onFieldUpdate,
  onStageUpdate,
  fetchChecklist,
  toggleChecklistItem,
  fetchHistory,
}: {
  item: OnboardingProcess;
  onClose: () => void;
  onFieldUpdate: (id: string, field: string, value: any) => Promise<boolean>;
  onStageUpdate: (id: string, newStage: string, oldStage: string) => Promise<boolean>;
  fetchChecklist: (id: string) => Promise<ChecklistItem[]>;
  toggleChecklistItem: (itemId: string, completed: boolean) => Promise<boolean>;
  fetchHistory: (id: string) => Promise<OnboardingHistory[]>;
}) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"info" | "call" | "checklist" | "notas" | "historico">("info");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [history, setHistory] = useState<OnboardingHistory[]>([]);
  const [notes, setNotes] = useState(item.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    fetchChecklist(item.id).then(setChecklist);
    fetchHistory(item.id).then(setHistory);
  }, [item.id]);

  const handleToggleChecklist = async (checkItem: ChecklistItem) => {
    const ok = await toggleChecklistItem(checkItem.id, !checkItem.completed);
    if (ok) {
      setChecklist(prev => prev.map(c => c.id === checkItem.id ? { ...c, completed: !c.completed } : c));
      toast({ title: checkItem.completed ? "Desmarcado" : "Concluído!" });
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    const ok = await onFieldUpdate(item.id, "notes", notes);
    setSavingNotes(false);
    if (ok) toast({ title: "Notas salvas" });
  };

  const stageName = (id: string) => ONBOARDING_STAGES.find(s => s.id === id)?.name || id;

  const tabs = [
    { id: "info" as const, label: "Info", icon: Users },
    { id: "call" as const, label: "Call", icon: Video },
    { id: "checklist" as const, label: "Checklist", icon: ClipboardList },
    { id: "notas" as const, label: "Notas", icon: FileText },
    { id: "historico" as const, label: "Histórico", icon: Clock },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />
      <div className={`fixed top-0 h-full bg-card border-l border-border z-50 flex flex-col animate-slide-in ${
        isMobile ? "left-0 right-0 w-full" : "right-0 w-[520px]"
      }`}>
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-border shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-card-foreground truncate">{item.lead_name}</h2>
            <p className="text-xs text-muted-foreground">{stageName(item.stage)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Stage selector */}
        <div className="px-4 py-2 border-b border-border shrink-0">
          <Select value={item.stage} onValueChange={(v) => onStageUpdate(item.id, v, item.stage)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ONBOARDING_STAGES.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <div className="px-2 border-b border-border flex gap-0 shrink-0 overflow-x-auto scrollbar-thin">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {activeTab === "info" && (
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dados do Cliente</h3>
                <InfoRow icon={Users} label="Nome" value={item.lead_name} />
                <InfoRow icon={Phone} label="Telefone" value={item.lead_phone} />
                <InfoRow icon={Mail} label="Email" value={item.lead_email} />
                <InfoRow icon={CalendarDays} label="Data da Compra" value={item.purchase_date ? new Date(item.purchase_date).toLocaleDateString("pt-BR") : "—"} />
              </div>
              <div className="border border-border rounded-lg p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Responsável</h3>
                <InfoRow icon={Users} label="Responsável" value={item.assigned_user_name || "Não atribuído"} />
              </div>
            </div>
          )}

          {activeTab === "call" && (
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agendamento da Call</h3>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Data e Hora</label>
                  <input
                    type="datetime-local"
                    value={item.scheduled_call_date ? new Date(item.scheduled_call_date).toISOString().slice(0, 16) : ""}
                    onChange={(e) => onFieldUpdate(item.id, "scheduled_call_date", e.target.value ? new Date(e.target.value).toISOString() : null)}
                    className="w-full text-sm bg-transparent border border-input rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-ring text-foreground mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Link da Call</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={item.call_link || ""}
                      onChange={(e) => onFieldUpdate(item.id, "call_link", e.target.value || null)}
                      placeholder="https://meet.google.com/..."
                      className="flex-1 text-sm bg-transparent border border-input rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-ring text-foreground"
                    />
                    {item.call_link && (
                      <a href={item.call_link} target="_blank" rel="noopener noreferrer"
                        className="w-8 h-8 rounded flex items-center justify-center border border-input hover:bg-muted">
                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "checklist" && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tarefas do Onboarding</h3>
              {checklist.map(c => (
                <div key={c.id} onClick={() => handleToggleChecklist(c)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    c.completed ? "bg-primary border-primary" : "border-muted-foreground"
                  }`}>
                    {c.completed && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                  </div>
                  <span className={`text-sm ${c.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {c.title}
                  </span>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground mt-2">
                {checklist.filter(c => c.completed).length}/{checklist.length} concluídos
              </p>
            </div>
          )}

          {activeTab === "notas" && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Escreva observações sobre o cliente..."
                className="w-full min-h-[200px] text-sm bg-muted/30 border border-input rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-ring resize-none text-foreground"
              />
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {savingNotes ? "Salvando..." : "Salvar Notas"}
              </button>
            </div>
          )}

          {activeTab === "historico" && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Histórico de Movimentação</h3>
              {history.length === 0 && <p className="text-sm text-muted-foreground">Nenhum histórico.</p>}
              {history.map(h => (
                <div key={h.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">
                      {h.stage_from ? `${stageName(h.stage_from)} → ${stageName(h.stage_to)}` : `Criado em ${stageName(h.stage_to)}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(h.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="text-sm text-foreground">{value || "—"}</span>
    </div>
  );
}

/* ─── Main Page ─── */
export default function OnboardingPage() {
  const { currentProject } = useProject();
  const {
    items, loading, updateStage, updateField, createOnboarding,
    fetchChecklist, toggleChecklistItem, fetchHistory,
  } = useOnboarding();
  const [selectedItem, setSelectedItem] = useState<OnboardingProcess | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAssigned, setFilterAssigned] = useState<string>("all");

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      // N = new (placeholder), A = (placeholder)
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleDrop = async (stageId: string) => {
    if (!draggedItem) return;
    const item = items.find(i => i.id === draggedItem);
    if (!item || item.stage === stageId) { setDraggedItem(null); return; }
    const ok = await updateStage(draggedItem, stageId, item.stage);
    if (ok) toast({ title: "Movido", description: `Cliente movido para ${ONBOARDING_STAGES.find(s => s.id === stageId)?.name}` });
    setDraggedItem(null);
  };

  const handleStageUpdate = async (id: string, newStage: string, oldStage: string) => {
    const ok = await updateStage(id, newStage, oldStage);
    if (ok) {
      toast({ title: "Etapa atualizada" });
      setSelectedItem(prev => prev && prev.id === id ? { ...prev, stage: newStage } : prev);
    }
    return ok;
  };

  const handleFieldUpdate = async (id: string, field: string, value: any) => {
    const ok = await updateField(id, field, value);
    if (ok) setSelectedItem(prev => prev && prev.id === id ? { ...prev, [field]: value } : prev);
    return ok;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Filter
  let filtered = items;
  if (filterStatus !== "all") filtered = filtered.filter(i => i.stage === filterStatus);
  if (filterAssigned !== "all") filtered = filtered.filter(i => i.assigned_user === filterAssigned);

  // Unique assigned users for filter
  const assignedUsers = [...new Map(items.filter(i => i.assigned_user).map(i => [i.assigned_user, i.assigned_user_name])).entries()];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 border-b border-border flex items-center justify-between gap-2">
        <div>
          <h1 className="text-base md:text-lg font-semibold text-foreground">Onboarding</h1>
          <p className="text-xs text-muted-foreground truncate">{currentProject?.name} · Pós-Venda</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <Filter className="w-3.5 h-3.5 mr-1" />
              <SelectValue placeholder="Etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Etapas</SelectItem>
              {ONBOARDING_STAGES.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {assignedUsers.length > 0 && (
            <Select value={filterAssigned} onValueChange={setFilterAssigned}>
              <SelectTrigger className="w-[140px] h-8 text-xs hidden md:flex">
                <Users className="w-3.5 h-3.5 mr-1" />
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {assignedUsers.map(([id, name]) => <SelectItem key={id!} value={id!}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Metrics */}
      <OnboardingMetrics items={items} />

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto p-3 md:p-4">
        <div className="flex gap-3 h-full min-w-max">
          {ONBOARDING_STAGES.map(stage => {
            const stageItems = filtered.filter(i => i.stage === stage.id);
            return (
              <div
                key={stage.id}
                className="w-64 md:w-72 flex flex-col rounded-lg bg-muted/40 border border-border/50"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(stage.id)}
              >
                <div className="px-3 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-sm font-medium text-foreground">{stage.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">{stageItems.length}</span>
                  </div>
                </div>
                <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto scrollbar-thin">
                  {stageItems.map(item => (
                    <OnboardingCard
                      key={item.id}
                      item={item}
                      onDragStart={() => setDraggedItem(item.id)}
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedItem && (
        <OnboardingDetailPanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onFieldUpdate={handleFieldUpdate}
          onStageUpdate={handleStageUpdate}
          fetchChecklist={fetchChecklist}
          toggleChecklistItem={toggleChecklistItem}
          fetchHistory={fetchHistory}
        />
      )}
    </div>
  );
}
