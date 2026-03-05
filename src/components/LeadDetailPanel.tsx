import { DBLead } from "@/hooks/useLeads";
import {
  X, Phone, Mail, Instagram, Globe, Users, Link2, CalendarDays,
  CheckCircle2, Video, FileText, MessageCircle, Star, Eye,
  DollarSign, Clock, Send, Plus, ChevronDown, ExternalLink
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface LeadDetailPanelProps {
  lead: DBLead;
  onClose: () => void;
  onFieldUpdate?: (leadId: string, field: string, value: any) => Promise<boolean>;
}

/* ─── Inline Editable Field ─── */
function InlineField({
  label,
  value,
  onSave,
  icon: Icon,
  type = "text",
  options,
  placeholder,
  multiline,
  linkUrl,
}: {
  label: string;
  value: string | null;
  onSave: (val: string | null) => void;
  icon?: any;
  type?: "text" | "select" | "date" | "link";
  options?: { value: string; label: string }[];
  placeholder?: string;
  multiline?: boolean;
  linkUrl?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => { setDraft(value || ""); }, [value]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    const finalVal = draft.trim() || null;
    if (finalVal !== (value || null)) onSave(finalVal);
  };

  if (type === "select" && options) {
    return (
      <div className="group">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
          {Icon && <Icon className="w-3 h-3" />} {label}
        </p>
        <select
          ref={inputRef as any}
          value={value || ""}
          onChange={(e) => onSave(e.target.value || null)}
          className="w-full text-sm bg-transparent border border-transparent hover:border-input focus:border-ring rounded px-1 py-0.5 outline-none cursor-pointer text-foreground"
        >
          <option value="">{placeholder || "Selecionar..."}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    );
  }

  if (type === "date") {
    return (
      <div className="group">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
          {Icon && <Icon className="w-3 h-3" />} {label}
        </p>
        <input
          type="datetime-local"
          value={value ? new Date(value).toISOString().slice(0, 16) : ""}
          onChange={(e) => onSave(e.target.value ? new Date(e.target.value).toISOString() : null)}
          className="w-full text-sm bg-transparent border border-transparent hover:border-input focus:border-ring rounded px-1 py-0.5 outline-none text-foreground"
        />
      </div>
    );
  }

  return (
    <div className="group">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />} {label}
        {type === "link" && value && (
          <a href={value} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:text-primary/80">
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </p>
      {editing ? (
        multiline ? (
          <textarea
            ref={inputRef as any}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Escape") { setDraft(value || ""); setEditing(false); } }}
            placeholder={placeholder}
            className="w-full text-sm bg-muted/30 border border-input rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-ring resize-none min-h-[60px] text-foreground"
            rows={3}
          />
        ) : (
          <input
            ref={inputRef as any}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setDraft(value || ""); setEditing(false); }
            }}
            placeholder={placeholder}
            className="w-full text-sm bg-muted/30 border border-input rounded px-2 py-1 outline-none focus:ring-1 focus:ring-ring text-foreground"
          />
        )
      ) : (
        <p
          onClick={() => setEditing(true)}
          className="text-sm text-foreground cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50 transition-colors min-h-[24px]"
        >
          {value || <span className="text-muted-foreground italic">{placeholder || "Clique para preencher"}</span>}
        </p>
      )}
    </div>
  );
}

/* ─── Checkbox Field ─── */
function CheckboxField({
  label,
  checked,
  onChange,
  icon: Icon,
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  icon?: any;
}) {
  return (
    <div
      className="flex items-center gap-2.5 cursor-pointer group"
      onClick={() => onChange(!checked)}
    >
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
        checked ? "bg-primary border-primary" : "border-muted-foreground group-hover:border-primary/50"
      }`}>
        {checked && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
      </div>
      <div className="flex items-center gap-1">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
        <span className="text-sm text-foreground">{label}</span>
      </div>
    </div>
  );
}

/* ─── Block Section ─── */
function BlockSection({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: any }) {
  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-primary" />}
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ─── Sale status badge ─── */
const saleStatusOptions = [
  { value: "pending", label: "Pendente" },
  { value: "sold", label: "Vendeu" },
  { value: "negative", label: "Negativa" },
  { value: "negotiating", label: "Em Negociação" },
  { value: "signal", label: "Sinal de Negócio" },
  { value: "payment_pending", label: "Pgto Pendente" },
];

const qualificationOptions = [
  { value: "ruim", label: "Ruim" },
  { value: "medio", label: "Médio" },
  { value: "bom", label: "Bom" },
  { value: "excelente", label: "Excelente" },
];

const sourceOptions = [
  { value: "instagram_organico", label: "Instagram Orgânico" },
  { value: "compra_hotmart", label: "Compra Hotmart" },
  { value: "forms_bio", label: "Forms Bio" },
  { value: "forms_lista_espera", label: "Forms Lista de Espera" },
  { value: "forms_youtube", label: "Forms YouTube" },
  { value: "trafego_pago", label: "Tráfego Pago" },
  { value: "youtube", label: "YouTube" },
  { value: "indicacao", label: "Indicação" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook_ads", label: "Facebook Ads" },
];

const monthOptions = Array.from({ length: 12 }, (_, i) => {
  const m = new Date(2026, i, 1);
  return {
    value: `${m.getFullYear()}-${String(i + 1).padStart(2, "0")}`,
    label: m.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
  };
});

/* ─── Main Panel ─── */
export function LeadDetailPanel({ lead, onClose, onFieldUpdate }: LeadDetailPanelProps) {
  const isMobile = useIsMobile();
  const [closers, setClosers] = useState<{ user_id: string; full_name: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"ficha" | "conversa" | "notas" | "tarefas">("ficha");

  useEffect(() => {
    // Fetch closers for selection
    const fetchClosers = async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("role", ["closer"]);
      if (!roles || roles.length === 0) return;
      const closerIds = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", closerIds);
      if (profiles) setClosers(profiles);
    };
    fetchClosers();
  }, []);

  const saveField = useCallback(async (field: string, value: any) => {
    if (onFieldUpdate) {
      const ok = await onFieldUpdate(lead.id, field, value);
      if (ok) toast({ title: "Salvo", description: `${field} atualizado.` });
      else toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
    }
  }, [lead.id, onFieldUpdate]);

  const tabs = [
    { id: "ficha" as const, label: "Ficha", icon: FileText },
    { id: "conversa" as const, label: "Chat", icon: MessageCircle },
    { id: "notas" as const, label: "Notas", icon: FileText },
    { id: "tarefas" as const, label: "Tarefas", icon: CheckCircle2 },
  ];

  const closerOptions = closers.map((c) => ({ value: c.user_id, label: c.full_name }));
  // Default closer (Micharlison)
  const defaultCloser = closers.find((c) => c.full_name.toLowerCase().includes("micharlison"));

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />
      <div className={`fixed top-0 h-full bg-card border-l border-border z-50 flex flex-col animate-slide-in ${
        isMobile ? "left-0 right-0 w-full" : "right-0 w-[560px]"
      }`}>
        {/* Header */}
        <div className="h-14 px-4 md:px-5 flex items-center justify-between border-b border-border shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-card-foreground truncate">{lead.name}</h2>
            <p className="text-xs text-muted-foreground truncate">{lead.source ? sourceOptions.find(s => s.value === lead.source)?.label || lead.source : "Sem origem"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors shrink-0 ml-2">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-2 md:px-5 border-b border-border flex gap-0 shrink-0 overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => (
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
        <div className="flex-1 overflow-y-auto p-4 md:p-5 scrollbar-thin">
          {activeTab === "ficha" && (
            <LeadFichaTab lead={lead} saveField={saveField} closerOptions={closerOptions} defaultCloserId={defaultCloser?.user_id} />
          )}
          {activeTab === "conversa" && <ConversationTab leadId={lead.id} />}
          {activeTab === "notas" && <NotesTab leadId={lead.id} />}
          {activeTab === "tarefas" && <TasksTab leadId={lead.id} />}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── FICHA TAB (Main lead card) ─── */
/* ═══════════════════════════════════════════ */
function LeadFichaTab({
  lead,
  saveField,
  closerOptions,
  defaultCloserId,
}: {
  lead: DBLead;
  saveField: (field: string, value: any) => void;
  closerOptions: { value: string; label: string }[];
  defaultCloserId?: string;
}) {
  return (
    <div className="space-y-4">
      {/* 1 — Informações Básicas */}
      <BlockSection title="Informações do Cliente" icon={Users}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InlineField label="Nome" value={lead.name} onSave={(v) => saveField("name", v)} icon={Users} placeholder="Nome do cliente" />
          <InlineField label="Telefone / WhatsApp" value={lead.phone} onSave={(v) => saveField("phone", v)} icon={Phone} placeholder="+55 11 99999-9999" />
          <InlineField label="Email" value={lead.email} onSave={(v) => saveField("email", v)} icon={Mail} placeholder="email@exemplo.com" />
          <InlineField label="Instagram" value={lead.instagram} onSave={(v) => saveField("instagram", v)} icon={Instagram} placeholder="@usuario" />
          <InlineField label="País" value={lead.country} onSave={(v) => saveField("country", v)} icon={Globe} placeholder="Brasil" />
        </div>
      </BlockSection>

      {/* 2 — Origem */}
      <BlockSection title="Origem do Lead" icon={Eye}>
        <InlineField
          label="Origem"
          value={lead.source}
          onSave={(v) => saveField("source", v)}
          type="select"
          options={sourceOptions}
          placeholder="Selecionar origem..."
        />
      </BlockSection>

      {/* 3 — Grupo */}
      <BlockSection title="Informações do Grupo" icon={Users}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InlineField label="Número do Grupo" value={lead.group_number} onSave={(v) => saveField("group_number", v)} placeholder="Ex: 001" />
          <InlineField label="Link do Grupo" value={lead.group_link} onSave={(v) => saveField("group_link", v)} type="link" icon={Link2} placeholder="https://chat.whatsapp.com/..." />
        </div>
      </BlockSection>

      {/* 4 — Agendamento */}
      <BlockSection title="Agendamento" icon={CalendarDays}>
        <InlineField
          label="Data do Agendamento"
          value={lead.scheduling_date}
          onSave={(v) => saveField("scheduling_date", v)}
          type="date"
          icon={CalendarDays}
        />
        <p className="text-[10px] text-muted-foreground italic">
          PADRAO NOMENCLATURA 007 - ALTERAR · Integração Google Agenda será configurada em breve.
        </p>
      </BlockSection>

      {/* 5 — Comparecimento */}
      <BlockSection title="Comparecimento" icon={CheckCircle2}>
        <CheckboxField
          label="Realizou a consultoria"
          checked={lead.consultation_done}
          onChange={(v) => saveField("consultation_done", v)}
          icon={CheckCircle2}
        />
      </BlockSection>

      {/* 6 — Closer + Resultado */}
      <BlockSection title="Resultado da Consultoria" icon={DollarSign}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InlineField
            label="Closer Responsável"
            value={lead.closer_id || defaultCloserId || null}
            onSave={(v) => saveField("closer_id", v)}
            type="select"
            options={closerOptions}
            placeholder="Selecionar closer..."
          />
          <InlineField
            label="Vendeu?"
            value={lead.sale_status}
            onSave={(v) => saveField("sale_status", v)}
            type="select"
            options={saleStatusOptions}
            placeholder="Status da venda..."
          />
          <InlineField
            label="Valor da Venda"
            value={lead.value_estimate != null ? String(lead.value_estimate) : null}
            onSave={(v) => saveField("value_estimate", v ? Number(v) : null)}
            icon={DollarSign}
            placeholder="0.00"
          />
          <InlineField
            label="Corresponde ao Mês"
            value={lead.reference_month}
            onSave={(v) => saveField("reference_month", v)}
            type="select"
            options={monthOptions}
            placeholder="Selecionar mês..."
            icon={Clock}
          />
        </div>
      </BlockSection>

      {/* 7 — Gravação */}
      <BlockSection title="Gravação da Call" icon={Video}>
        <InlineField
          label="Link da Gravação"
          value={lead.call_recording_link}
          onSave={(v) => saveField("call_recording_link", v)}
          type="link"
          icon={Video}
          placeholder="Cole o link da gravação..."
        />
      </BlockSection>

      {/* 8 — Resumo & Avaliação */}
      <BlockSection title="Resumo & Avaliação" icon={Star}>
        <InlineField
          label="Resumo do Agendamento (IA)"
          value={lead.scheduling_summary}
          onSave={(v) => saveField("scheduling_summary", v)}
          placeholder="O resumo será gerado automaticamente pela IA quando a conversa for marcada como agendada..."
          multiline
        />
        <InlineField
          label="Avaliação do SDR (IA)"
          value={lead.sdr_evaluation}
          onSave={(v) => saveField("sdr_evaluation", v)}
          placeholder="A avaliação será gerada automaticamente com base no SCRIPT UNIVERSAL SDR 1.0..."
          multiline
        />
        <InlineField
          label="Nota de Qualificação"
          value={lead.qualification_score}
          onSave={(v) => saveField("qualification_score", v)}
          type="select"
          options={qualificationOptions}
          icon={Star}
          placeholder="Selecionar nota..."
        />
        <InlineField
          label="Observações do SDR"
          value={lead.sdr_observations}
          onSave={(v) => saveField("sdr_observations", v)}
          placeholder="Dificuldades, ideias, sugestões, feedbacks..."
          multiline
        />
        <InlineField
          label="Observações Gerais"
          value={lead.observations}
          onSave={(v) => saveField("observations", v)}
          placeholder="Qualquer informação adicional relevante..."
          multiline
        />
      </BlockSection>

      {/* Tags */}
      <BlockSection title="Tags" icon={FileText}>
        <div className="flex flex-wrap gap-1">
          {lead.tags.length > 0 ? lead.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
          )) : <span className="text-xs text-muted-foreground italic">Nenhuma tag</span>}
        </div>
      </BlockSection>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── CONVERSATION TAB ─── */
/* ═══════════════════════════════════════════ */
function ConversationTab({ leadId }: { leadId: string }) {
  const [messages, setMessages] = useState<{ id: string; text: string; from: string; time: string }[]>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, {
      id: `local-${Date.now()}`,
      text: input,
      from: "sdr",
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    }]);
    setInput("");
    toast({ title: "Mensagem registrada" });
  };

  return (
    <div className="space-y-3">
      {messages.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conversa registrada.</p>}
      {messages.map((msg) => (
        <div key={msg.id} className={`flex gap-2 ${msg.from === "sdr" ? "justify-end" : ""}`}>
          <div className={`rounded-lg px-3 py-2 max-w-[85%] ${msg.from === "sdr" ? "bg-primary/10 rounded-tr-none" : "bg-muted rounded-tl-none"}`}>
            <p className="text-sm text-foreground">{msg.text}</p>
            <span className="text-[10px] text-muted-foreground mt-1 block">{msg.time}</span>
          </div>
        </div>
      ))}
      <div className="mt-6 flex items-center gap-2 border border-input rounded-lg p-2">
        <input type="text" placeholder="Digite sua mensagem..." value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground min-w-0" />
        <button onClick={handleSend} disabled={!input.trim()} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 shrink-0">
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── NOTES TAB ─── */
/* ═══════════════════════════════════════════ */
function NotesTab({ leadId }: { leadId: string }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<{ id: string; content: string; created_at: string }[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!noteInput.trim() || !user) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("lead_notes")
      .insert({ lead_id: leadId, user_id: user.id, content: noteInput })
      .select()
      .single();

    if (!error && data) {
      setNotes(prev => [data, ...prev]);
      setNoteInput("");
      toast({ title: "Nota salva" });
    } else {
      toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <textarea placeholder="Adicionar uma nota..." value={noteInput} onChange={(e) => setNoteInput(e.target.value)}
          className="flex-1 h-20 rounded-lg border border-input bg-muted/30 p-3 text-sm placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring resize-none" />
      </div>
      <button onClick={handleSave} disabled={saving || !noteInput.trim()}
        className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
        <Plus className="w-3.5 h-3.5" /> Salvar Nota
      </button>
      {notes.map((note) => (
        <div key={note.id} className="p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground mb-1">{new Date(note.created_at).toLocaleDateString("pt-BR")}</p>
          <p className="text-sm text-foreground">{note.content}</p>
        </div>
      ))}
      {notes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma nota registrada.</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── TASKS TAB ─── */
/* ═══════════════════════════════════════════ */
function TasksTab({ leadId }: { leadId: string }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<{ id: string; title: string; status: string }[]>([]);
  const [taskInput, setTaskInput] = useState("");

  const handleAdd = async () => {
    if (!taskInput.trim() || !user) return;
    const { data, error } = await supabase
      .from("tasks")
      .insert({ lead_id: leadId, user_id: user.id, title: taskInput, status: "pending" })
      .select()
      .single();

    if (!error && data) {
      setTasks(prev => [...prev, data]);
      setTaskInput("");
      toast({ title: "Tarefa criada" });
    }
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === "pending" ? "done" : "pending";
    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input type="text" placeholder="Nova tarefa..." value={taskInput} onChange={(e) => setTaskInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          className="flex-1 h-8 rounded-md border border-input bg-muted/30 px-3 text-sm placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring min-w-0" />
        <button onClick={handleAdd} disabled={!taskInput.trim()}
          className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 shrink-0">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {tasks.map((task) => (
        <div key={task.id} onClick={() => toggleTask(task.id)} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border cursor-pointer">
          <div className={`w-4 h-4 rounded border-2 shrink-0 ${task.status === "done" ? "bg-primary border-primary" : "border-muted-foreground"}`} />
          <span className={`text-sm flex-1 ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</span>
        </div>
      ))}
      {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa. Adicione acima.</p>}
    </div>
  );
}
