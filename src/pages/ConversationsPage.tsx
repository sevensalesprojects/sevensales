import { useState, useEffect } from "react";
import { useExpert } from "@/contexts/ExpertContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProject } from "@/contexts/ProjectContext";
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

interface Conversation {
  id: string;
  leadId: string;
  leadName: string;
  leadInitials: string;
  lastMessage: string;
  channel: "whatsapp" | "instagram";
  time: string;
  unread: number;
  sdr: string;
  phone: string;
  email: string;
  status: "active" | "resolved";
}

interface Message {
  id: string;
  text: string;
  from: "lead" | "sdr";
  time: string;
  channel: "whatsapp" | "instagram";
}

const initialConversations: Conversation[] = [
  { id: "c1", leadId: "", leadName: "Maria Silva", leadInitials: "MS", lastMessage: "Sim, por favor! Qual o valor?", channel: "whatsapp", time: "14:40", unread: 2, sdr: "Carlos", phone: "(11) 99999-1111", email: "maria@email.com", status: "active" },
  { id: "c2", leadId: "", leadName: "João Oliveira", leadInitials: "JO", lastMessage: "Vou pensar e retorno amanhã", channel: "whatsapp", time: "13:22", unread: 0, sdr: "Ana", phone: "(21) 98888-2222", email: "joao@email.com", status: "active" },
  { id: "c3", leadId: "", leadName: "Ana Costa", leadInitials: "AC", lastMessage: "Obrigada pelas informações!", channel: "instagram", time: "12:05", unread: 1, sdr: "Carlos", phone: "(31) 97777-3333", email: "ana@email.com", status: "active" },
  { id: "c4", leadId: "", leadName: "Pedro Santos", leadInitials: "PS", lastMessage: "Quero agendar a reunião", channel: "whatsapp", time: "11:30", unread: 0, sdr: "Ana", phone: "(41) 96666-4444", email: "pedro@email.com", status: "active" },
  { id: "c5", leadId: "", leadName: "Lucas Ferreira", leadInitials: "LF", lastMessage: "Me envie o link de pagamento", channel: "instagram", time: "10:15", unread: 3, sdr: "Carlos", phone: "(51) 95555-5555", email: "lucas@email.com", status: "active" },
  { id: "c6", leadId: "", leadName: "Bruno Almeida", leadInitials: "BA", lastMessage: "Obrigado, já efetuei a compra!", channel: "whatsapp", time: "Ontem", unread: 0, sdr: "Carlos", phone: "(91) 91111-9999", email: "bruno@email.com", status: "resolved" },
];

const initialMessages: Record<string, Message[]> = {
  c1: [
    { id: "m1", text: "Olá! Vi o anúncio sobre o curso. Gostaria de saber mais informações.", from: "lead", time: "14:32", channel: "whatsapp" },
    { id: "m2", text: "Olá! Tudo bem? O curso está com condições especiais essa semana! Posso te explicar melhor?", from: "sdr", time: "14:35", channel: "whatsapp" },
    { id: "m3", text: "Sim, por favor! Qual o valor?", from: "lead", time: "14:40", channel: "whatsapp" },
  ],
};

export default function ConversationsPage() {
  const { currentExpert } = useExpert();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { leads, updateLeadField } = useLeads();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(isMobile ? null : conversations[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterChannel, setFilterChannel] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(initialMessages);
  const [sdrs, setSdrs] = useState<{ user_id: string; full_name: string }[]>([]);

  // Right panel mode: "info" or "ficha"
  const [rightPanelMode, setRightPanelMode] = useState<"info" | "ficha">("info");
  const [fichaLead, setFichaLead] = useState<DBLead | null>(null);

  // Transfer dialog
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferSdrId, setTransferSdrId] = useState("");

  // Create task dialog
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");

  const messages = selectedConversation ? (messagesMap[selectedConversation.id] || []) : [];

  useEffect(() => {
    const fetchSdrs = async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "sdr");
      if (!roles || roles.length === 0) return;
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", roles.map(r => r.user_id));
      if (profiles) setSdrs(profiles);
    };
    fetchSdrs();
  }, []);

  // When selecting a conversation, try to find matching lead
  useEffect(() => {
    if (selectedConversation && rightPanelMode === "ficha") {
      const matchedLead = leads.find(l =>
        l.name.toLowerCase() === selectedConversation.leadName.toLowerCase() ||
        l.phone === selectedConversation.phone
      );
      setFichaLead(matchedLead || null);
    }
  }, [selectedConversation, rightPanelMode, leads]);

  const filteredConversations = conversations.filter((c) => {
    const matchSearch = !searchQuery || c.leadName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchChannel = !filterChannel || c.channel === filterChannel;
    return matchSearch && matchChannel;
  });

  const handleSend = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    const newMsg: Message = {
      id: `msg-${Date.now()}`, text: messageInput, from: "sdr",
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      channel: selectedConversation.channel,
    };
    setMessagesMap(prev => ({ ...prev, [selectedConversation.id]: [...(prev[selectedConversation.id] || []), newMsg] }));
    setConversations(prev => prev.map(c => c.id === selectedConversation.id ? { ...c, lastMessage: messageInput, time: newMsg.time, unread: 0 } : c));
    setMessageInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const markResolved = () => {
    if (!selectedConversation) return;
    setConversations(prev => prev.map(c => c.id === selectedConversation.id ? { ...c, status: c.status === "active" ? "resolved" : "active" } : c));
    setSelectedConversation(prev => prev ? ({ ...prev, status: prev.status === "active" ? "resolved" : "active" }) : null);
    toast({ title: selectedConversation.status === "active" ? "Conversa resolvida" : "Conversa reaberta" });
  };

  const handleTransferConfirm = () => {
    if (!transferSdrId || !selectedConversation) return;
    const sdrName = sdrs.find(s => s.user_id === transferSdrId)?.full_name || "SDR";
    setConversations(prev => prev.map(c => c.id === selectedConversation.id ? { ...c, sdr: sdrName } : c));
    setSelectedConversation(prev => prev ? ({ ...prev, sdr: sdrName }) : null);
    toast({ title: "Conversa transferida", description: `Transferida para ${sdrName}` });
    setShowTransfer(false);
    setTransferSdrId("");
  };

  const handleCreateTaskConfirm = async () => {
    if (!taskTitle.trim() || !user) return;
    const { error } = await supabase.from("tasks").insert({ title: taskTitle, user_id: user.id, status: "pending", type: "follow_up" });
    if (!error) toast({ title: "Tarefa criada", description: taskTitle });
    setShowCreateTask(false);
    setTaskTitle("");
  };

  const handleClose = () => {
    if (!selectedConversation) return;
    setConversations(prev => prev.map(c => c.id === selectedConversation.id ? { ...c, status: "resolved" } : c));
    setSelectedConversation(prev => prev ? ({ ...prev, status: "resolved" }) : null);
    toast({ title: "Conversa encerrada" });
  };

  const showList = !isMobile || !selectedConversation;
  const showChat = !isMobile || !!selectedConversation;

  return (
    <div className="flex h-full">
      {/* Column 1 — Conversation List */}
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
              {[null, "whatsapp", "instagram"].map((ch) => (
                <button key={ch || "all"} onClick={() => setFilterChannel(ch)}
                  className={`h-6 px-2 rounded text-[10px] font-medium transition-colors ${filterChannel === ch ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                  {ch === null ? "Todos" : ch === "whatsapp" ? "WhatsApp" : "Instagram"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filteredConversations.map((conv) => (
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">SDR: {conv.sdr}</span>
                    {conv.status === "resolved" && <span className="text-[10px] px-1 rounded bg-muted text-muted-foreground">Resolvido</span>}
                  </div>
                </div>
                {conv.unread > 0 && <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">{conv.unread}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Column 2 — Chat */}
      {showChat && selectedConversation && (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-14 px-3 md:px-5 flex items-center justify-between border-b border-border shrink-0">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              {isMobile && (
                <button onClick={() => setSelectedConversation(null)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted shrink-0">
                  <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>
              )}
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-primary">{selectedConversation.leadInitials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{selectedConversation.leadName}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {selectedConversation.channel === "whatsapp" ? "WhatsApp" : "Instagram"} · {selectedConversation.sdr}
                  {selectedConversation.status === "resolved" && " · Resolvido"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
              {!isMobile && (
                <>
                  <button onClick={() => setShowTransfer(true)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors" title="Transferir conversa">
                    <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => setShowCreateTask(true)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors" title="Criar tarefa">
                    <ClipboardList className="w-4 h-4 text-muted-foreground" />
                  </button>
                </>
              )}
              <button onClick={markResolved} className={`w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors ${selectedConversation.status === "resolved" ? "bg-success/10" : ""}`} title="Marcar resolvido">
                <CheckCheck className={`w-4 h-4 ${selectedConversation.status === "resolved" ? "text-success" : "text-muted-foreground"}`} />
              </button>
              <button onClick={handleClose} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-destructive/10 transition-colors" title="Encerrar">
                <XCircle className="w-4 h-4 text-destructive" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3 scrollbar-thin">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.from === "sdr" ? "justify-end" : ""}`}>
                {msg.from === "lead" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-medium text-primary">{selectedConversation.leadInitials}</span>
                  </div>
                )}
                <div className={`rounded-lg px-3 py-2 max-w-[80%] ${msg.from === "lead" ? "bg-muted rounded-tl-none" : "bg-primary/10 rounded-tr-none"}`}>
                  <p className="text-sm text-foreground">{msg.text}</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">{msg.time} · {msg.channel === "whatsapp" ? "WhatsApp" : "Instagram"}</span>
                </div>
              </div>
            ))}
            {messages.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma mensagem nesta conversa.</p>}
          </div>

          <div className="px-3 md:px-5 py-3 border-t border-border shrink-0">
            <div className="flex items-center gap-1.5 md:gap-2 border border-input rounded-lg p-1.5 md:p-2">
              {!isMobile && (
                <>
                  <button onClick={() => toast({ title: "Em breve", description: "Anexo de arquivos será disponibilizado com a integração de mensageria." })} className="w-8 h-8 rounded flex items-center justify-center hover:bg-muted transition-colors">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => toast({ title: "Em breve", description: "Envio de imagens será disponibilizado com a integração de mensageria." })} className="w-8 h-8 rounded flex items-center justify-center hover:bg-muted transition-colors">
                    <Image className="w-4 h-4 text-muted-foreground" />
                  </button>
                </>
              )}
              <input type="text" placeholder="Digite sua mensagem..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyDown={handleKeyDown}
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground min-w-0" />
              <button onClick={handleSend} disabled={!messageInput.trim()} className="h-8 w-8 md:w-auto md:px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0">
                <Send className="w-3.5 h-3.5" />
                {!isMobile && "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column 3 — Right Panel (desktop only) */}
      {!isMobile && selectedConversation && (
        <div className="w-72 border-l border-border flex flex-col shrink-0 overflow-hidden">
          {/* Panel tabs */}
          <div className="flex border-b border-border shrink-0">
            <button onClick={() => setRightPanelMode("info")}
              className={`flex-1 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1 ${
                rightPanelMode === "info" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <UserCog className="w-3.5 h-3.5" /> Info
            </button>
            <button onClick={() => setRightPanelMode("ficha")}
              className={`flex-1 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1 ${
                rightPanelMode === "ficha" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
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
                  <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Telefone</p><p className="text-sm text-foreground flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{selectedConversation.phone}</p></div>
                  <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Email</p><p className="text-sm text-foreground flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{selectedConversation.email}</p></div>
                  <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">SDR Responsável</p><p className="text-sm text-foreground">{selectedConversation.sdr}</p></div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Status</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedConversation.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                      {selectedConversation.status === "active" ? "Ativo" : "Resolvido"}
                    </span>
                  </div>
                </div>
                <div className="p-4 border-t border-border space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Ações Rápidas</p>
                  <button onClick={() => setShowTransfer(true)} className="w-full h-8 px-3 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted flex items-center gap-2 transition-colors"><ArrowLeftRight className="w-3.5 h-3.5" /> Transferir Conversa</button>
                  <button onClick={() => setShowCreateTask(true)} className="w-full h-8 px-3 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted flex items-center gap-2 transition-colors"><ClipboardList className="w-3.5 h-3.5" /> Criar Tarefa</button>
                  <button onClick={markResolved} className="w-full h-8 px-3 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted flex items-center gap-2 transition-colors"><CheckCheck className="w-3.5 h-3.5" /> {selectedConversation.status === "active" ? "Marcar como Resolvido" : "Reabrir Conversa"}</button>
                  <button onClick={() => setRightPanelMode("ficha")} className="w-full h-8 px-3 rounded-md border border-primary text-xs text-primary hover:bg-primary/10 flex items-center gap-2 transition-colors font-medium"><FileText className="w-3.5 h-3.5" /> Abrir Ficha do Lead</button>
                </div>
              </>
            ) : (
              /* Ficha do Lead inline */
              fichaLead ? (
                <LeadFichaInline lead={fichaLead} onFieldUpdate={updateLeadField} />
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground py-8">Nenhum lead correspondente encontrado no sistema para "{selectedConversation.leadName}".</p>
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
            <p className="text-sm text-muted-foreground">Transferir conversa de <span className="font-medium text-foreground">{selectedConversation?.leadName}</span> para outro SDR.</p>
            <div className="space-y-2">
              <Label>Novo SDR</Label>
              <Select value={transferSdrId} onValueChange={setTransferSdrId}>
                <SelectTrigger><SelectValue placeholder="Selecionar SDR" /></SelectTrigger>
                <SelectContent>
                  {sdrs.map((s) => <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransfer(false)}>Cancelar</Button>
            <Button onClick={handleTransferConfirm} disabled={!transferSdrId}>Transferir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Criar Tarefa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Criar tarefa relacionada à conversa com <span className="font-medium text-foreground">{selectedConversation?.leadName}</span>.</p>
            <div className="space-y-2">
              <Label>Título da Tarefa</Label>
              <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Ex: Enviar proposta" />
            </div>
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

/* ─── Inline Ficha for Conversations right panel ─── */
function LeadFichaInline({ lead, onFieldUpdate }: { lead: DBLead; onFieldUpdate: (leadId: string, field: string, value: any) => Promise<boolean> }) {
  const { user } = useAuth();
  const { currentProject } = useProject();
  const [localLead, setLocalLead] = useState<DBLead>(lead);
  const [closers, setClosers] = useState<{ user_id: string; full_name: string }[]>([]);

  useEffect(() => { setLocalLead(lead); }, [lead]);

  useEffect(() => {
    const fetchClosers = async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").in("role", ["closer"]);
      if (!roles) return;
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", roles.map(r => r.user_id));
      if (profiles) setClosers(profiles);
    };
    fetchClosers();
  }, []);

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

  const sourceOptions = [
    { value: "Instagram", label: "Instagram" }, { value: "WhatsApp", label: "WhatsApp" },
    { value: "Indicação", label: "Indicação" }, { value: "Tráfego Pago", label: "Tráfego Pago" },
    { value: "YouTube", label: "YouTube" }, { value: "Orgânico", label: "Orgânico" }, { value: "Outro", label: "Outro" },
  ];
  const countryOptions = [
    { value: "Brasil", label: "Brasil" }, { value: "Portugal", label: "Portugal" },
    { value: "Estados Unidos", label: "Estados Unidos" }, { value: "Outro", label: "Outro" },
  ];
  const saleStatusOptions = [
    { value: "pending", label: "Pendente" }, { value: "sold", label: "Ganho" }, { value: "lost", label: "Perdido" },
  ];
  const qualificationOptions = [
    { value: "muito_qualificado", label: "Muito qualificado" }, { value: "qualificado", label: "Qualificado" },
    { value: "pouco_qualificado", label: "Pouco qualificado" }, { value: "desqualificado", label: "Desqualificado" },
  ];

  const SelectField = ({ label, value, field: f, options }: { label: string; value: string | null; field: string; options: { value: string; label: string }[] }) => (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <select value={value || ""} onChange={(e) => saveField(f, e.target.value || null)}
        className="w-full text-xs bg-transparent border border-transparent hover:border-input focus:border-ring rounded px-1 py-0.5 outline-none cursor-pointer text-foreground">
        <option value="">Selecionar...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const TextField = ({ label, value, field: f, placeholder }: { label: string; value: string | null; field: string; placeholder?: string }) => {
    const [draft, setDraft] = useState(value || "");
    const timerRef = useRef<NodeJS.Timeout>();
    useEffect(() => { setDraft(value || ""); }, [value]);
    const handleChange = (v: string) => {
      setDraft(v);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => saveField(f, v.trim() || null), 800);
    };
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
      <SelectField label="País" value={localLead.country} field="country" options={countryOptions} />
      <SelectField label="Origem" value={localLead.source} field="source" options={sourceOptions} />
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

      <SelectField label="Status Venda" value={localLead.sale_status} field="sale_status" options={saleStatusOptions} />
      <TextField label="Valor Venda" value={localLead.value_estimate != null ? String(localLead.value_estimate) : null} field="value_estimate" placeholder="0.00" />
      <SelectField label="Qualificação" value={localLead.qualification_score} field="qualification_score" options={qualificationOptions} />

      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Obs. SDR</p>
        <textarea value={localLead.sdr_observations || ""} onChange={(e) => {
          setLocalLead(prev => ({ ...prev, sdr_observations: e.target.value }));
          // debounce save handled by component lifecycle
        }}
        onBlur={(e) => saveField("sdr_observations", e.target.value.trim() || null)}
          className="w-full text-xs bg-transparent border border-transparent hover:border-input focus:border-ring rounded px-1 py-1 outline-none resize-none min-h-[40px] text-foreground placeholder:text-muted-foreground"
          placeholder="Observações..." rows={2} />
      </div>
    </div>
  );
}
