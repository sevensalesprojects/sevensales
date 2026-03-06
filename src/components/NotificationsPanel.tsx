import { useNotifications } from "@/hooks/useNotifications";
import { Bell, Check, CheckCheck, Clock, DollarSign, Phone, MessageCircle, X } from "lucide-react";

const typeIcons: Record<string, any> = {
  followup: Clock,
  sale: DollarSign,
  sale_approved: DollarSign,
  call_scheduled: Phone,
  lead_waiting: MessageCircle,
  default: Bell,
};

const typeLabels: Record<string, string> = {
  followup: "Follow-ups",
  sale: "Vendas",
  sale_approved: "Vendas",
  call_scheduled: "Calls",
  lead_waiting: "Retornos",
};

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const { notifications, unreadCount, countByType, markAsRead, markAllAsRead } = useNotifications();

  if (!open) return null;

  const categories = [
    { type: "followup", label: "Follow-ups pendentes", count: countByType("followup") },
    { type: "lead_waiting", label: "Leads aguardando retorno", count: countByType("lead_waiting") },
    { type: "sale", label: "Vendas", count: countByType("sale") + countByType("sale_approved") },
    { type: "call_scheduled", label: "Calls agendadas", count: countByType("call_scheduled") },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed top-14 right-4 w-80 max-h-[70vh] bg-card border border-border rounded-lg shadow-lg z-50 flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">{unreadCount}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-[10px] text-primary hover:underline">
                Marcar tudo como lido
              </button>
            )}
            <button onClick={onClose} className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Category counters */}
        <div className="px-4 py-2 border-b border-border grid grid-cols-2 gap-1.5 shrink-0">
          {categories.map(cat => (
            <div key={cat.type} className="flex items-center gap-1.5 text-xs">
              {(() => { const Icon = typeIcons[cat.type] || typeIcons.default; return <Icon className="w-3 h-3 text-muted-foreground" />; })()}
              <span className="text-muted-foreground">{cat.label}:</span>
              <span className="font-semibold text-foreground">{cat.count}</span>
            </div>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {notifications.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma notificação</p>
          )}
          {notifications.map(n => {
            const Icon = typeIcons[n.type] || typeIcons.default;
            return (
              <div
                key={n.id}
                onClick={() => !n.is_read && markAsRead(n.id)}
                className={`px-4 py-3 border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${!n.is_read ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{n.title}</p>
                    {n.description && <p className="text-[10px] text-muted-foreground mt-0.5">{n.description}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
