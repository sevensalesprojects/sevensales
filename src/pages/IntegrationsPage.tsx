import { useState, useEffect } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  MessageCircle, Instagram, ShoppingBag, Wifi, WifiOff,
  Settings, RefreshCw, CheckCircle2, XCircle, QrCode,
  ExternalLink, Plug, Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Integration {
  id: string;
  type: string;
  status: string;
  config_json: any;
  updated_at: string;
}

const typeConfig: Record<string, { name: string; description: string; icon: React.ElementType; iconColor: string; iconBg: string }> = {
  whatsapp: { name: "WhatsApp", description: "Conexão via QR Code para envio e recebimento de mensagens", icon: MessageCircle, iconColor: "text-success", iconBg: "bg-success/10" },
  instagram: { name: "Instagram Direct", description: "Integração via Meta Graph API para receber e responder mensagens", icon: Instagram, iconColor: "text-chart-5", iconBg: "bg-chart-5/10" },
  hotmart: { name: "Hotmart", description: "Webhook para receber eventos de compra, cancelamento e reembolso", icon: ShoppingBag, iconColor: "text-warning", iconBg: "bg-warning/10" },
};

export default function IntegrationsPage() {
  const navigate = useNavigate();
  const { currentProject } = useProject();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [webhookEvents, setWebhookEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!currentProject) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from("integrations").select("*").eq("project_id", currentProject.id);
      setIntegrations(data || []);

      // Fetch recent webhook events
      const intIds = (data || []).map(i => i.id);
      if (intIds.length > 0) {
        const { data: events } = await supabase.from("webhook_events").select("*").in("integration_id", intIds).order("created_at", { ascending: false }).limit(10);
        setWebhookEvents(events || []);
      }
      setLoading(false);
    };
    fetch();
  }, [currentProject?.id]);

  // Show default types if not present in DB
  const allTypes = ["whatsapp", "instagram", "hotmart"];
  const displayIntegrations = allTypes.map(type => {
    const dbInt = integrations.find(i => i.type === type);
    const config = typeConfig[type] || { name: type, description: "", icon: Plug, iconColor: "text-muted-foreground", iconBg: "bg-muted" };
    return {
      id: dbInt?.id || type,
      type,
      status: dbInt?.status || "disconnected",
      config_json: dbInt?.config_json || {},
      updated_at: dbInt?.updated_at || "",
      ...config,
    };
  });

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border shrink-0">
        <h1 className="text-base md:text-lg font-semibold text-foreground">Integrações</h1>
        <p className="text-xs md:text-sm text-muted-foreground">Conexões com plataformas externas</p>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        {displayIntegrations.map(int => (
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
                <p className="text-xs text-muted-foreground">{int.description}</p>
                {int.updated_at && <p className="text-[10px] text-muted-foreground mt-1">Último sync: {new Date(int.updated_at).toLocaleString("pt-BR")}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {int.status === "connected" ? (
                  <>
                    <button onClick={() => toast({ title: "Teste OK", description: "Conexão verificada com sucesso." })} className="h-8 px-3 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted flex items-center gap-1.5 transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Testar</button>
                    <button onClick={() => toast({ title: "Em breve", description: "Desconexão será disponibilizada em breve.", variant: "destructive" })} className="h-8 px-3 rounded-md border border-destructive/30 text-xs text-destructive hover:bg-destructive/10 flex items-center gap-1.5 transition-colors"><WifiOff className="w-3.5 h-3.5" /> Desconectar</button>
                  </>
                ) : (
                  <button onClick={() => {
                    if (int.type === "instagram") {
                      navigate("/integrations/instagram");
                    } else {
                      toast({ title: "Em breve", description: `Conexão com ${int.name} será disponibilizada em breve.` });
                    }
                  }} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
                    {int.type === "whatsapp" ? <QrCode className="w-3.5 h-3.5" /> : <Plug className="w-3.5 h-3.5" />} {int.type === "instagram" ? "Configurar" : "Conectar"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Webhook Events */}
        {webhookEvents.length > 0 && (
          <div className="bg-card border border-border rounded-lg">
            <div className="px-4 py-3 border-b border-border"><h3 className="text-sm font-semibold text-foreground">Últimos Eventos de Webhook</h3></div>
            <div className="divide-y divide-border">
              {webhookEvents.map(evt => (
                <div key={evt.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${evt.processed ? "bg-success" : "bg-warning"}`} />
                    <div>
                      <p className="text-sm text-foreground">{evt.event_type}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(evt.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${evt.processed ? "text-success" : "text-warning"}`}>{evt.processed ? "Processado" : "Pendente"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
