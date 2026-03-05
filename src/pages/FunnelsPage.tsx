import { useState } from "react";
import { useFunnels } from "@/hooks/useFunnels";
import { useLeads, DBLead } from "@/hooks/useLeads";
import { useProject } from "@/contexts/ProjectContext";
import { LeadDetailPanel } from "@/components/LeadDetailPanel";
import { CreateLeadDialog } from "@/components/CreateLeadDialog";
import { Plus, Filter, SlidersHorizontal, Loader2, Phone, MessageCircle } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const tagColors: Record<string, string> = {
  quente: "bg-destructive/15 text-destructive",
  morno: "bg-warning/15 text-warning",
  frio: "bg-info/15 text-info",
  cliente: "bg-success/15 text-success",
  vip: "bg-primary/15 text-primary",
};

export default function FunnelsPage() {
  const { currentProject } = useProject();
  const { funnels, loading: funnelsLoading } = useFunnels();
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>("");
  const activeFunnel = funnels.find((f) => f.id === selectedFunnelId) || funnels[0];
  const { leads, loading: leadsLoading, updateLeadStage, createLead } = useLeads(activeFunnel?.id);
  const [selectedLead, setSelectedLead] = useState<DBLead | null>(null);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [filterStage, setFilterStage] = useState<string | null>(null);

  const loading = funnelsLoading || leadsLoading;

  const handleDrop = async (stageId: string) => {
    if (!draggedLead) return;
    const success = await updateLeadStage(draggedLead, stageId);
    if (success) toast({ title: "Lead movido", description: "Etapa atualizada com sucesso." });
    setDraggedLead(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeFunnel) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <p className="text-muted-foreground mb-2">Nenhum funil encontrado para este projeto.</p>
        <button
          onClick={() => toast({ title: "Em breve", description: "Criação de funil será disponibilizada nas Configurações." })}
          className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          Criar Funil
        </button>
      </div>
    );
  }

  const stages = activeFunnel.stages;
  const filteredLeads = filterStage ? leads.filter(l => l.stage_id === filterStage) : leads;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-semibold text-foreground">Funil de Vendas</h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">{currentProject?.name}</p>
          </div>
          {funnels.length > 1 && (
            <Select value={activeFunnel.id} onValueChange={setSelectedFunnelId}>
              <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {funnels.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterStage || "all"} onValueChange={(v) => setFilterStage(v === "all" ? null : v)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <Filter className="w-3.5 h-3.5 mr-1" />
              <SelectValue placeholder="Filtros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Etapas</SelectItem>
              {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <button
            onClick={() => setShowCreateLead(true)}
            className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Lead
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-3 md:p-4">
        <div className="flex gap-3 h-full min-w-max">
          {stages.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.stage_id === stage.id);
            return (
              <div
                key={stage.id}
                className="w-72 flex flex-col rounded-lg bg-muted/40 border border-border/50"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(stage.id)}
              >
                <div className="px-3 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-sm font-medium text-foreground">{stage.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">{stageLeads.length}</span>
                  </div>
                  <button
                    onClick={() => setFilterStage(filterStage === stage.id ? null : stage.id)}
                    className={`w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors ${filterStage === stage.id ? "bg-primary/10" : ""}`}
                  >
                    <SlidersHorizontal className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto scrollbar-thin">
                  {stageLeads.map((lead) => (
                    <DBLeadCard key={lead.id} lead={lead} onDragStart={() => setDraggedLead(lead.id)} onClick={() => setSelectedLead(lead)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedLead && <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />}
      <CreateLeadDialog
        open={showCreateLead}
        onOpenChange={setShowCreateLead}
        onSubmit={async (data) => {
          const result = await createLead(data);
          if (result) toast({ title: "Lead criado", description: `${data.name} foi adicionado ao funil.` });
        }}
        stages={stages}
        funnelId={activeFunnel.id}
      />
    </div>
  );
}

function DBLeadCard({ lead, onDragStart, onClick }: { lead: DBLead; onDragStart: () => void; onClick: () => void }) {
  return (
    <div draggable onDragStart={onDragStart} onClick={onClick} className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all group">
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium text-card-foreground leading-tight">{lead.name}</p>
        {lead.value_estimate && <span className="text-xs font-semibold text-primary">R$ {lead.value_estimate.toLocaleString("pt-BR")}</span>}
      </div>
      {lead.phone && (
        <div className="flex items-center gap-2 mb-2">
          <Phone className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{lead.phone}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-1 mb-2">
        {lead.tags.map((tag) => (
          <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tagColors[tag.toLowerCase()] || "bg-muted text-muted-foreground"}`}>{tag}</span>
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
