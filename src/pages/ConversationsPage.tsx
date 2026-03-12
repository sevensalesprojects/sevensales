import { useState, useEffect, useRef } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLeads, DBLead } from "@/hooks/useLeads";
import { LeadDetailPanel } from "@/components/LeadDetailPanel";
import {
  Search, Phone, Mail, Instagram, MessageCircle, Send,
  Paperclip, Image, UserCog, CheckCheck,
  ArrowLeftRight, XCircle, ArrowLeft, ClipboardList, FileText,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface ConversationLead {
  id: string;
  leadId: string;
  leadName: string;
  leadInitials: string;
  lastMessage: string;
  channel: "whatsapp" | "instagram";
  time: string;
  unread: number;
  sdrName: string;
  phone: string;
  email: string;
  status: "active" | "resolved";
}

interface DBMessage {
  id: string;
  content: string;
  direction: string;
  channel: string;
  created_at: string;
  sender_id: string | null;
}

export default function ConversationsPage() {
  const { currentProject } = useProject();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { leads, updateLeadField } = useLeads();

  const [conversations, setConversations] = useState<ConversationLead[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationLead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterChannel, setFilterChannel] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [sdrs, setSdrs] = useState<{ user_id: string; full_name: string }[]>([]);
  const [rightPanelMode, setRightPanelMode] = useState<"info" | "ficha">("info");
  const [fichaLead, setFichaLead] = useState<DBLead | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferSdrId, setTransferSdrId] = useState("");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversations from leads that have messages
  useEffect(() => {
    if (!currentProject) return;
    const loadConversations = async () => {
      // Get leads with recent messages
      const { data: recentMessages } = await supabase
        .from("messages")
        .select("lead_id, content, channel, created_at, direction")
        .eq("project_id", currentProject.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (!recentMessages) return;

      // Group by lead_id
      const leadMap: Record<string, typeof recentMessages[0]> = {};
      recentMessages.forEach(m => { if (!leadMap[m.lead_id]) leadMap[m.lead_id] = m; });

      // Get lead info
      const leadIds = Object.keys(leadMap);
      if (leadIds.length === 0) return;

      const { data: leadData } = await supabase
        .from("leads")
        .select("id, name, phone, email, sdr_id, channel")
        .in("id", leadIds);

      // Get all SDR profiles
      const sdrIds = [...new Set((leadData || []).map(l => l.sdr_id).filter(Boolean))];
      let profileMap: Record<string, string> = {};
      if (sdrIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", sdrIds as string[]);
        profs?.forEach(p => { profileMap[p.user_id] = p.full_name; });
      }
      setProfiles(profileMap);

      const convs: ConversationLead[] = (leadData || []).map(lead => {
        const lastMsg = leadMap[lead.id];
        const initials = lead.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
        const unread = recentMessages.filter(m => m.lead_id === lead.id && m.direction === "inbound").length;
        return {
          id: lead.id,
          leadId: lead.id,
          leadName: lead.name,
          leadInitials: initials,
          lastMessage: lastMsg?.content || "",
          channel: (lastMsg?.channel as "whatsapp" | "instagram") || (lead.channel as "whatsapp" | "instagram") || "whatsapp",
          time: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "",
          unread: Math.min(unread, 5),
          sdrName: lead.sdr_id ? (profileMap[lead.sdr_id] || "SDR") : "—",
          phone: lead.phone || "",
          email: lead.email || "",
          status: "active" as const,
        };
      }).sort((a, b) => b.time.localeCompare(a.time));

      setConversations(convs);
      if (!isMobile && convs.length > 0 && !selectedConversation) setSelectedConversation(convs[0]);
    };
    loadConversations();

    // Realtime: atualizar lista quando nova mensagem chegar
    const realtimeChannel = supabase
      .channel(`conversations-list-${currentProject?.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${currentProject?.id}`,
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [currentProject?.id]);

  // Load SDRs for transfer
  useEffect(() => {
    const fetchSdrs = async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "sdr");
      if (!roles || roles.length === 0) return;
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", roles.map(r => r.user_id));
      if (profs) setSdrs(profs);
    };
    fetchSdrs();
  }, []);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;
    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, content, direction, channel, created_at, sender_id")
        .eq("lead_id", selectedConversation.leadId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };
    loadMessages();

    // Realtime subscription for new messages
    const channel = supabase
      .channel(`messages-${selectedConversation.leadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `lead_id=eq.${selectedConversation.leadId}`,
        },
        (payload) => {
          const newMsg = payload.new as DBMessage;
          setMessages(prev => {
            // Avoid duplicates (from optimistic update)
            if (prev.some(m => m.id === newMsg.id)) return prev;
            // Remove temp messages with same content
            const filtered = prev.filter(m => !m.id.startsWith("temp-") || m.content !== newMsg.content);
            return [...filtered, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.leadId]);

  // Ficha lead
  useEffect(() => {
    if (selectedConversation && rightPanelMode === "ficha") {
      const matchedLead = leads.find(l => l.id === selectedConversation.leadId);
      setFichaLead(matchedLead || null);
    }
  }, [selectedConversation, rightPanelMode, leads]);

  const filteredConversations = conversations.filter(c => {
    const matchSearch = !searchQuery || c.leadName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchChannel = !filterChannel || c.channel === filterChannel;
    return matchSearch && matchChannel;
  });

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedConversation || !user) return;
    const content = messageInput;
    setMessageInput("");

    if (selectedConversation.channel === "instagram") {
      // Send via edge function (Meta Graph API)
      const { data, error } = await supabase.functions.invoke("instagram-send", {
        body: {
          lead_id: selectedConversation.leadId,
          content,
          project_id: currentProject?.id,
        },
      });
      if (error) {
        toast({ title: "Erro ao enviar", description: "Não foi possível enviar a mensagem no Instagram.", variant: "destructive" });
        setMessageInput(content);
        return;
      }
      // Message will appear via realtime subscription
    } else {
      // WhatsApp / other: direct insert
      const { error } = await supabase.from("messages").insert({
        lead_id: selectedConversation.leadId,
        content,
        direction: "outbound",
        channel: selectedConversation.channel,
        sender_id: user.id,
      });
      if (error) {
        toast({ title: "Erro ao enviar", description: "Não foi possível enviar a mensagem.", variant: "destructive" });
        setMessageInput(content);
        return;
      }
    }

    // Optimistic update
    setMessages(prev => [...prev, {
      id: `temp-${Date.now()}`, content, direction: "outbound",
      channel: selectedConversation.channel, created_at: new Date().toISOString(), sender_id: user.id,
    }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const handleTransferConfirm = async () => {
    if (!transferSdrId || !selectedConversation || !user) return;

    const { error } = await supabase
      .from('leads')
      .update({ sdr_id: transferSdrId })
      .eq('id', selectedConversation.leadId);

    if (error) {
      toast({ title: 'Erro ao transferir', description: 'Não foi possível transferir a conversa.', variant: 'destructive' });
      return;
    }

    await supabase.from('lead_activity_logs').insert({
      lead_id: selectedConversation.leadId,
      user_id: user.id,
      action: 'lead_transferred',
      field_changed: 'sdr_id',
      old_value: selectedConversation.sdrName,
      new_value: sdrs.find(s => s.user_id === transferSdrId)?.full_name || transferSdrId,
    } as any);

    const sdrName = sdrs.find(s => s.user_id === transferSdrId)?.full_name || 'SDR';
    toast({ title: 'Conversa transferida', description: `Transferida para ${sdrName}` });
    setShowTransfer(false);
    setTransferSdrId('');
    setSelectedConversation(prev => prev ? { ...prev, sdrName } : prev);
  };

  const handleCreateTaskConfirm = async () => {
    if (!taskTitle.trim() || !user) return;
    await supabase.from("tasks").insert({ title: taskTitle, user_id: user.id, status: "pending", type: "follow_up" });
    toast({ title: "Tarefa criada", description: taskTitle });
    setShowCreateTask(false);
    setTaskTitle("");
  };

  const showList = !isMobile || !selectedConversation;
  const showChat = !isMobile || !!selectedConversation;

  return (
    <div className="flex h-full">
      {/* Conversation List */}
      {showList && (
        <div className={`border-r border-border flex flex-col shrink-0 ${isMobile ? "w-full" : "w-80"}`}>
          <div className="px-4 py-3 border-b border-border space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Conversas</h2>
              <span className="text-xs text-muted-foreground">{filteredConversations.length}</span>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input type="text" placeholder="Buscar conversa..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-muted/50 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="flex gap-1">
              {[null, "whatsapp", "instagram"].map(ch => (
                <button key={ch || "all"} onClick={() => setFilterChannel(ch)}
                  className={`h-6 px-2 rounded text-[10px] font-medium transition-colors ${filterChannel === ch ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                  {ch === null ? "Todos" : ch === "whatsapp" ? "WhatsApp" : "Instagram"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filteredConversations.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conversa encontrada</p>}
            {filteredConversations.map(conv => (
              <button key={conv.id} onClick={() => { setSelectedConversation(conv); setRightPanelMode("info"); }}
                className={`w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 ${selectedConversation?.id === conv.id ? "bg-muted/60" : ""}`}>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 relative">
                  <span className="text-xs font-medium text-primary">{conv.leadInitials}</span>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card flex items-center justify-center ${conv.channel === "whatsapp" ? "bg-success" : "bg-chart-5"}`}>
                    {conv.channel === "whatsapp" ? <MessageCircle className="w-2 h-2 text-success-foreground" /> : <Instagram className="w-2 h-2 text-chart-5" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate">{conv.leadName}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{conv.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                  <span className="text-[10px] text-muted-foreground">SDR: {conv.sdrName}</span>
                </div>
                {conv.unread > 0 && <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">{conv.unread}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat */}
      {showChat && selectedConversation && (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-14 px-3 md:px-5 flex items-center justify-between border-b border-border shrink-0">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              {isMobile && <button onClick={() => setSelectedConversation(null)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted shrink-0"><ArrowLeft className="w-5 h-5 text-foreground" /></button>}
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><span className="text-xs font-medium text-primary">{selectedConversation.leadInitials}</span></div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{selectedConversation.leadName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{selectedConversation.channel === "whatsapp" ? "WhatsApp" : "Instagram"} · {selectedConversation.sdrName}</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
              {!isMobile && (
                <>
                  <button onClick={() => setShowTransfer(true)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors" title="Transferir"><ArrowLeftRight className="w-4 h-4 text-muted-foreground" /></button>
                  <button onClick={() => setShowCreateTask(true)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors" title="Criar tarefa"><ClipboardList className="w-4 h-4 text-muted-foreground" /></button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3 scrollbar-thin" ref={messagesContainerRef}>
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.direction === "outbound" ? "justify-end" : ""}`}>
                {msg.direction === "inbound" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-medium text-primary">{selectedConversation.leadInitials}</span>
                  </div>
                )}
                <div className={`rounded-lg px-3 py-2 max-w-[80%] ${msg.direction === "inbound" ? "bg-muted rounded-tl-none" : "bg-primary/10 rounded-tr-none"}`}>
                  <p className="text-sm text-foreground">{msg.content}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {msg.channel === "whatsapp" ? "WhatsApp" : "Instagram"}
                    </span>
                    {msg.id.startsWith("temp-") && <span className="text-[10px] text-muted-foreground">⏳</span>}
                  </div>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
                <MessageCircle className="w-8 h-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground text-center">Nenhuma conversa ainda.</p>
                <p className="text-xs text-muted-foreground text-center">Quando um cliente enviar uma mensagem pelo Instagram ou WhatsApp, ela aparecerá aqui.</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 md:px-5 py-3 border-t border-border shrink-0">
            <div className="flex items-center gap-1.5 md:gap-2 border border-input rounded-lg p-1.5 md:p-2">
              <input type="text" placeholder="Digite sua mensagem..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyDown={handleKeyDown}
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground min-w-0" />
              <button onClick={handleSend} disabled={!messageInput.trim()} className="h-8 w-8 md:w-auto md:px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0">
                <Send className="w-3.5 h-3.5" />{!isMobile && "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right Panel */}
      {!isMobile && selectedConversation && (
        <div className="w-72 border-l border-border flex flex-col shrink-0 overflow-hidden">
          <div className="flex border-b border-border shrink-0">
            <button onClick={() => setRightPanelMode("info")}
              className={`flex-1 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1 ${rightPanelMode === "info" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <UserCog className="w-3.5 h-3.5" /> Info
            </button>
            <button onClick={() => setRightPanelMode("ficha")}
              className={`flex-1 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1 ${rightPanelMode === "ficha" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <FileText className="w-3.5 h-3.5" /> Ficha
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {rightPanelMode === "info" ? (
              <>
                <div className="p-4 border-b border-border text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <span className="text-lg font-semibold text-primary">{selectedConversation.leadInitials}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{selectedConversation.leadName}</p>
                  <p className="text-xs text-muted-foreground">{selectedConversation.channel === "whatsapp" ? "WhatsApp" : "Instagram Direct"}</p>
                </div>
                <div className="p-4 space-y-3">
                  <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Telefone</p><p className="text-sm text-foreground flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{selectedConversation.phone || "—"}</p></div>
                  <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Email</p><p className="text-sm text-foreground flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{selectedConversation.email || "—"}</p></div>
                  <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">SDR</p><p className="text-sm text-foreground">{selectedConversation.sdrName}</p></div>
                </div>
                <div className="p-4 border-t border-border space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Ações Rápidas</p>
                  <button onClick={() => setShowTransfer(true)} className="w-full h-8 px-3 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted flex items-center gap-2 transition-colors"><ArrowLeftRight className="w-3.5 h-3.5" /> Transferir Conversa</button>
                  <button onClick={() => setShowCreateTask(true)} className="w-full h-8 px-3 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted flex items-center gap-2 transition-colors"><ClipboardList className="w-3.5 h-3.5" /> Criar Tarefa</button>
                  <button onClick={() => setRightPanelMode("ficha")} className="w-full h-8 px-3 rounded-md border border-primary text-xs text-primary hover:bg-primary/10 flex items-center gap-2 transition-colors font-medium"><FileText className="w-3.5 h-3.5" /> Abrir Ficha do Lead</button>
                </div>
              </>
            ) : (
              fichaLead ? (
                <LeadFichaInline lead={fichaLead} onFieldUpdate={updateLeadField} />
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground py-8">Nenhum lead correspondente encontrado.</p>
                  <button onClick={() => setRightPanelMode("info")} className="text-xs text-primary hover:underline">Voltar para Info</button>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Transfer Dialog */}
      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Transferir Conversa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Transferir conversa de <span className="font-medium text-foreground">{selectedConversation?.leadName}</span>.</p>
            <div className="space-y-2">
              <Label>Novo SDR</Label>
              <Select value={transferSdrId} onValueChange={setTransferSdrId}>
                <SelectTrigger><SelectValue placeholder="Selecionar SDR" /></SelectTrigger>
                <SelectContent>{sdrs.map(s => <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransfer(false)}>Cancelar</Button>
            <Button onClick={handleTransferConfirm} disabled={!transferSdrId}>Transferir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task */}
      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Criar Tarefa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Título</Label><Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Ex: Enviar proposta" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTask(false)}>Cancelar</Button>
            <Button onClick={handleCreateTaskConfirm} disabled={!taskTitle.trim()}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Inline Ficha ─── */
function LeadFichaInline({ lead, onFieldUpdate }: { lead: DBLead; onFieldUpdate: (leadId: string, field: string, value: any) => Promise<boolean> }) {
  const { user } = useAuth();
  const [localLead, setLocalLead] = useState<DBLead>(lead);

  useEffect(() => { setLocalLead(lead); }, [lead]);

  const saveField = async (field: string, value: any) => {
    const ok = await onFieldUpdate(localLead.id, field, value);
    if (ok) {
      setLocalLead(prev => ({ ...prev, [field]: value }));
      if (user) {
        await supabase.from("lead_activity_logs").insert({
          lead_id: localLead.id, user_id: user.id, action: `${field}_updated`,
          field_changed: field, old_value: String((localLead as any)[field] || ""), new_value: String(value || ""),
        } as any);
      }
    }
  };

  const selectOptions = {
    source: [{ value: "Instagram", label: "Instagram" }, { value: "WhatsApp", label: "WhatsApp" }, { value: "Indicação", label: "Indicação" }, { value: "Tráfego Pago", label: "Tráfego Pago" }, { value: "YouTube", label: "YouTube" }, { value: "Orgânico", label: "Orgânico" }, { value: "Outro", label: "Outro" }],
    country: [{ value: "Brasil", label: "Brasil" }, { value: "Portugal", label: "Portugal" }, { value: "Estados Unidos", label: "Estados Unidos" }, { value: "Outro", label: "Outro" }],
    sale_status: [{ value: "pending", label: "Pendente" }, { value: "sold", label: "Ganho" }, { value: "lost", label: "Perdido" }],
    qualification_score: [{ value: "muito_qualificado", label: "Muito qualificado" }, { value: "qualificado", label: "Qualificado" }, { value: "pouco_qualificado", label: "Pouco qualificado" }, { value: "desqualificado", label: "Desqualificado" }],
  };

  const SelectField = ({ label, value, field, options }: { label: string; value: string | null; field: string; options: { value: string; label: string }[] }) => (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <select value={value || ""} onChange={(e) => saveField(field, e.target.value || null)}
        className="w-full text-xs bg-transparent border border-transparent hover:border-input focus:border-ring rounded px-1 py-0.5 outline-none cursor-pointer text-foreground">
        <option value="">Selecionar...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const TextField = ({ label, value, field, placeholder }: { label: string; value: string | null; field: string; placeholder?: string }) => {
    const [draft, setDraft] = useState(value || "");
    const timerRef = useRef<NodeJS.Timeout>();
    useEffect(() => { setDraft(value || ""); }, [value]);
    const handleChange = (v: string) => { setDraft(v); if (timerRef.current) clearTimeout(timerRef.current); timerRef.current = setTimeout(() => saveField(field, v.trim() || null), 800); };
    return (
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
        <input type="text" value={draft} onChange={(e) => handleChange(e.target.value)} placeholder={placeholder}
          className="w-full text-xs bg-transparent border border-transparent hover:border-input focus:border-ring rounded px-1 py-0.5 outline-none text-foreground placeholder:text-muted-foreground" />
      </div>
    );
  };

  return (
    <div className="p-3 space-y-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Ficha do Lead</p>
      <TextField label="Nome" value={localLead.name} field="name" />
      <TextField label="Telefone" value={localLead.phone} field="phone" placeholder="+55..." />
      <TextField label="Email" value={localLead.email} field="email" />
      <TextField label="Instagram" value={localLead.instagram} field="instagram" placeholder="@usuario" />
      <SelectField label="País" value={localLead.country} field="country" options={selectOptions.country} />
      <SelectField label="Origem" value={localLead.source} field="source" options={selectOptions.source} />
      <TextField label="Nº Grupo" value={localLead.group_number} field="group_number" />
      <TextField label="Link Grupo" value={localLead.group_link} field="group_link" />
      <div className="border-t border-border pt-2">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => saveField("consultation_done", !localLead.consultation_done)}>
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${localLead.consultation_done ? "bg-primary border-primary" : "border-muted-foreground"}`}>
            {localLead.consultation_done && <CheckCheck className="w-3 h-3 text-primary-foreground" />}
          </div>
          <span className="text-xs text-foreground">Realizou consultoria</span>
        </div>
      </div>
      <SelectField label="Status Venda" value={localLead.sale_status} field="sale_status" options={selectOptions.sale_status} />
      <TextField label="Valor Venda" value={localLead.value_estimate != null ? String(localLead.value_estimate) : null} field="value_estimate" placeholder="0.00" />
      <SelectField label="Qualificação" value={localLead.qualification_score} field="qualification_score" options={selectOptions.qualification_score} />
    </div>
  );
}
