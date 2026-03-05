import { useState } from "react";
import { defaultStages, mockLeads, Lead } from "@/data/mockData";
import { LeadCard } from "@/components/LeadCard";
import { LeadDetailPanel } from "@/components/LeadDetailPanel";
import { useExpert } from "@/contexts/ExpertContext";
import { Plus, Filter, SlidersHorizontal } from "lucide-react";

export default function FunnelsPage() {
  const { currentExpert } = useExpert();
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);

  const handleDragStart = (leadId: string) => {
    setDraggedLead(leadId);
  };

  const handleDrop = (stageId: string) => {
    if (!draggedLead) return;
    setLeads((prev) =>
      prev.map((l) => (l.id === draggedLead ? { ...l, stage: stageId } : l))
    );
    setDraggedLead(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Funil de Vendas</h1>
          <p className="text-sm text-muted-foreground">{currentExpert.name} · Funil Lançamento</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-8 px-3 rounded-md border border-input text-sm text-muted-foreground hover:bg-muted flex items-center gap-1.5 transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filtros
          </button>
          <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
            <Plus className="w-3.5 h-3.5" />
            Novo Lead
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-3 h-full min-w-max">
          {defaultStages.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage.id);
            return (
              <div
                key={stage.id}
                className="w-72 flex flex-col rounded-lg bg-muted/40 border border-border/50"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.id)}
              >
                {/* Column Header */}
                <div className="px-3 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-sm font-medium text-foreground">{stage.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                      {stageLeads.length}
                    </span>
                  </div>
                  <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors">
                    <SlidersHorizontal className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>

                {/* Cards */}
                <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto scrollbar-thin">
                  {stageLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onDragStart={() => handleDragStart(lead.id)}
                      onClick={() => setSelectedLead(lead)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lead Detail Slide-over */}
      {selectedLead && (
        <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
}
