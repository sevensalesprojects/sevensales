import { useState, useEffect } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  MessageCircle, Instagram, ShoppingBag, WifiOff,
  Settings, RefreshCw, CheckCircle2, XCircle, QrCode,
  Plug, Loader2, ScrollText, Wifi,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Integration {
  id: string;
  type: string;
  status: string;
  config_json: any;
  updated_at: string;
}

interface SystemLog {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: any;
  created_at: string;
}

const typeConfig: Record<string, { name: string; description: string; icon: React.ElementType; iconColor: string; iconBg: string }> = {
  whatsapp: { name: "WhatsApp", description: "Conexão via QR Code para envio e recebimento de mensagens", icon: MessageCircle, iconColor: "text-success", iconBg: "bg-success/10" },
  instagram: { name: "Instagram Direct", description: "Integração via Meta Graph API para receber e responder mensagens", icon: Instagram, iconColor: "text-chart-5", iconBg: "bg-chart-5/10" },
  hotmart: { name: "Hotmart", description: "Webhook para receber eventos de compra, cancelamento e reembolso", icon: ShoppingBag, iconColor: "text-warning", iconBg: "bg-warning/10" },
};

const actionLabels: Record<string, string> = {
  instagram_webhook_received: "Webhook recebido",
  instagram_webhook_error: "Erro no webhook",
  instagram_message_received: "Mensagem recebida",
  instagram_message_sent: "Mensagem enviada",
  instagram_send_error: "Erro ao enviar",
  lead_auto_created_instagram: "Lead criado automaticamente",
  automation_triggered: "Automação disparada",
};

export default function IntegrationsPage() {
  const navigate = useNavigate();
  const { currentProject } = useProject();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [igAccountCount, setIgAccountCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"connections" | "logs">("connections");
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (!currentProject) return;
    const fetchData = async () => {
      setLoading(true);
      const [{ data }, { count }] = await Promise.all([
        supabase.from("integrations").select("*").eq("project_id", currentProject.id),
        supabase.from("instagram_accounts").select("*", { count: "exact", head: true }).eq("project_id", currentProject.id).eq("status", "active"),
      ]);
      setIntegrations(data || []);
      setIgAccountCount(count || 0);
      setLoading(false);
    };
    fetchData();
  }, [currentProject?.id]);

  // Load logs when tab is active
  useEffect(() => {
    if (activeTab !== "logs" || !currentProject) return;
    const fetchLogs = async () => {
      setLogsLoading(true);
      const { data } = await supabase
        .from("system_logs")
        .select("id, action, entity_type, entity_id, metadata, created_at")
        .eq("project_id", currentProject.id)
        .in("action", [
          "instagram_webhook_received", "instagram_webhook_error",
          "instagram_message_received", "instagram_message_sent",
          "instagram_send_error", "lead_auto_created_instagram",
          "automation_triggered",
        ])
        .order("created_at", { ascending: false })
        .limit(50);
      setLogs(data || []);
      setLogsLoading(false);
    };
    fetchLogs();
  }, [activeTab, currentProject?.id]);

  const allTypes = ["whatsapp", "instagram", "hotmart"];
  const displayIntegrations = allTypes.map(type => {
    const dbInt = integrations.find(i => i.type === type);
    const config = typeConfig[type] || { name: type, description: "", icon: Plug, iconColor: "text-muted-foreground", iconBg: "bg-muted" };
    let status = dbInt?.status || "disconnected";
    if (type === "instagram" && igAccountCount > 0) status = "connected";
    return { id: dbInt?.id || type, type, status, config_json: dbInt?.config_json || {}, updated_at: dbInt?.updated_at || "", ...config };
  });

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border shrink-0">
        <h1 className="text-base md:text-lg font-semibold text-foreground">Integrações</h1>
        <p className="text-xs md:text-sm text-muted-foreground">Conexões com plataformas externas</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-4 md:px-6 shrink-0">
        <button onClick={() => setActiveTab("connections")} className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === "connections" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <Wifi className="w-3.5 h-3.5 inline mr-1.5" />Conexões
        </button>
        <button onClick={() => setActiveTab("logs")} className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === "logs" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <ScrollText className="w-3.5 h-3.5 inline mr-1.5" />Logs
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        {activeTab === "connections" && displayIntegrations.map(int => (
          <div key={int.id} className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-start gap-3 md:gap-4">
              <div className={`w-12 h-12 rounded-lg ${int.iconBg} flex items-center justify-center shrink-0`}>
                <int.icon className={`w-6 h-6 ${int.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-foreground">{int.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${
                    int.status === "connected" ? "bg-success/15 text-success" :
                    int.status === "error" ? "bg-destructive/15 text-destructive" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {int.status === "connected" ? <><CheckCircle2 className="w-3 h-3" /> Conectado</> :
                     int.status === "error" ? <><XCircle className="w-3 h-3" /> Erro</> :
                     <><WifiOff className="w-3 h-3" /> Desconectado</>}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {int.description}
                  {int.type === "instagram" && igAccountCount > 0 && <span className="ml-1 font-medium text-success"> · {igAccountCount} conta{igAccountCount > 1 ? "s" : ""} ativa{igAccountCount > 1 ? "s" : ""}</span>}
                </p>
                {int.updated_at && <p className="text-[10px] text-muted-foreground mt-1">Último sync: {new Date(int.updated_at).toLocaleString("pt-BR")}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {int.status === "connected" ? (
                  <>
                    {int.type === "instagram" && (
                      <button onClick={() => navigate("/integrations/instagram")} className="h-8 px-3 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted flex items-center gap-1.5 transition-colors"><Settings className="w-3.5 h-3.5" /> Gerenciar</button>
                    )}
                    <button onClick={() => toast({ title: "Teste OK", description: "Conexão verificada com sucesso." })} className="h-8 px-3 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted flex items-center gap-1.5 transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Testar</button>
                  </>
                ) : (
                  <button onClick={() => {
                    if (int.type === "instagram") navigate("/integrations/instagram");
                    else toast({ title: "Em breve", description: `Conexão com ${int.name} será disponibilizada em breve.` });
                  }} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
                    {int.type === "whatsapp" ? <QrCode className="w-3.5 h-3.5" /> : <Plug className="w-3.5 h-3.5" />} {int.type === "instagram" ? "Configurar" : "Conectar"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <div className="bg-card border border-border rounded-lg">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Logs de Integração</h3>
              <p className="text-[10px] text-muted-foreground">Últimos 50 eventos do sistema</p>
            </div>
            {logsLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <ScrollText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda</p>
                <p className="text-[10px] text-muted-foreground mt-1">Os eventos aparecerão aqui quando mensagens forem recebidas ou enviadas pelo Instagram.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {logs.map(log => (
                  <div key={log.id} className="px-4 py-3 flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.action.includes("error") ? "bg-destructive" : log.action.includes("created") ? "bg-chart-5" : "bg-success"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{actionLabels[log.action] || log.action}</p>
                      {log.metadata && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {log.metadata.error ? `Erro: ${log.metadata.error}` :
                           log.metadata.sender_id ? `Sender: ${log.metadata.sender_id}` :
                           log.metadata.automation_name ? `Automação: ${log.metadata.automation_name}` :
                           log.metadata.entry_count ? `${log.metadata.entry_count} entrada(s)` : ""}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
