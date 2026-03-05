import { useState } from "react";
import { useExpert } from "@/contexts/ExpertContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Search, Phone, Mail, Instagram, MessageCircle, Send,
  Paperclip, Smile, Mic, Image, UserCog, CheckCheck,
  ArrowLeftRight, XCircle, ArrowLeft,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
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
  { id: "c1", leadName: "Maria Silva", leadInitials: "MS", lastMessage: "Sim, por favor! Qual o valor?", channel: "whatsapp", time: "14:40", unread: 2, sdr: "Carlos", phone: "(11) 99999-1111", email: "maria@email.com", status: "active" },
  { id: "c2", leadName: "João Oliveira", leadInitials: "JO", lastMessage: "Vou pensar e retorno amanhã", channel: "whatsapp", time: "13:22", unread: 0, sdr: "Ana", phone: "(21) 98888-2222", email: "joao@email.com", status: "active" },
  { id: "c3", leadName: "Ana Costa", leadInitials: "AC", lastMessage: "Obrigada pelas informações!", channel: "instagram", time: "12:05", unread: 1, sdr: "Carlos", phone: "(31) 97777-3333", email: "ana@email.com", status: "active" },
  { id: "c4", leadName: "Pedro Santos", leadInitials: "PS", lastMessage: "Quero agendar a reunião", channel: "whatsapp", time: "11:30", unread: 0, sdr: "Ana", phone: "(41) 96666-4444", email: "pedro@email.com", status: "active" },
  { id: "c5", leadName: "Lucas Ferreira", leadInitials: "LF", lastMessage: "Me envie o link de pagamento", channel: "instagram", time: "10:15", unread: 3, sdr: "Carlos", phone: "(51) 95555-5555", email: "lucas@email.com", status: "active" },
  { id: "c6", leadName: "Bruno Almeida", leadInitials: "BA", lastMessage: "Obrigado, já efetuei a compra!", channel: "whatsapp", time: "Ontem", unread: 0, sdr: "Carlos", phone: "(91) 91111-9999", email: "bruno@email.com", status: "resolved" },
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
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(isMobile ? null : conversations[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterChannel, setFilterChannel] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(initialMessages);

  const messages = selectedConversation ? (messagesMap[selectedConversation.id] || []) : [];

  const filteredConversations = conversations.filter((c) => {
    const matchSearch = !searchQuery || c.leadName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchChannel = !filterChannel || c.channel === filterChannel;
    return matchSearch && matchChannel;
  });

  const handleSend = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      text: messageInput,
      from: "sdr",
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      channel: selectedConversation.channel,
    };
    setMessagesMap(prev => ({
      ...prev,
      [selectedConversation.id]: [...(prev[selectedConversation.id] || []), newMsg],
    }));
    setConversations(prev => prev.map(c =>
      c.id === selectedConversation.id ? { ...c, lastMessage: messageInput, time: newMsg.time, unread: 0 } : c
    ));
    setMessageInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const markResolved = () => {
    if (!selectedConversation) return;
    setConversations(prev => prev.map(c =>
      c.id === selectedConversation.id ? { ...c, status: c.status === "active" ? "resolved" : "active" } : c
    ));
    setSelectedConversation(prev => prev ? ({ ...prev, status: prev.status === "active" ? "resolved" : "active" }) : null);
    toast({ title: selectedConversation.status === "active" ? "Conversa resolvida" : "Conversa reaberta" });
  };

  const handleTransfer = () => {
    toast({ title: "Em breve", description: "Transferência de conversa será disponibilizada quando a equipe estiver cadastrada no sistema." });
  };

  const handleAssign = () => {
    toast({ title: "Em breve", description: "Atribuição de SDR será disponibilizada quando a equipe estiver cadastrada." });
  };

  const handleClose = () => {
    if (!selectedConversation) return;
    setConversations(prev => prev.map(c =>
      c.id === selectedConversation.id ? { ...c, status: "resolved" } : c
    ));
    setSelectedConversation(prev => prev ? ({ ...prev, status: "resolved" }) : null);
    toast({ title: "Conversa encerrada", description: `Conversa com ${selectedConversation.leadName} foi encerrada.` });
  };

  // Mobile: show list or chat
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
              <button key={conv.id} onClick={() => setSelectedConversation(conv)}
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
                <button onClick={handleAssign} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors" title="Assumir conversa">
                  <UserCog className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              {!isMobile && (
                <button onClick={handleTransfer} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors" title="Transferir">
                  <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                </button>
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

      {/* Column 3 — Lead Info (desktop only) */}
      {!isMobile && selectedConversation && (
        <div className="w-72 border-l border-border flex flex-col shrink-0 overflow-y-auto scrollbar-thin">
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
            <button onClick={handleAssign} className="w-full h-8 px-3 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted flex items-center gap-2 transition-colors"><UserCog className="w-3.5 h-3.5" /> Atribuir SDR</button>
            <button onClick={handleTransfer} className="w-full h-8 px-3 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted flex items-center gap-2 transition-colors"><ArrowLeftRight className="w-3.5 h-3.5" /> Transferir Conversa</button>
            <button onClick={markResolved} className="w-full h-8 px-3 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted flex items-center gap-2 transition-colors"><CheckCheck className="w-3.5 h-3.5" /> {selectedConversation.status === "active" ? "Marcar como Resolvido" : "Reabrir Conversa"}</button>
          </div>
          <div className="p-4 border-t border-border space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Automações</p>
            <div className="p-2.5 rounded-md bg-muted/50 border border-border"><p className="text-xs font-medium text-foreground">Mensagem de boas-vindas</p><p className="text-[10px] text-muted-foreground">Ativada · Enviada no primeiro contato</p></div>
            <div className="p-2.5 rounded-md bg-muted/50 border border-border"><p className="text-xs font-medium text-foreground">Fora do horário</p><p className="text-[10px] text-muted-foreground">Ativada · 19h às 8h</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
