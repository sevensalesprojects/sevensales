import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLeads, DBLead } from "@/hooks/useLeads";
import { LeadDetailPanel } from "@/components/LeadDetailPanel";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  CalendarDays, Plus, Phone, Video, Clock, User, Loader2, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Call {
  id: string;
  lead_id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  duration_minutes: number | null;
  sdr_id: string | null;
  closer_id: string | null;
  meeting_url?: string | null;
  lead_name?: string;
  lead_phone?: string;
}

export default function AgendaPage() {
  const { currentProject } = useProject();
  const { user } = useAuth();
  const { leads, updateLeadField } = useLeads();
  const isMobile = useIsMobile();

  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreate, setShowCreate] = useState(false);
  const [selectedLead, setSelectedLead] = useState<DBLead | null>(null);
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  // Form state
  const [formLeadId, setFormLeadId] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formCloserId, setFormCloserId] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formMeetingUrl, setFormMeetingUrl] = useState("");
  const [closers, setClosers] = useState<{ user_id: string; full_name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<"day" | "week">("week");

  useEffect(() => {
    const fetchClosers = async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").in("role", ["closer"]);
      if (!roles || roles.length === 0) return;
      const { data: p } = await supabase.from("profiles").select("user_id, full_name").in("user_id", roles.map(r => r.user_id));
      if (p) setClosers(p);
    };
    fetchClosers();
  }, []);

  const fetchCalls = async () => {
    if (!currentProject) return;
    setLoading(true);

    // Get calls for leads in this project
    const { data: projectLeads } = await supabase.from("leads").select("id, name, phone").eq("project_id", currentProject.id);
    if (!projectLeads || projectLeads.length === 0) { setCalls([]); setLoading(false); return; }

    const leadIds = projectLeads.map(l => l.id);
    const leadMap: Record<string, { name: string; phone: string | null }> = {};
    projectLeads.forEach(l => { leadMap[l.id] = { name: l.name, phone: l.phone }; });

    const { data } = await supabase
      .from("calls")
      .select("*")
      .in("lead_id", leadIds)
      .order("scheduled_at", { ascending: true });

    if (data) {
      setCalls(data.map(c => ({
        ...c,
        lead_name: leadMap[c.lead_id]?.name || "Lead",
        lead_phone: leadMap[c.lead_id]?.phone || null,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchCalls(); }, [currentProject?.id]);

  // Get week days
  const getWeekDays = () => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getCallsForDate = (date: Date) => {
    const dateStr = date.toISOString().slice(0, 10);
    return calls.filter(c => c.scheduled_at.slice(0, 10) === dateStr);
  };

  const todayCalls = getCallsForDate(viewMode === "day" ? selectedDate : today);
  const statusColors: Record<string, string> = {
    scheduled: "border-l-primary bg-primary/5",
    completed: "border-l-success bg-success/5",
    no_show: "border-l-destructive bg-destructive/5",
    cancelled: "border-l-muted-foreground bg-muted",
  };
  const statusLabels: Record<string, string> = {
    scheduled: "Agendado",
    completed: "Realizado",
    no_show: "Não compareceu",
    cancelled: "Cancelado",
  };

  const handleCreate = async () => {
    if (!formLeadId || !formDate || !user) return;
    setSaving(true);
    const { data: insertedCall, error } = await supabase.from("calls").insert({
      lead_id: formLeadId,
      scheduled_at: new Date(formDate).toISOString(),
      closer_id: formCloserId || null,
      sdr_id: user.id,
      notes: formNotes || null,
      meeting_url: formMeetingUrl || null,
      project_id: currentProject?.id || null,
      status: "scheduled",
    } as any).select("id").single();
    if (!error) {
      toast({ title: "Call agendada", description: "Agendamento criado com sucesso." });
      // Update lead scheduling_date
      await updateLeadField(formLeadId, "scheduling_date", new Date(formDate).toISOString());

      // Create notification for the Closer
      if (formCloserId && currentProject) {
        const leadName = leads.find(l => l.id === formLeadId)?.name || "Lead";
        const formattedDate = new Date(formDate).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
        await supabase.from("notifications").insert({
          user_id: formCloserId,
          project_id: currentProject.id,
          type: "call_scheduled",
          title: "Nova call agendada",
          description: `Call com ${leadName} — ${formattedDate}`,
          entity_type: "call",
          entity_id: insertedCall?.id || null,
        });
      }

      await fetchCalls();
      setShowCreate(false);
      setFormLeadId(""); setFormDate(""); setFormCloserId(""); setFormNotes(""); setFormMeetingUrl("");
    } else {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const updateCallStatus = async (callId: string, status: string) => {
    const { error } = await supabase.from("calls").update({ status }).eq("id", callId);
    if (!error) {
      setCalls(prev => prev.map(c => c.id === callId ? { ...c, status } : c));
      toast({ title: "Status atualizado", description: statusLabels[status] || status });
    }
  };

  const navigateWeek = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (dir * 7));
    setSelectedDate(d);
  };

  const navigateDay = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const pendingCount = calls.filter(c => c.status === "scheduled").length;
  const completedCount = calls.filter(c => c.status === "completed").length;
  const noShowCount = calls.filter(c => c.status === "no_show").length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex items-center justify-between shrink-0 gap-2">
        <div>
          <h1 className="text-base md:text-lg font-semibold text-foreground">Agenda / Calls</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            {pendingCount} agendadas · {completedCount} realizadas · {noShowCount} no-show
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isMobile && (
            <div className="flex items-center gap-0.5 border border-border rounded-md overflow-hidden">
              <button onClick={() => setViewMode("day")} className={`h-8 px-3 text-xs font-medium transition-colors ${viewMode === "day" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>Dia</button>
              <button onClick={() => setViewMode("week")} className={`h-8 px-3 text-xs font-medium transition-colors ${viewMode === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>Semana</button>
            </div>
          )}
          <button onClick={() => setShowCreate(true)} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
            <Plus className="w-3.5 h-3.5" /> {!isMobile && "Nova Call"}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 md:px-6 py-2 border-b border-border flex items-center justify-between shrink-0">
        <button onClick={() => viewMode === "week" ? navigateWeek(-1) : navigateDay(-1)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
        <div className="text-sm font-medium text-foreground">
          {viewMode === "week"
            ? `${weekDays[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} — ${weekDays[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`
            : selectedDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
          }
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setSelectedDate(new Date())} className="h-7 px-2 rounded text-xs text-primary hover:bg-primary/10">Hoje</button>
          <button onClick={() => viewMode === "week" ? navigateWeek(1) : navigateDay(1)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 md:p-4">
        {viewMode === "week" && !isMobile ? (
          <div className="grid grid-cols-7 gap-2 h-full">
            {weekDays.map((day) => {
              const dayCalls = getCallsForDate(day);
              const isToday = day.toDateString() === today.toDateString();
              return (
                <div key={day.toISOString()} className={`border border-border rounded-lg flex flex-col overflow-hidden ${isToday ? "border-primary" : ""}`}>
                  <div className={`px-2 py-1.5 text-center border-b border-border shrink-0 ${isToday ? "bg-primary/10" : "bg-muted/50"}`}>
                    <p className="text-[10px] uppercase text-muted-foreground">{day.toLocaleDateString("pt-BR", { weekday: "short" })}</p>
                    <p className={`text-sm font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>{day.getDate()}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-1 space-y-1 scrollbar-thin">
                    {dayCalls.map(call => (
                      <CallCard key={call.id} call={call} onStatusChange={updateCallStatus} onLeadClick={(leadId) => {
                        const lead = leads.find(l => l.id === leadId);
                        if (lead) setSelectedLead(lead);
                      }} compact />
                    ))}
                    {dayCalls.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">—</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-2">
            {(viewMode === "day" ? getCallsForDate(selectedDate) : calls).map(call => (
              <CallCard key={call.id} call={call} onStatusChange={updateCallStatus} onLeadClick={(leadId) => {
                const lead = leads.find(l => l.id === leadId);
                if (lead) setSelectedLead(lead);
              }} />
            ))}
            {(viewMode === "day" ? getCallsForDate(selectedDate) : calls).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma call agendada {viewMode === "day" ? "neste dia" : ""}.</p>
            )}
          </div>
        )}
      </div>

      {/* Lead Detail Panel */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onFieldUpdate={updateLeadField}
          onLeadChanged={() => {}}
        />
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Agendar Nova Call</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Lead</Label>
              <Select value={formLeadId} onValueChange={setFormLeadId}>
                <SelectTrigger><SelectValue placeholder="Selecionar lead" /></SelectTrigger>
                <SelectContent>
                  {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.name} {l.phone ? `(${l.phone})` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data e Hora</Label>
              <Input type="datetime-local" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Closer (opcional)</Label>
              <Select value={formCloserId} onValueChange={setFormCloserId}>
                <SelectTrigger><SelectValue placeholder="Selecionar closer" /></SelectTrigger>
                <SelectContent>
                  {closers.map(c => <SelectItem key={c.user_id} value={c.user_id}>{c.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Link da Reunião (Zoom/Meet)</Label>
              <Input value={formMeetingUrl} onChange={(e) => setFormMeetingUrl(e.target.value)} placeholder="https://meet.google.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Notas sobre o agendamento" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !formLeadId || !formDate}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Agendar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CallCard({ call, onStatusChange, onLeadClick, compact }: {
  call: Call;
  onStatusChange: (id: string, status: string) => void;
  onLeadClick: (leadId: string) => void;
  compact?: boolean;
}) {
  const statusColors: Record<string, string> = {
    scheduled: "border-l-primary",
    completed: "border-l-green-500",
    no_show: "border-l-destructive",
    cancelled: "border-l-muted-foreground",
  };
  const statusLabels: Record<string, string> = {
    scheduled: "Agendado",
    completed: "Realizado",
    no_show: "Não compareceu",
    cancelled: "Cancelado",
  };

  const time = new Date(call.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (compact) {
    return (
      <div className={`rounded-md border-l-2 p-1.5 bg-card border border-border cursor-pointer hover:shadow-sm transition-shadow ${statusColors[call.status] || ""}`}
        onClick={() => onLeadClick(call.lead_id)}>
        <p className="text-[10px] font-medium text-foreground truncate">{call.lead_name}</p>
        <p className="text-[10px] text-muted-foreground">{time}</p>
        <div className="flex gap-0.5 mt-1">
          {call.status === "scheduled" && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onStatusChange(call.id, "completed"); }} className="text-[9px] px-1 rounded bg-success/20 text-success hover:bg-success/30">✓</button>
              <button onClick={(e) => { e.stopPropagation(); onStatusChange(call.id, "no_show"); }} className="text-[9px] px-1 rounded bg-destructive/20 text-destructive hover:bg-destructive/30">✗</button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border-l-4 p-4 bg-card border border-border hover:shadow-sm transition-shadow ${statusColors[call.status] || ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4 text-primary" />
          </div>
          <div>
            <button onClick={() => onLeadClick(call.lead_id)} className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left">
              {call.lead_name}
            </button>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {time}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(call.scheduled_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </span>
              {call.lead_phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {call.lead_phone}</span>}
            </div>
            {call.notes && <p className="text-xs text-muted-foreground mt-1">{call.notes}</p>}
            {call.meeting_url && call.status === "scheduled" && (
              <a href={call.meeting_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                <Video className="w-3 h-3" /> Entrar na Call
              </a>
            )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
            call.status === "scheduled" ? "bg-primary/15 text-primary" :
            call.status === "completed" ? "bg-success/15 text-success" :
            call.status === "no_show" ? "bg-destructive/15 text-destructive" :
            "bg-muted text-muted-foreground"
          }`}>{statusLabels[call.status] || call.status}</span>
          {call.status === "scheduled" && (
            <div className="flex gap-1">
              <button onClick={() => onStatusChange(call.id, "completed")} className="h-7 px-2 rounded-md bg-success/10 text-success text-[10px] hover:bg-success/20">Realizado</button>
              <button onClick={() => onStatusChange(call.id, "no_show")} className="h-7 px-2 rounded-md bg-destructive/10 text-destructive text-[10px] hover:bg-destructive/20">No-show</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
