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
import { formatCurrency } from "@/lib/currency";

interface LeadDetailPanelProps {
  lead: DBLead;
  onClose: () => void;
  onFieldUpdate?: (leadId: string, field: string, value: any) => Promise<boolean>;
  onLeadChanged?: () => void;
}

/* ─── Auto-save field with logging ─── */
function AutoField({
  label, value, field, leadId, userId, onSave,
  icon: Icon, type = "text", options, placeholder, multiline,
}: {
  label: string;
  value: string | null;
  field: string;
  leadId: string;
  userId?: string;
  onSave: (field: string, value: any) => void;
  icon?: any;
  type?: "text" | "select" | "date" | "link" | "currency";
  options?: { value: string; label: string }[];
  placeholder?: string;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const inputRef = useRef<any>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => { setDraft(value || ""); }, [value]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const logAndSave = useCallback((newVal: string | null) => {
    if (newVal === (value || null)) return;
    onSave(field, newVal);
    // Log activity
    if (userId) {
      supabase.from("lead_activity_logs").insert({
        lead_id: leadId, user_id: userId, action: `${field}_updated`,
        field_changed: field, old_value: value || null, new_value: newVal,
      } as any).then(() => {});
    }
  }, [field, leadId, userId, value, onSave]);

  // For select/date - save immediately onChange
  if (type === "select" && options) {
    return (
      <div className="group">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
          {Icon && <Icon className="w-3 h-3" />} {label}
        </p>
        <select
          value={value || ""}
          onChange={(e) => logAndSave(e.target.value || null)}
          className="w-full text-sm bg-transparent border border-transparent hover:border-input focus:border-ring rounded px-1 py-0.5 outline-none cursor-pointer text-foreground"
        >
          <option value="">{placeholder || "Selecionar..."}</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
          onChange={(e) => logAndSave(e.target.value ? new Date(e.target.value).toISOString() : null)}
          className="w-full text-sm bg-transparent border border-transparent hover:border-input focus:border-ring rounded px-1 py-0.5 outline-none text-foreground"
        />
      </div>
    );
  }

  // For text/link/currency - debounce auto-save
  const handleChange = (newDraft: string) => {
    setDraft(newDraft);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const finalVal = newDraft.trim() || null;
      if (type === "currency") {
        logAndSave(finalVal ? String(Number(finalVal.replace(/[^0-9.,-]/g, "").replace(",", "."))) : null);
      } else {
        logAndSave(finalVal);
      }
    }, 800);
  };

  const commit = () => {
    setEditing(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const finalVal = draft.trim() || null;
    if (type === "currency") {
      logAndSave(finalVal ? String(Number(finalVal.replace(/[^0-9.,-]/g, "").replace(",", "."))) : null);
    } else {
      logAndSave(finalVal);
    }
  };

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
            ref={inputRef}
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Escape") { setDraft(value || ""); setEditing(false); } }}
            placeholder={placeholder}
            className="w-full text-sm bg-muted/30 border border-input rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-ring resize-none min-h-[60px] text-foreground"
            rows={3}
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
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
  label, checked, onChange, icon: Icon,
}: {
  label: string; checked: boolean; onChange: (val: boolean) => void; icon?: any;
}) {
  return (
    <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => onChange(!checked)}>
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

/* ─── Options ─── */
const saleStatusOptions = [
  { value: "pending", label: "Pendente" },
  { value: "sold", label: "Ganho" },
  { value: "lost", label: "Perdido" },
];

const qualificationOptions = [
  { value: "muito_qualificado", label: "Muito qualificado" },
  { value: "qualificado", label: "Qualificado" },
  { value: "pouco_qualificado", label: "Pouco qualificado" },
  { value: "desqualificado", label: "Desqualificado" },
];

const sourceOptions = [
  { value: "Instagram", label: "Instagram" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Indicação", label: "Indicação" },
  { value: "Tráfego Pago", label: "Tráfego Pago" },
  { value: "YouTube", label: "YouTube" },
  { value: "Orgânico", label: "Orgânico" },
  { value: "Outro", label: "Outro" },
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

/* ═════════════════════════════════════════════ */
/* ─── MAIN PANEL ─── */
/* ═════════════════════════════════════════════ */
export function LeadDetailPanel({ lead, onClose, onFieldUpdate, onLeadChanged }: LeadDetailPanelProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { currentProject } = useProject();
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
    // Validation rules
    if (field === "name" && typeof value === "string" && value.length < 2) {
      toast({ title: "Erro", description: "Nome deve ter pelo menos 2 caracteres.", variant: "destructive" });
      return;
    }
    if (field === "value_estimate" && value !== null && Number(value) < 0) {
      toast({ title: "Erro", description: "Valor da venda deve ser >= 0.", variant: "destructive" });
      return;
    }
    if (field === "sale_status" && value === "sold") {
      if (!localLead.value_estimate && !localLead.closer_id) {
        toast({ title: "Atenção", description: "Para marcar como Ganho, preencha o valor e o closer.", variant: "destructive" });
      }
    }

    if (onFieldUpdate) {
      const ok = await onFieldUpdate(localLead.id, field, value);
      if (ok) {
        setLocalLead(prev => ({ ...prev, [field]: value }));
        onLeadChanged?.();
      } else {
        toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
      }
    }
  }, [localLead.id, localLead.value_estimate, localLead.closer_id, onFieldUpdate, onLeadChanged]);

  const closerOptions = closers.map((c) => ({ value: c.user_id, label: c.full_name }));
  const currencyCode = currentProject?.currency_code || "BRL";

  const tabs = [
    { id: "ficha" as const, label: "Ficha", icon: FileText },
    { id: "conversa" as const, label: "Chat", icon: MessageCircle },
    { id: "notas" as const, label: "Notas", icon: FileText },
    { id: "tarefas" as const, label: "Tarefas", icon: CheckCircle2 },
  ];

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
            <LeadFichaTab lead={localLead} saveField={saveField} closerOptions={closerOptions} userId={user?.id} currencyCode={currencyCode} />
          )}
          {activeTab === "conversa" && <ConversationTab leadId={localLead.id} />}
          {activeTab === "notas" && <NotesTab leadId={localLead.id} />}
          {activeTab === "tarefas" && <TasksTab leadId={localLead.id} />}
        </div>
      </div>
    </>
  );
}

/* ═════════════════════════════════════════════ */
/* ─── FICHA TAB ─── */
/* ═════════════════════════════════════════════ */
function LeadFichaTab({
  lead, saveField, closerOptions, userId, currencyCode,
}: {
  lead: DBLead;
  saveField: (field: string, value: any) => void;
  closerOptions: { value: string; label: string }[];
  userId?: string;
  currencyCode: string;
}) {
  return (
    <div className="space-y-4">
      {/* BLOCO 1 — Informações do Cliente */}
      <BlockSection title="Informações do Cliente" icon={Users}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AutoField label="Nome" value={lead.name} field="name" leadId={lead.id} userId={userId} onSave={saveField} icon={Users} placeholder="Nome do cliente" />
          <AutoField label="Telefone / WhatsApp" value={lead.phone} field="phone" leadId={lead.id} userId={userId} onSave={saveField} icon={Phone} placeholder="+55 11 99999-9999" />
          <AutoField label="Email" value={lead.email} field="email" leadId={lead.id} userId={userId} onSave={saveField} icon={Mail} placeholder="email@exemplo.com" />
          <AutoField label="Instagram" value={lead.instagram} field="instagram" leadId={lead.id} userId={userId}
            onSave={(f, v) => {
              const cleaned = v ? String(v).replace(/^@/, "") : null;
              saveField(f, cleaned ? `@${cleaned}` : null);
            }} icon={Instagram} placeholder="@usuario" />
          <AutoField label="País" value={lead.country} field="country" leadId={lead.id} userId={userId} onSave={saveField}
            icon={Globe} type="select" options={countryOptions} placeholder="Selecionar país..." />
        </div>
      </BlockSection>

      {/* BLOCO 2 — Origem */}
      <BlockSection title="Origem do Lead" icon={Eye}>
        <AutoField label="Origem" value={lead.source} field="source" leadId={lead.id} userId={userId} onSave={saveField}
          type="select" options={sourceOptions} placeholder="Selecionar origem..." />
      </BlockSection>

      {/* BLOCO 3 — Grupo */}
      <BlockSection title="Informações do Grupo" icon={Users}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AutoField label="Número do Grupo" value={lead.group_number} field="group_number" leadId={lead.id} userId={userId} onSave={saveField} placeholder="Ex: 001" />
          <AutoField label="Link do Grupo" value={lead.group_link} field="group_link" leadId={lead.id} userId={userId} onSave={saveField} type="link" icon={Link2} placeholder="https://chat.whatsapp.com/..." />
        </div>
      </BlockSection>

      {/* BLOCO 4 — Agendamento */}
      <BlockSection title="Agendamento" icon={CalendarDays}>
        <AutoField label="Data do Agendamento" value={lead.scheduling_date} field="scheduling_date" leadId={lead.id} userId={userId} onSave={saveField} type="date" icon={CalendarDays} />
      </BlockSection>

      {/* BLOCO 5 — Comparecimento */}
      <BlockSection title="Comparecimento" icon={CheckCircle2}>
        <CheckboxField
          label="Realizou a consultoria"
          checked={lead.consultation_done}
          onChange={(v) => {
            saveField("consultation_done", v);
            if (v && userId) {
              supabase.from("lead_activity_logs").insert({
                lead_id: lead.id, user_id: userId, action: "call_attended",
                field_changed: "consultation_done", old_value: "false", new_value: "true",
              } as any).then(() => {});
            }
          }}
          icon={CheckCircle2}
        />
      </BlockSection>

      {/* BLOCO 6 — Resultado */}
      <BlockSection title="Resultado da Consultoria" icon={DollarSign}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AutoField label="Closer Responsável" value={lead.closer_id || null} field="closer_id" leadId={lead.id} userId={userId} onSave={saveField}
            type="select" options={closerOptions} placeholder="Selecionar closer..." />
          <AutoField label="Vendeu?" value={lead.sale_status} field="sale_status" leadId={lead.id} userId={userId} onSave={saveField}
            type="select" options={saleStatusOptions} placeholder="Status da venda..." />
          <AutoField label="Valor da Venda" value={lead.value_estimate != null ? String(lead.value_estimate) : null} field="value_estimate" leadId={lead.id} userId={userId}
            onSave={(f, v) => saveField(f, v ? Number(v) : null)} icon={DollarSign} placeholder="0.00" type="currency" />
          <AutoField label="Corresponde ao Mês" value={lead.reference_month} field="reference_month" leadId={lead.id} userId={userId} onSave={saveField}
            type="select" options={monthOptions} placeholder="Selecionar mês..." icon={Clock} />
        </div>
      </BlockSection>

      {/* BLOCO 7 — Gravação */}
      <BlockSection title="Gravação da Call" icon={Video}>
        <AutoField label="Link da Gravação" value={lead.call_recording_link} field="call_recording_link" leadId={lead.id} userId={userId} onSave={saveField}
          type="link" icon={Video} placeholder="Cole o link da gravação..." />
      </BlockSection>

      {/* BLOCO 8 — Resumo & Avaliação */}
      <BlockSection title="Resumo & Avaliação" icon={Star}>
        <div className="p-2.5 rounded-md bg-muted/30 border border-border mb-2">
          <p className="text-[10px] uppercase text-muted-foreground mb-1">Resumo do Agendamento (IA)</p>
          <p className="text-sm text-muted-foreground italic">{lead.scheduling_summary || "Será preenchido automaticamente pela IA"}</p>
        </div>
        <div className="p-2.5 rounded-md bg-muted/30 border border-border mb-2">
          <p className="text-[10px] uppercase text-muted-foreground mb-1">Avaliação do SDR (IA)</p>
          <p className="text-sm text-muted-foreground italic">{lead.sdr_evaluation || "Será gerado automaticamente"}</p>
        </div>
        <AutoField label="Nota de Qualificação" value={lead.qualification_score} field="qualification_score" leadId={lead.id} userId={userId} onSave={saveField}
          type="select" options={qualificationOptions} icon={Star} placeholder="Selecionar nota..." />
        <AutoField label="Observações do SDR" value={lead.sdr_observations} field="sdr_observations" leadId={lead.id} userId={userId} onSave={saveField}
          placeholder="Dificuldades, ideias, sugestões, feedbacks..." multiline />
        <AutoField label="Observações Gerais" value={lead.observations} field="observations" leadId={lead.id} userId={userId} onSave={saveField}
          placeholder="Qualquer informação adicional relevante..." multiline />
      </BlockSection>

      {/* BLOCO 9 — Tags */}
      <TagsSection leadId={lead.id} tags={lead.tags} />

      {/* Follow-up */}
      <FollowupSection leadId={lead.id} />

      {/* Activity Log */}
      <ActivityLogSection leadId={lead.id} />
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
      const { data } = await supabase.from("messages").select("id, content, direction, created_at, channel").eq("lead_id", leadId).order("created_at", { ascending: true });
      if (data) setMessages(data);
      setLoading(false);
    };
    fetchMessages();
  }, [leadId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    const { data, error } = await supabase.from("messages").insert({ lead_id: leadId, content: input, direction: "outbound", channel: "whatsapp", sender_id: user.id }).select().single();
    if (!error && data) { setMessages(prev => [...prev, data]); setInput(""); toast({ title: "Mensagem registrada" }); }
  };

  if (loading) return <p className="text-sm text-muted-foreground text-center py-8">Carregando mensagens...</p>;

  return (
    <div className="space-y-3">
      {messages.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conversa registrada.</p>}
      {messages.map((msg) => (
        <div key={msg.id} className={`flex gap-2 ${msg.direction === "outbound" ? "justify-end" : ""}`}>
          <div className={`rounded-lg px-3 py-2 max-w-[85%] ${msg.direction === "outbound" ? "bg-primary/10 rounded-tr-none" : "bg-muted rounded-tl-none"}`}>
            <p className="text-sm text-foreground">{msg.content}</p>
            <span className="text-[10px] text-muted-foreground mt-1 block">{new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
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
      const { data } = await supabase.from("lead_notes").select("id, content, created_at").eq("lead_id", leadId).order("created_at", { ascending: false });
      if (data) setNotes(data);
      setLoading(false);
    };
    fetchNotes();
  }, [leadId]);

  const handleSave = async () => {
    if (!noteInput.trim() || !user) return;
    setSaving(true);
    const { data, error } = await supabase.from("lead_notes").insert({ lead_id: leadId, user_id: user.id, content: noteInput }).select().single();
    if (!error && data) { setNotes(prev => [data, ...prev]); setNoteInput(""); toast({ title: "Nota salva" }); }
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
      const { data } = await supabase.from("tasks").select("id, title, status").eq("lead_id", leadId).order("created_at", { ascending: false });
      if (data) setTasks(data);
      setLoading(false);
    };
    fetchTasks();
  }, [leadId]);

  const handleAdd = async () => {
    if (!taskInput.trim() || !user) return;
    const { data, error } = await supabase.from("tasks").insert({ lead_id: leadId, user_id: user.id, title: taskInput, status: "pending" }).select().single();
    if (!error && data) { setTasks(prev => [data, ...prev]); setTaskInput(""); toast({ title: "Tarefa criada" }); }
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

/* ═══════════════════════════════════════════ */
/* ─── FOLLOWUP SECTION ─── */
/* ═══════════════════════════════════════════ */
function FollowupSection({ leadId }: { leadId: string }) {
  const [tasks, setTasks] = useState<{ id: string; due_at: string; status: string; message_text?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const { data } = await supabase.from("followup_tasks").select("id, due_at, status, message_id").eq("lead_id", leadId).order("due_at", { ascending: true }) as any;
      if (data && data.length > 0) {
        const msgIds = data.map((t: any) => t.message_id);
        const { data: msgs } = await supabase.from("followup_messages").select("id, message_text").in("id", msgIds) as any;
        const msgMap: Record<string, string> = {};
        (msgs || []).forEach((m: any) => { msgMap[m.id] = m.message_text; });
        setTasks(data.map((t: any) => ({ ...t, message_text: msgMap[t.message_id] || "" })));
      } else {
        setTasks([]);
      }
      setLoading(false);
    };
    fetchTasks();
  }, [leadId]);

  const completeTask = async (taskId: string) => {
    await supabase.from("followup_tasks").update({ status: "completed" } as any).eq("id", taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "completed" } : t));
    toast({ title: "Follow-up concluído" });
  };

  const pendingTasks = tasks.filter(t => t.status === "pending");
  const nextTask = pendingTasks[0];

  if (loading) return null;
  if (tasks.length === 0) return null;

  const getTimeRemaining = (dueAt: string) => {
    const diff = new Date(dueAt).getTime() - Date.now();
    if (diff <= 0) return "Vencido";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <BlockSection title="Follow-up" icon={Clock}>
      {nextTask && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-primary flex items-center gap-1">
              <Clock className="w-3 h-3" /> Próximo follow-up em: {getTimeRemaining(nextTask.due_at)}
            </span>
          </div>
          {nextTask.message_text && (
            <div className="text-sm text-foreground bg-card rounded-md p-2 border border-border">
              <p className="text-[10px] uppercase text-muted-foreground mb-1">Mensagem sugerida:</p>
              {nextTask.message_text}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={() => { if (nextTask.message_text) navigator.clipboard.writeText(nextTask.message_text); toast({ title: "Mensagem copiada" }); }}
              className="h-7 px-2.5 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted">Copiar mensagem</button>
            <button onClick={() => completeTask(nextTask.id)}
              className="h-7 px-2.5 rounded-md bg-primary text-primary-foreground text-xs hover:opacity-90">Marcar como concluído</button>
          </div>
        </div>
      )}
      {tasks.length > 1 && (
        <div className="space-y-1 mt-2">
          {tasks.slice(1).map(t => (
            <div key={t.id} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${t.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}`}>
              <div className={`w-3 h-3 rounded-full border ${t.status === "completed" ? "bg-primary border-primary" : "border-muted-foreground"}`} />
              <span className="flex-1 truncate">{t.message_text || "Follow-up"}</span>
              <span className="text-[10px] text-muted-foreground">{t.status === "completed" ? "✓" : getTimeRemaining(t.due_at)}</span>
            </div>
          ))}
        </div>
      )}
    </BlockSection>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── ACTIVITY LOG SECTION ─── */
/* ═══════════════════════════════════════════ */
function ActivityLogSection({ leadId }: { leadId: string }) {
  const [logs, setLogs] = useState<{ id: string; action: string; field_changed: string | null; old_value: string | null; new_value: string | null; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("lead_activity_logs")
        .select("id, action, field_changed, old_value, new_value, created_at")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(20) as any;
      if (data) setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, [leadId]);

  if (loading || logs.length === 0) return null;

  const fieldLabels: Record<string, string> = {
    name: "Nome", phone: "Telefone", email: "Email", instagram: "Instagram",
    country: "País", source: "Origem", group_number: "Nº Grupo", group_link: "Link Grupo",
    scheduling_date: "Agendamento", consultation_done: "Consultoria", closer_id: "Closer",
    sale_status: "Status Venda", value_estimate: "Valor", reference_month: "Mês Ref.",
    call_recording_link: "Gravação", qualification_score: "Qualificação",
    sdr_observations: "Obs. SDR", observations: "Observações",
  };

  return (
    <BlockSection title="Histórico de Alterações" icon={Clock}>
      <div className="space-y-1">
        {(expanded ? logs : logs.slice(0, 5)).map(log => (
          <div key={log.id} className="flex items-start gap-2 text-[11px] py-1">
            <span className="text-muted-foreground shrink-0 w-[70px]">
              {new Date(log.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} {new Date(log.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="text-foreground">
              <span className="font-medium">{fieldLabels[log.field_changed || ""] || log.field_changed || log.action}</span>
              {log.old_value && log.new_value && (
                <span className="text-muted-foreground"> {log.old_value} → {log.new_value}</span>
              )}
              {!log.old_value && log.new_value && (
                <span className="text-muted-foreground"> → {log.new_value}</span>
              )}
            </span>
          </div>
        ))}
      </div>
      {logs.length > 5 && (
        <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-primary hover:underline">
          {expanded ? "Ver menos" : `Ver mais (${logs.length - 5})`}
        </button>
      )}
    </BlockSection>
  );
}
