import { useState } from "react";
import { useExpert } from "@/contexts/ExpertContext";
import { toast } from "@/hooks/use-toast";
import {
  MessageCircle, Instagram, ShoppingBag, Wifi, WifiOff,
  Settings, RefreshCw, CheckCircle2, XCircle, QrCode,
  ExternalLink, Plug,
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  status: "connected" | "disconnected" | "error";
  details?: Record<string, string>;
}

const integrations: Integration[] = [
  {
    id: "whatsapp", name: "WhatsApp", description: "Conexão via QR Code para envio e recebimento de mensagens",
    icon: MessageCircle, iconColor: "text-success", iconBg: "bg-success/10",
    status: "connected",
    details: { "Número": "+55 11 99999-0001", "Projeto": "Expert Fábio", "SDR": "Carlos Mendes", "Último Sync": "Há 5 min" },
  },
  {
    id: "instagram", name: "Instagram Direct", description: "Integração via Meta Graph API para receber e responder mensagens",
    icon: Instagram, iconColor: "text-chart-5", iconBg: "bg-chart-5/10",
    status: "disconnected",
    details: { "Conta": "—", "Página Facebook": "—" },
  },
  {
    id: "hotmart", name: "Hotmart", description: "Webhook para receber eventos de compra, cancelamento e reembolso",
    icon: ShoppingBag, iconColor: "text-warning", iconBg: "bg-warning/10",
    status: "connected",
    details: { "Webhook URL": "https://api.vendaflow.com/wh/hotmart", "Eventos": "Compra, Cancelamento, Reembolso", "Último evento": "Há 2h" },
  },
];

export default function IntegrationsPage() {
  const { currentExpert } = useExpert();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Integrações</h1>
          <p className="text-sm text-muted-foreground">Central de conexões com plataformas externas</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {integrations.map((int) => (
          <div key={int.id} className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-5 flex items-start gap-4">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-lg ${int.iconBg} flex items-center justify-center shrink-0`}>
                <int.icon className={`w-6 h-6 ${int.iconColor}`} />
              </div>

              {/* Info */}
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
                <p className="text-xs text-muted-foreground mb-3">{int.description}</p>

                {/* Details */}
                {int.details && (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    {Object.entries(int.details).map(([key, val]) => (
                      <div key={key}>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{key}</p>
                        <p className="text-xs text-foreground">{val}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {int.status === "connected" ? (
                  <>
                    <button onClick={() => toast({ title: "Teste OK", description: "Conexão verificada com sucesso." })} className="h-8 px-3 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted flex items-center gap-1.5 transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" /> Testar
                    </button>
                    <button onClick={() => toast({ title: "Em breve", description: "Edição de integração será disponibilizada em breve." })} className="h-8 px-3 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted flex items-center gap-1.5 transition-colors">
                      <Settings className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button onClick={() => toast({ title: "Em breve", description: "Desconexão de integração será disponibilizada em breve.", variant: "destructive" })} className="h-8 px-3 rounded-md border border-destructive/30 text-xs text-destructive hover:bg-destructive/10 flex items-center gap-1.5 transition-colors">
                      <WifiOff className="w-3.5 h-3.5" /> Desconectar
                    </button>
                  </>
                ) : (
                  <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
                    {int.id === "whatsapp" ? <QrCode className="w-3.5 h-3.5" /> : <Plug className="w-3.5 h-3.5" />}
                    Conectar
                  </button>
                )}
              </div>
            </div>

            {/* WhatsApp QR Code hint */}
            {int.id === "whatsapp" && int.status === "disconnected" && (
              <div className="px-5 py-4 bg-muted/30 border-t border-border flex items-center gap-3">
                <QrCode className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-foreground">Escaneie o QR Code</p>
                  <p className="text-[10px] text-muted-foreground">Abra o WhatsApp no celular → Configurações → Aparelhos conectados → Conectar aparelho</p>
                </div>
              </div>
            )}

            {/* Instagram OAuth hint */}
            {int.id === "instagram" && int.status === "disconnected" && (
              <div className="px-5 py-4 bg-muted/30 border-t border-border flex items-center gap-3">
                <ExternalLink className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-foreground">Autenticação via Meta</p>
                  <p className="text-[10px] text-muted-foreground">Conecte sua conta Instagram Business via Facebook Business Manager e autorize o acesso ao Direct</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Webhook Events */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Últimos Eventos de Webhook</h3>
          </div>
          <div className="divide-y divide-border">
            {[
              { event: "Compra aprovada", product: "Curso Expert Digital", lead: "Bruno Almeida", value: "R$ 2.497", time: "Há 2h", status: "success" },
              { event: "Compra aprovada", product: "Mentoria VIP", lead: "Fernanda Dias", value: "R$ 12.000", time: "Há 6h", status: "success" },
              { event: "Reembolso", product: "Curso Expert Digital", lead: "Carlos Pereira", value: "R$ 2.497", time: "Há 1d", status: "error" },
            ].map((evt, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${evt.status === "success" ? "bg-success" : "bg-destructive"}`} />
                  <div>
                    <p className="text-sm text-foreground">{evt.event} — <span className="font-medium">{evt.product}</span></p>
                    <p className="text-[10px] text-muted-foreground">{evt.lead} · {evt.time}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${evt.status === "success" ? "text-success" : "text-destructive"}`}>{evt.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
