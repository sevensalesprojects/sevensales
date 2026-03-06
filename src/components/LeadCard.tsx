import { DBLead } from "@/hooks/useLeads";
import { Phone, MessageCircle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface LeadCardProps {
  lead: DBLead;
  onDragStart: () => void;
  onClick: () => void;
  currencyCode?: string;
}

const tagColors: Record<string, string> = {
  quente: "bg-destructive/15 text-destructive",
  morno: "bg-warning/15 text-warning",
  frio: "bg-info/15 text-info",
  cliente: "bg-success/15 text-success",
  vip: "bg-primary/15 text-primary",
};

export function LeadCard({ lead, onDragStart, onClick, currencyCode = "BRL" }: LeadCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium text-card-foreground leading-tight">{lead.name}</p>
        {lead.value_estimate != null && lead.value_estimate > 0 && (
          <span className="text-xs font-semibold text-primary">
            {formatCurrency(lead.value_estimate, currencyCode)}
          </span>
        )}
      </div>

      {lead.phone && (
        <div className="flex items-center gap-2 mb-2">
          <Phone className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{lead.phone}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-1 mb-2">
        {lead.tags.map((tag) => (
          <span
            key={tag}
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tagColors[tag.toLowerCase()] || "bg-muted text-muted-foreground"}`}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{lead.source || "—"}</span>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <MessageCircle className="w-3 h-3" />
          {new Date(lead.updated_at).toLocaleDateString("pt-BR")}
        </div>
      </div>
    </div>
  );
}
