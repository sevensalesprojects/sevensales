import { useState } from "react";
import { defaultStages, mockLeads, Lead } from "@/data/mockData";
import { LeadCard } from "@/components/LeadCard";
import { LeadDetailPanel } from "@/components/LeadDetailPanel";
import { useExpert } from "@/contexts/ExpertContext";
import {
  Plus, Filter, LayoutGrid, List, Search, Download, Upload,
  SlidersHorizontal, MoreHorizontal, Trash2, UserCog, ArrowRightLeft,
} from "lucide-react";

type ViewMode = "kanban" | "list";

const tagColors: Record<string, string> = {
  quente: "bg-destructive/15 text-destructive",
  morno: "bg-warning/15 text-warning",
  frio: "bg-info/15 text-info",
  cliente: "bg-success/15 text-success",
  vip: "bg-primary/15 text-primary",
};

export default function LeadsPage() {
  const { currentExpert } = useExpert();
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredLeads = leads.filter((l) => {
    const matchesSearch = !searchQuery || l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.phone.includes(searchQuery);
    const matchesTag = !selectedTag || l.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleDragStart = (leadId: string) => setDraggedLead(leadId);
  const handleDrop = (stageId: string) => {
    if (!draggedLead) return;
    setLeads((prev) => prev.map((l) => (l.id === draggedLead ? { ...l, stage: stageId } : l)));
    setDraggedLead(null);
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const allTags = Array.from(new Set(leads.flatMap((l) => l.tags)));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground">{currentExpert.name} · {filteredLeads.length} leads</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border border-input rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("kanban")}
              className={`h-8 w-8 flex items-center justify-center transition-colors ${viewMode === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`h-8 w-8 flex items-center justify-center transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
          <button className="h-8 px-3 rounded-md border border-input text-sm text-muted-foreground hover:bg-muted flex items-center gap-1.5 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Importar
          </button>
          <button className="h-8 px-3 rounded-md border border-input text-sm text-muted-foreground hover:bg-muted flex items-center gap-1.5 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>
          <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
            <Plus className="w-3.5 h-3.5" />
            Novo Lead
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full rounded-md border border-input bg-muted/50 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setSelectedTag(null)}
            className={`h-7 px-2.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${!selectedTag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            Todos
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`h-7 px-2.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${selectedTag === tag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {viewMode === "kanban" ? (
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-3 h-full min-w-max">
            {defaultStages.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => l.stage === stage.id);
              return (
                <div
                  key={stage.id}
                  className="w-72 flex flex-col rounded-lg bg-muted/40 border border-border/50"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(stage.id)}
                >
                  <div className="px-3 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-sm font-medium text-foreground">{stage.name}</span>
                      <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">{stageLeads.length}</span>
                    </div>
                    <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors">
                      <SlidersHorizontal className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto scrollbar-thin">
                    {stageLeads.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} onDragStart={() => handleDragStart(lead.id)} onClick={() => setSelectedLead(lead)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Telefone</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Origem</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Etapa</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">SDR</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tags</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Valor</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
                  const stage = defaultStages.find((s) => s.id === lead.stage);
                  return (
                    <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{lead.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{lead.phone}</td>
                      <td className="px-4 py-3 text-muted-foreground">{lead.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{lead.origin}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage?.color }} />
                          {stage?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{lead.sdr}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {lead.tags.map((tag) => (
                            <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tagColors[tag] || "bg-muted text-muted-foreground"}`}>{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">{lead.value ? `R$ ${lead.value.toLocaleString("pt-BR")}` : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted" title="Atribuir SDR">
                            <UserCog className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted" title="Mover funil">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-destructive/10" title="Excluir">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedLead && <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />}
    </div>
  );
}
