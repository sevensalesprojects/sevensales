import { useState } from "react";
import { useFunnels } from "@/hooks/useFunnels";
import { useLeads, DBLead } from "@/hooks/useLeads";
import { useProject } from "@/contexts/ProjectContext";
import { LeadDetailPanel } from "@/components/LeadDetailPanel";
import { CreateLeadDialog } from "@/components/CreateLeadDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Plus, LayoutGrid, List, Search, Download, Upload,
  SlidersHorizontal, Trash2, UserCog, ArrowRightLeft, Loader2, Phone, MessageCircle,
} from "lucide-react";
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

export default function LeadsPage() {
  const { currentProject } = useProject();
  const { funnels, loading: funnelsLoading } = useFunnels();
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>("");
  const activeFunnel = funnels.find((f) => f.id === selectedFunnelId) || funnels[0];
  const { leads, loading: leadsLoading, updateLeadStage, updateLeadField, createLead, deleteLead } = useLeads(activeFunnel?.id);
  const [selectedLead, setSelectedLead] = useState<DBLead | null>(null);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DBLead | null>(null);
  const [moveTarget, setMoveTarget] = useState<DBLead | null>(null);
  const isMobile = useIsMobile();

  const loading = funnelsLoading || leadsLoading;
  const stages = activeFunnel?.stages || [];

  const filteredLeads = leads.filter((l) => {
    const matchesSearch = !searchQuery || l.name.toLowerCase().includes(searchQuery.toLowerCase()) || (l.phone || "").includes(searchQuery);
    const matchesTag = !selectedTag || l.tags.map(t => t.toLowerCase()).includes(selectedTag.toLowerCase());
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(leads.flatMap((l) => l.tags)));

  const handleDrop = async (stageId: string) => {
    if (!draggedLead) return;
    await updateLeadStage(draggedLead, stageId);
    setDraggedLead(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const success = await deleteLead(deleteTarget.id);
    if (success) toast({ title: "Lead excluído", description: `${deleteTarget.name} foi removido.` });
    setDeleteTarget(null);
  };

  const handleExport = () => {
    const csv = [
      ["Nome", "Telefone", "Email", "Origem", "Canal", "Valor", "Tags"].join(","),
      ...filteredLeads.map(l => [
        `"${l.name}"`, l.phone || "", l.email || "", l.source || "", l.channel || "",
        l.value_estimate || "", `"${l.tags.join(";")}"`,
      ].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${currentProject?.name || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exportado", description: `${filteredLeads.length} leads exportados em CSV.` });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex items-center justify-between shrink-0 gap-2">
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-semibold text-foreground">Leads</h1>
          <p className="text-xs md:text-sm text-muted-foreground truncate">{currentProject?.name} · {filteredLeads.length} leads</p>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {funnels.length > 1 && !isMobile && (
            <Select value={activeFunnel?.id || ""} onValueChange={setSelectedFunnelId}>
              <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Funil" /></SelectTrigger>
              <SelectContent>{funnels.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          {!isMobile && (
            <>
              <button onClick={() => toast({ title: "Em breve", description: "Importação CSV será disponibilizada em breve." })} className="h-8 px-3 rounded-md border border-input text-sm text-muted-foreground hover:bg-muted flex items-center gap-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5" /> Importar
              </button>
              <button onClick={handleExport} className="h-8 px-3 rounded-md border border-input text-sm text-muted-foreground hover:bg-muted flex items-center gap-1.5 transition-colors">
                <Download className="w-3.5 h-3.5" /> Exportar
              </button>
            </>
          )}
          <button onClick={() => setShowCreateLead(true)} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
            <Plus className="w-3.5 h-3.5" />
            {!isMobile && "Novo Lead"}
          </button>
        </div>
      </div>

      {/* Mobile funnel selector */}
      {isMobile && funnels.length > 1 && (
        <div className="px-4 py-2 border-b border-border shrink-0">
          <Select value={activeFunnel?.id || ""} onValueChange={setSelectedFunnelId}>
            <SelectTrigger className="w-full h-8 text-xs"><SelectValue placeholder="Funil" /></SelectTrigger>
            <SelectContent>{funnels.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      {/* Filters Bar */}
      <div className="px-4 md:px-6 py-2 md:py-3 border-b border-border flex items-center gap-2 md:gap-3 shrink-0 overflow-x-auto">
        <div className="relative flex-1 min-w-[150px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full rounded-md border border-input bg-muted/50 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin shrink-0">
          <button onClick={() => setSelectedTag(null)} className={`h-7 px-2.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${!selectedTag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>Todos</button>
          {allTags.map((tag) => (
            <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`h-7 px-2.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${selectedTag === tag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{tag}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      {viewMode === "kanban" ? (
        <div className="flex-1 overflow-x-auto p-3 md:p-4">
          <div className="flex gap-3 h-full min-w-max">
            {stages.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => l.stage_id === stage.id);
              return (
                <div key={stage.id} className={`flex flex-col rounded-lg bg-muted/40 border border-border/50 ${isMobile ? "w-64" : "w-72"}`} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(stage.id)}>
                  <div className="px-3 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-sm font-medium text-foreground">{stage.name}</span>
                      <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">{stageLeads.length}</span>
                    </div>
                  </div>
                  <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto scrollbar-thin">
                    {stageLeads.map((lead) => (
                      <LeadCardDB key={lead.id} lead={lead} onDragStart={() => setDraggedLead(lead.id)} onClick={() => setSelectedLead(lead)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-3 md:p-4">
          {isMobile ? (
            <div className="space-y-2">
              {filteredLeads.map((lead) => (
                <LeadCardDB key={lead.id} lead={lead} onDragStart={() => {}} onClick={() => setSelectedLead(lead)} />
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Telefone</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Origem</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Etapa</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tags</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Valor</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => {
                    const stage = stages.find((s) => s.id === lead.stage_id);
                    return (
                      <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{lead.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{lead.phone || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{lead.source || "—"}</td>
                        <td className="px-4 py-3">
                          {stage ? <span className="inline-flex items-center gap-1.5 text-xs"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />{stage.name}</span> : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {lead.tags.map((tag) => <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tagColors[tag.toLowerCase()] || "bg-muted text-muted-foreground"}`}>{tag}</span>)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-foreground font-medium">{lead.value_estimate ? `R$ ${lead.value_estimate.toLocaleString("pt-BR")}` : "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => toast({ title: "Em breve", description: "Atribuição de SDR será disponibilizada em breve." })} className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted" title="Atribuir SDR">
                              <UserCog className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            <button onClick={() => setMoveTarget(lead)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted" title="Mover etapa">
                              <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            <button onClick={() => setDeleteTarget(lead)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-destructive/10" title="Excluir">
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
          )}
        </div>
      )}

      {selectedLead && <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} onFieldUpdate={updateLeadField} />}

      <CreateLeadDialog
        open={showCreateLead}
        onOpenChange={setShowCreateLead}
        onSubmit={async (data) => {
          const result = await createLead(data);
          if (result) toast({ title: "Lead criado", description: `${data.name} foi adicionado.` });
        }}
        stages={stages}
        funnelId={activeFunnel?.id}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Excluir Lead"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        confirmLabel="Excluir"
        destructive
      />

      {/* Move stage dialog */}
      {moveTarget && (
        <div className="fixed inset-0 bg-foreground/20 z-50 flex items-center justify-center p-4" onClick={() => setMoveTarget(null)}>
          <div className="bg-card border border-border rounded-lg p-5 w-full max-w-xs space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-foreground">Mover "{moveTarget.name}"</h3>
            <div className="space-y-1.5">
              {stages.map((s) => (
                <button
                  key={s.id}
                  disabled={s.id === moveTarget.stage_id}
                  onClick={async () => {
                    await updateLeadStage(moveTarget.id, s.id);
                    toast({ title: "Lead movido", description: `${moveTarget.name} → ${s.name}` });
                    setMoveTarget(null);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${s.id === moveTarget.stage_id ? "bg-muted text-muted-foreground cursor-not-allowed" : "hover:bg-muted text-foreground"}`}
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                  {s.id === moveTarget.stage_id && <span className="text-[10px] text-muted-foreground ml-auto">atual</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LeadCardDB({ lead, onDragStart, onClick }: { lead: DBLead; onDragStart: () => void; onClick: () => void }) {
  return (
    <div draggable onDragStart={onDragStart} onClick={onClick} className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all group">
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium text-card-foreground leading-tight">{lead.name}</p>
        {lead.value_estimate && <span className="text-xs font-semibold text-primary">R$ {lead.value_estimate.toLocaleString("pt-BR")}</span>}
      </div>
      {lead.phone && <div className="flex items-center gap-2 mb-2"><Phone className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">{lead.phone}</span></div>}
      <div className="flex flex-wrap gap-1 mb-2">
        {lead.tags.map((tag) => <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tagColors[tag.toLowerCase()] || "bg-muted text-muted-foreground"}`}>{tag}</span>)}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{lead.source || "—"}</span>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><MessageCircle className="w-3 h-3" />{new Date(lead.updated_at).toLocaleDateString("pt-BR")}</div>
      </div>
    </div>
  );
}
