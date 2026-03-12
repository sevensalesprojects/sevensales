import { useIntegrationHealth } from "@/hooks/useIntegrationHealth";
import { AlertTriangle, Wifi, WifiOff, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function IntegrationHealthBanner() {
  const { statuses, loading, hasAlert, igTokenExpiring } = useIntegrationHealth();
  const navigate = useNavigate();

  if (loading || !hasAlert) return null;

  const disconnected = statuses.filter(s => s.status === "disconnected");

  return (
    <div className="mx-4 md:mx-6 mt-3 space-y-2">
      {disconnected.length > 0 && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-destructive">Integrações desconectadas</p>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {disconnected.map((s) => (
                <span key={s.type} className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive flex items-center gap-1">
                  <WifiOff className="w-3 h-3" />
                  {s.label}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Acesse Integrações para reconectar e evitar perda de mensagens.
            </p>
          </div>
        </div>
      )}

      {igTokenExpiring.length > 0 && (
        <div className="p-3 rounded-lg border border-warning/30 bg-warning/5 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-warning">Token Instagram expirando</p>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {igTokenExpiring.map((acc, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                  {acc.username || "Conta"}: {acc.daysLeft === 0 ? "Expirado" : `${acc.daysLeft} dia(s) restante(s)`}
                </span>
              ))}
            </div>
            <button
              onClick={() => navigate("/integrations/instagram")}
              className="text-[10px] text-primary hover:underline mt-1"
            >
              Renovar token →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function IntegrationStatusDots() {
  const { statuses, loading } = useIntegrationHealth();

  if (loading) return null;

  return (
    <div className="flex items-center gap-1.5">
      {statuses.map((s) => (
        <div key={s.type} className="flex items-center gap-1" title={`${s.label}: ${s.status === "connected" ? "Conectado" : "Desconectado"}`}>
          <div className={`w-2 h-2 rounded-full ${s.status === "connected" ? "bg-green-500" : "bg-destructive animate-pulse"}`} />
          <span className="text-[10px] text-muted-foreground hidden xl:inline">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
