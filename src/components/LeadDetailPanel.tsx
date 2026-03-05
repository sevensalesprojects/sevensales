import { DBLead } from "@/hooks/useLeads";
import { X, Phone, Mail, Instagram, MessageCircle, FileText, CheckSquare, BarChart3, ShoppingBag, Send, Plus } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface LeadDetailPanelProps {
  lead: DBLead;
  onClose: () => void;
}

const tabs = [
  { id: "info", label: "Info", icon: FileText },
  { id: "conversa", label: "Chat", icon: MessageCircle },
  { id: "notas", label: "Notas", icon: FileText },
  { id: "tarefas", label: "Tarefas", icon: CheckSquare },
  { id: "metricas", label: "Métricas", icon: BarChart3 },
  { id: "compras", label: "Compras", icon: ShoppingBag },
];

export function LeadDetailPanel({ lead, onClose }: LeadDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("info");
  const isMobile = useIsMobile();

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />
      <div className={`fixed top-0 h-full bg-card border-l border-border z-50 flex flex-col animate-slide-in ${
        isMobile ? "left-0 right-0 w-full" : "right-0 w-[480px]"
      }`}>
        <div className="h-14 px-4 md:px-5 flex items-center justify-between border-b border-border shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-card-foreground truncate">{lead.name}</h2>
            <p className="text-xs text-muted-foreground truncate">{lead.source || "Sem origem"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors shrink-0 ml-2">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="px-4 md:px-5 py-3 border-b border-border flex items-center gap-3 shrink-0 overflow-x-auto">
          {lead.phone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap"><Phone className="w-3.5 h-3.5" />{lead.phone}</div>}
          {lead.email && <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap"><Mail className="w-3.5 h-3.5" /><span className="truncate max-w-[120px]">{lead.email}</span></div>}
          {lead.instagram && <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap"><Instagram className="w-3.5 h-3.5" />{lead.instagram}</div>}
        </div>
        <div className="px-2 md:px-5 border-b border-border flex gap-0 shrink-0 overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {isMobile && <tab.icon className="w-3.5 h-3.5" />}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-5 scrollbar-thin">
          {activeTab === "info" && <InfoTab lead={lead} />}
          {activeTab === "conversa" && <ConversationTab leadId={lead.id} />}
          {activeTab === "notas" && <NotesTab leadId={lead.id} />}
          {activeTab === "tarefas" && <TasksTab leadId={lead.id} />}
          {activeTab === "metricas" && <MetricsTab lead={lead} />}
          {activeTab === "compras" && <PurchasesTab />}
        </div>
      </div>
    </>
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
    toast({ title: "Mensagem registrada", description: "A mensagem foi salva localmente. Integração com WhatsApp/Instagram é necessária para envio real." });
  };

  return (
    <div className="space-y-3">
      {messages.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conversa registrada ainda.</p>}
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
        <button onClick={handleSend} disabled={!input.trim()} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5 shrink-0">
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

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
      toast({ title: "Erro", description: "Não foi possível salvar a nota.", variant: "destructive" });
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
        className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5">
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

function MetricsTab({ lead }: { lead: DBLead }) {
  const daysSinceCreation = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: "Tempo de Resposta", value: lead.response_time_minutes ? `${lead.response_time_minutes} min` : "—" },
        { label: "Dias no Funil", value: daysSinceCreation.toString() },
        { label: "Valor Estimado", value: lead.value_estimate ? `R$ ${lead.value_estimate.toLocaleString("pt-BR")}` : "—" },
        { label: "Canal", value: lead.channel || "—" },
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
      <p className="text-xs text-muted-foreground text-center py-4">Nenhuma compra registrada. Compras aparecerão aqui quando a integração Hotmart estiver configurada.</p>
    </div>
  );
}
