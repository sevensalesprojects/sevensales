import { DBLead } from "@/hooks/useLeads";
import {
  X, Phone, Mail, Instagram, Globe, Users, Link2, CalendarDays,
  CheckCircle2, Video, FileText, MessageCircle, Star, Eye,
  DollarSign, Clock, Send, Plus, ChevronDown, ExternalLink, Tag, Trash2
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProject } from "@/contexts/ProjectContext";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface LeadDetailPanelProps {
  lead: DBLead;
  onClose: () => void;
  onFieldUpdate?: (leadId: string, field: string, value: any) => Promise<boolean>;
  onLeadChanged?: () => void;
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
  { value: "Instagram Orgânico", label: "Instagram Orgânico" },
  { value: "compra_hotmart", label: "Compra Hotmart" },
  { value: "forms_bio", label: "Forms Bio" },
  { value: "forms_lista_espera", label: "Forms Lista de Espera" },
  { value: "forms_youtube", label: "Forms YouTube" },
  { value: "Tráfego Pago", label: "Tráfego Pago" },
  { value: "YouTube", label: "YouTube" },
  { value: "Indicação", label: "Indicação" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Facebook Ads", label: "Facebook Ads" },
];

const countryOptions = [
  { value: "Brasil", label: "Brasil" },
  { value: "Portugal", label: "Portugal" },
  { value: "Estados Unidos", label: "Estados Unidos" },
  { value: "Outro", label: "Outro" },
];

const monthOptions = Array.from({ length: 12 }, (_, i) => {
  const m = new Date(2026, i, 1);
  return {
    value: `${m.getFullYear()}-${String(i + 1).padStart(2, "0")}`,
    label: m.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
  };
});

/* ─── Main Panel ─── */
export function LeadDetailPanel({ lead, onClose, onFieldUpdate, onLeadChanged }: LeadDetailPanelProps) {
  const isMobile = useIsMobile();
  const [closers, setClosers] = useState<{ user_id: string; full_name: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"ficha" | "conversa" | "notas" | "tarefas">("ficha");
  const [localLead, setLocalLead] = useState<DBLead>(lead);

  useEffect(() => { setLocalLead(lead); }, [lead]);

  useEffect(() => {
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
      const ok = await onFieldUpdate(localLead.id, field, value);
      if (ok) {
        setLocalLead(prev => ({ ...prev, [field]: value }));
        toast({ title: "Salvo", description: `Campo atualizado.` });
        onLeadChanged?.();
      } else {
        toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
      }
    }
  }, [localLead.id, onFieldUpdate, onLeadChanged]);

  const tabs = [
    { id: "ficha" as const, label: "Ficha", icon: FileText },
    { id: "conversa" as const, label: "Chat", icon: MessageCircle },
    { id: "notas" as const, label: "Notas", icon: FileText },
    { id: "tarefas" as const, label: "Tarefas", icon: CheckCircle2 },
  ];

  const closerOptions = closers.map((c) => ({ value: c.user_id, label: c.full_name }));

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />
      <div className={`fixed top-0 h-full bg-card border-l border-border z-50 flex flex-col animate-slide-in ${
        isMobile ? "left-0 right-0 w-full" : "right-0 w-[560px]"
      }`}>
        {/* Header */}
        <div className="h-14 px-4 md:px-5 flex items-center justify-between border-b border-border shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-card-foreground truncate">{localLead.name}</h2>
            <p className="text-xs text-muted-foreground truncate">{localLead.source || "Sem origem"}</p>
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
            <LeadFichaTab lead={localLead} saveField={saveField} closerOptions={closerOptions} />
          )}
          {activeTab === "conversa" && <ConversationTab leadId={localLead.id} />}
          {activeTab === "notas" && <NotesTab leadId={localLead.id} />}
          {activeTab === "tarefas" && <TasksTab leadId={localLead.id} />}
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
}: {
  lead: DBLead;
  saveField: (field: string, value: any) => void;
  closerOptions: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-4">
      {/* 1 — Informações Básicas */}
      <BlockSection title="Informações do Cliente" icon={Users}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InlineField label="Nome" value={lead.name} onSave={(v) => saveField("name", v)} icon={Users} placeholder="Nome do cliente" />
          <InlineField label="Telefone / WhatsApp" value={lead.phone} onSave={(v) => saveField("phone", v)} icon={Phone} placeholder="+55 11 99999-9999" />
          <InlineField label="Email" value={lead.email} onSave={(v) => saveField("email", v)} icon={Mail} placeholder="email@exemplo.com" />
          <InlineField label="Instagram" value={lead.instagram} onSave={(v) => {
            const cleaned = v ? v.replace(/^@/, "") : null;
            saveField("instagram", cleaned ? `@${cleaned}` : null);
          }} icon={Instagram} placeholder="@usuario" />
          <InlineField
            label="País"
            value={lead.country}
            onSave={(v) => saveField("country", v)}
            icon={Globe}
            type="select"
            options={countryOptions}
            placeholder="Selecionar país..."
          />
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
            value={lead.closer_id || null}
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
          placeholder="O resumo será gerado automaticamente pela IA..."
          multiline
        />
        <InlineField
          label="Avaliação do SDR (IA)"
          value={lead.sdr_evaluation}
          onSave={(v) => saveField("sdr_evaluation", v)}
          placeholder="A avaliação será gerada automaticamente..."
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
      <TagsSection leadId={lead.id} tags={lead.tags} />

      {/* Follow-up */}
      <FollowupSection leadId={lead.id} />
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── TAGS SECTION ─── */
/* ═══════════════════════════════════════════ */
function TagsSection({ leadId, tags }: { leadId: string; tags: string[] }) {
  const { currentProject } = useProject();
  const [allTags, setAllTags] = useState<{ id: string; name: string; color: string | null }[]>([]);
  const [leadTagIds, setLeadTagIds] = useState<{ tag_id: string; id: string }[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [localTags, setLocalTags] = useState<string[]>(tags);

  useEffect(() => { setLocalTags(tags); }, [tags]);

  useEffect(() => {
    if (!currentProject) return;
    const fetchTags = async () => {
      const { data: projectTags } = await supabase.from("tags").select("id, name, color").eq("project_id", currentProject.id);
      if (projectTags) setAllTags(projectTags);

      const { data: lt } = await supabase.from("lead_tags").select("id, tag_id").eq("lead_id", leadId);
      if (lt) setLeadTagIds(lt);
    };
    fetchTags();
  }, [leadId, currentProject]);

  const assignedTagIds = leadTagIds.map(lt => lt.tag_id);
  const availableTags = allTags.filter(t => !assignedTagIds.includes(t.id));

  const addTag = async (tagId: string) => {
    const { data, error } = await supabase.from("lead_tags").insert({ lead_id: leadId, tag_id: tagId }).select().single();
    if (!error && data) {
      setLeadTagIds(prev => [...prev, { tag_id: tagId, id: data.id }]);
      const tagName = allTags.find(t => t.id === tagId)?.name;
      if (tagName) setLocalTags(prev => [...prev, tagName]);
      toast({ title: "Tag adicionada" });
    }
    setShowAdd(false);
  };

  const removeTag = async (tagId: string) => {
    const ltEntry = leadTagIds.find(lt => lt.tag_id === tagId);
    if (!ltEntry) return;
    const { error } = await supabase.from("lead_tags").delete().eq("id", ltEntry.id);
    if (!error) {
      setLeadTagIds(prev => prev.filter(lt => lt.tag_id !== tagId));
      const tagName = allTags.find(t => t.id === tagId)?.name;
      if (tagName) setLocalTags(prev => prev.filter(t => t !== tagName));
      toast({ title: "Tag removida" });
    }
  };

  return (
    <BlockSection title="Tags" icon={Tag}>
      <div className="flex flex-wrap gap-1.5">
        {assignedTagIds.map(tagId => {
          const tag = allTags.find(t => t.id === tagId);
          if (!tag) return null;
          return (
            <span key={tagId} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1 group">
              {tag.name}
              <button onClick={() => removeTag(tagId)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3 text-destructive" />
              </button>
            </span>
          );
        })}
        {localTags.filter(t => !allTags.some(at => at.name === t && assignedTagIds.includes(at.id))).map(tag => (
          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
        ))}
        {availableTags.length > 0 && (
          <div className="relative">
            <button onClick={() => setShowAdd(!showAdd)} className="text-xs px-2 py-0.5 rounded-full border border-dashed border-muted-foreground text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" /> Tag
            </button>
            {showAdd && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[150px] max-h-[200px] overflow-y-auto">
                {availableTags.map(tag => (
                  <button key={tag.id} onClick={() => addTag(tag.id)} className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors">
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {localTags.length === 0 && assignedTagIds.length === 0 && availableTags.length === 0 && (
          <span className="text-xs text-muted-foreground italic">Nenhuma tag disponível</span>
        )}
      </div>
    </BlockSection>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── CONVERSATION TAB ─── */
/* ═══════════════════════════════════════════ */
function ConversationTab({ leadId }: { leadId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<{ id: string; content: string; direction: string; created_at: string; channel: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("messages")
        .select("id, content, direction, created_at, channel")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
      setLoading(false);
    };
    fetchMessages();
  }, [leadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    const { data, error } = await supabase
      .from("messages")
      .insert({
        lead_id: leadId,
        content: input,
        direction: "outbound",
        channel: "whatsapp",
        sender_id: user.id,
      })
      .select()
      .single();

    if (!error && data) {
      setMessages(prev => [...prev, data]);
      setInput("");
      toast({ title: "Mensagem registrada" });
    } else {
      toast({ title: "Erro", description: "Não foi possível enviar.", variant: "destructive" });
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground text-center py-8">Carregando mensagens...</p>;

  return (
    <div className="space-y-3">
      {messages.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conversa registrada.</p>}
      {messages.map((msg) => (
        <div key={msg.id} className={`flex gap-2 ${msg.direction === "outbound" ? "justify-end" : ""}`}>
          <div className={`rounded-lg px-3 py-2 max-w-[85%] ${msg.direction === "outbound" ? "bg-primary/10 rounded-tr-none" : "bg-muted rounded-tl-none"}`}>
            <p className="text-sm text-foreground">{msg.content}</p>
            <span className="text-[10px] text-muted-foreground mt-1 block">
              {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("lead_notes")
        .select("id, content, created_at")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      if (data) setNotes(data);
      setLoading(false);
    };
    fetchNotes();
  }, [leadId]);

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

  if (loading) return <p className="text-sm text-muted-foreground text-center py-8">Carregando notas...</p>;

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("tasks")
        .select("id, title, status")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      if (data) setTasks(data);
      setLoading(false);
    };
    fetchTasks();
  }, [leadId]);

  const handleAdd = async () => {
    if (!taskInput.trim() || !user) return;
    const { data, error } = await supabase
      .from("tasks")
      .insert({ lead_id: leadId, user_id: user.id, title: taskInput, status: "pending" })
      .select()
      .single();

    if (!error && data) {
      setTasks(prev => [data, ...prev]);
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

  if (loading) return <p className="text-sm text-muted-foreground text-center py-8">Carregando tarefas...</p>;

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
