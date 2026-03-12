import { useState, useEffect, useMemo } from "react";
import { useFunnels } from "@/hooks/useFunnels";
import { useLeads, DBLead } from "@/hooks/useLeads";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { LeadDetailPanel } from "@/components/LeadDetailPanel";
import { CreateLeadDialog } from "@/components/CreateLeadDialog";
import { EditLeadDialog } from "@/components/EditLeadDialog";
import { TransferLeadDialog } from "@/components/TransferLeadDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ImportLeadsDialog } from "@/components/ImportLeadsDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { supabase } from "@/integrations/supabase/client";
import { logSystemEvent, saveDeletedRecord } from "@/hooks/useSystemLog";
import { formatCurrency } from "@/lib/currency";
import {
  Plus, Search, Download, Upload, Trash2, UserCog, ArrowRightLeft,
  Loader2, Phone, MessageCircle, Pencil, Tag, CheckSquare, Square, MinusSquare,
  LayoutGrid, List, SlidersHorizontal, CalendarPlus, Move, ChevronDown,
} from "lucide-react";
import { LeadTableSkeleton } from "@/components/skeletons/LeadTableSkeleton";
import { KanbanSkeleton } from "@/components/skeletons/KanbanSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  const { user } = useAuth();
  const { funnels, loading: funnelsLoading } = useFunnels();
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>("");

  // Fix #9: Only resolve activeFunnel after funnels are loaded
  const activeFunnel = useMemo(() => {
    if (funnels.length === 0) return undefined;
    return funnels.find((f) => f.id === selectedFunnelId) || funnels[0];
  }, [funnels, selectedFunnelId]);

  // Fix #9: Only pass funnelId when we have a confirmed funnel
  const { leads, loading: leadsLoading, error: leadsError, totalCount, hasMore, loadMore, refetch, updateLeadStage, updateLeadField, createLead, deleteLead } = useLeads(activeFunnel?.id);
  const [selectedLead, setSelectedLead] = useState<DBLead | null>(null);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DBLead | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState<DBLead | null>(null);
  const [editTarget, setEditTarget] = useState<DBLead | null>(null);
  const [transferTarget, setTransferTarget] = useState<DBLead | null>(null);
  const [sdrs, setSdrs] = useState<{ user_id: string; full_name: string }[]>([]);
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [contextMenu, setContextMenu] = useState<{ lead: DBLead; x: number; y: number } | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTransferOpen, setBulkTransferOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkTagOpen, setBulkTagOpen] = useState(false);
  const [allTags, setAllTags] = useState<{ id: string; name: string }[]>([]);
  const [showImport, setShowImport] = useState(false);

  const loading = funnelsLoading || leadsLoading;
  const stages = activeFunnel?.stages || [];

  // Fetch SDRs
  useEffect(() => {
    const fetchSdrs = async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("role", ["sdr"]);
      if (!roles || roles.length === 0) return;
      const sdrIds = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", sdrIds);
      if (profiles) setSdrs(profiles);
    };
    fetchSdrs();
  }, []);

  // Fetch tags for bulk actions
  useEffect(() => {
    if (!currentProject) return;
    const fetchTags = async () => {
      const { data } = await supabase.from("tags").select("id, name").eq("project_id", currentProject.id);
      if (data) setAllTags(data);
    };
    fetchTags();
  }, [currentProject?.id]);

  const filteredLeads = leads.filter((l) => {
    const matchesSearch = !searchQuery || l.name.toLowerCase().includes(searchQuery.toLowerCase()) || (l.phone || "").includes(searchQuery);
    const matchesTag = !selectedTag || l.tags.map(t => t.toLowerCase()).includes(selectedTag.toLowerCase());
    return matchesSearch && matchesTag;
  });

  const tagsList = Array.from(new Set(leads.flatMap((l) => l.tags)));

  // Bulk selection helpers
  const allSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedIds.has(l.id));
  const someSelected = filteredLeads.some(l => selectedIds.has(l.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDrop = async (stageId: string) => {
    if (!draggedLead) return;
    await updateLeadStage(draggedLead, stageId);
    setDraggedLead(null);
  };

  const handleDeleteRequest = async (lead: DBLead) => {
    const [
      { count: msgCount },
      { count: salesCount },
      { count: callsCount },
    ] = await Promise.all([
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("lead_id", lead.id),
      supabase.from("sales").select("id", { count: "exact", head: true }).eq("lead_id", lead.id),
      supabase.from("calls").select("id", { count: "exact", head: true }).eq("lead_id", lead.id),
    ]);

    const deps: string[] = [];
    if ((msgCount || 0) > 0) deps.push(`${msgCount} mensagem(ns)`);
    if ((salesCount || 0) > 0) deps.push(`${salesCount} venda(s)`);
    if ((callsCount || 0) > 0) deps.push(`${callsCount} call(s)`);

    if (deps.length > 0) {
      setDeleteWarning(`Este lead possui ${deps.join(", ")}. Todos os registros associados serão perdidos.`);
    } else {
      setDeleteWarning(null);
    }
    setDeleteTarget(lead);
  };

  const handleDelete = async () => {
    if (!deleteTarget || !user) return;
    // Save snapshot before deleting
    await saveDeletedRecord({ entityType: "lead", entityId: deleteTarget.id, dataSnapshot: deleteTarget, deletedBy: user.id });
    const success = await deleteLead(deleteTarget.id);
    if (success) {
      await logSystemEvent({ userId: user.id, projectId: currentProject?.id, action: "lead_deleted", entityType: "lead", entityId: deleteTarget.id, metadata: { name: deleteTarget.name } });
      toast({ title: "Lead excluído", description: `${deleteTarget.name} foi removido.` });
    }
    setDeleteTarget(null);
    setDeleteWarning(null);
  };

  const handleTransfer = async (newSdrId: string) => {
    if (!transferTarget || !user) return;
    // Validate target SDR is active
    const { data: targetProfile } = await supabase.from("profiles").select("status").eq("user_id", newSdrId).single();
    if (targetProfile?.status !== "active") {
      toast({ title: "Erro", description: "O SDR de destino não está ativo.", variant: "destructive" });
      return;
    }
    const oldSdrName = sdrs.find(s => s.user_id === transferTarget.sdr_id)?.full_name || "Nenhum";
    const newSdrName = sdrs.find(s => s.user_id === newSdrId)?.full_name || "Desconhecido";
    const ok = await updateLeadField(transferTarget.id, "sdr_id", newSdrId);
    if (ok) {
      await logSystemEvent({ userId: user.id, projectId: currentProject?.id, action: "lead_transferred", entityType: "lead", entityId: transferTarget.id, metadata: { from: oldSdrName, to: newSdrName } });
      toast({ title: "Lead transferido", description: `${transferTarget.name}: ${oldSdrName} → ${newSdrName}` });
    }
  };

  const handleEditSave = async (leadId: string, updates: Record<string, any>) => {
    for (const [field, value] of Object.entries(updates)) {
      await updateLeadField(leadId, field, value);
    }
    toast({ title: "Lead atualizado" });
    return true;
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (!user) return;
    let count = 0;
    for (const id of selectedIds) {
      const lead = leads.find(l => l.id === id);
      if (lead) {
        await saveDeletedRecord({ entityType: "lead", entityId: id, dataSnapshot: lead, deletedBy: user.id });
      }
      const ok = await deleteLead(id);
      if (ok) count++;
    }
    toast({ title: "Leads excluídos", description: `${count} lead(s) removido(s).` });
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
  };

  const handleBulkTransfer = async (newSdrId: string) => {
    let count = 0;
    for (const id of selectedIds) {
      const ok = await updateLeadField(id, "sdr_id", newSdrId);
      if (ok) count++;
    }
    const sdrName = sdrs.find(s => s.user_id === newSdrId)?.full_name || "SDR";
    toast({ title: "Leads transferidos", description: `${count} lead(s) transferido(s) para ${sdrName}.` });
    setSelectedIds(new Set());
    setBulkTransferOpen(false);
  };

  const handleBulkAddTag = async (tagId: string) => {
    let count = 0;
    for (const id of selectedIds) {
      const { error } = await supabase.from("lead_tags").insert({ lead_id: id, tag_id: tagId });
      if (!error) count++;
    }
    const tagName = allTags.find(t => t.id === tagId)?.name || "Tag";
    toast({ title: "Tags adicionadas", description: `Tag "${tagName}" adicionada a ${count} lead(s).` });
    setSelectedIds(new Set());
    setBulkTagOpen(false);
    refetch();
  };

  const handleExport = () => {
    const leadsToExport = selectedIds.size > 0 ? filteredLeads.filter(l => selectedIds.has(l.id)) : filteredLeads;
    const csv = [
      ["Nome", "Telefone", "Email", "Instagram", "País", "Origem", "Canal", "Valor", "Tags"].join(","),
      ...leadsToExport.map(l => [
        `"${l.name}"`, l.phone || "", l.email || "", l.instagram || "", l.country || "",
        l.source || "", l.channel || "", l.value_estimate || "", `"${l.tags.join(";")}"`,
      ].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${currentProject?.name || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exportado", description: `${leadsToExport.length} leads exportados em CSV.` });
  };

  const currencyCode = (currentProject as any)?.currency_code || "BRL";

  if (loading) {
    return viewMode === "kanban" ? <KanbanSkeleton /> : <LeadTableSkeleton />;
  }

  if (leadsError) {
    return <ErrorState title="Erro ao carregar leads" description={leadsError} onRetry={refetch} />;
  }

  // Keyboard shortcuts (#12)
  useKeyboardShortcuts({
    n: () => setShowCreateLead(true),
    f: () => {
      const input = document.querySelector<HTMLInputElement>('input[placeholder*="Buscar"]');
      input?.focus();
    },
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex items-center justify-between shrink-0 gap-2">
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-semibold text-foreground">Leads</h1>
          <p className="text-xs md:text-sm text-muted-foreground truncate">
            {activeFunnel ? `${activeFunnel.name} · ` : ""}Mostrando {filteredLeads.length} de {totalCount} leads
          </p>
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
              <div className="flex items-center gap-0.5 border border-border rounded-md overflow-hidden">
                <button onClick={() => setViewMode("list")} className={`h-8 px-2.5 flex items-center gap-1 text-xs font-medium transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                  <List className="w-3.5 h-3.5" /> Lista
                </button>
                <button onClick={() => setViewMode("kanban")} className={`h-8 px-2.5 flex items-center gap-1 text-xs font-medium transition-colors ${viewMode === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                  <LayoutGrid className="w-3.5 h-3.5" /> Kanban
                </button>
              </div>
              <button onClick={() => setShowImport(true)} className="h-8 px-3 rounded-md border border-input text-sm text-muted-foreground hover:bg-muted flex items-center gap-1.5 transition-colors">
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
          {tagsList.map((tag) => (
            <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`h-7 px-2.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${selectedTag === tag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{tag}</button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="px-4 md:px-6 py-2 border-b border-border bg-primary/5 flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-primary">{selectedIds.size} selecionado(s)</span>
          <div className="flex-1" />
          <button onClick={handleExport} className="h-7 px-2.5 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted flex items-center gap-1">
            <Download className="w-3 h-3" /> Exportar
          </button>
          {sdrs.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="h-7 px-2.5 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted flex items-center gap-1">
                <ArrowRightLeft className="w-3 h-3" /> Transferir
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {sdrs.map(s => (
                  <DropdownMenuItem key={s.user_id} onClick={() => handleBulkTransfer(s.user_id)}>
                    {s.full_name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {allTags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="h-7 px-2.5 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tag
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {allTags.map(t => (
                  <DropdownMenuItem key={t.id} onClick={() => handleBulkAddTag(t.id)}>
                    {t.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <button onClick={() => setBulkDeleteOpen(true)} className="h-7 px-2.5 rounded-md bg-destructive/10 text-destructive text-xs hover:bg-destructive/20 flex items-center gap-1">
            <Trash2 className="w-3 h-3" /> Apagar
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="h-7 px-2.5 rounded-md text-xs text-muted-foreground hover:bg-muted">
            Limpar
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 md:p-4">
        {isMobile ? (
          <div className="space-y-2">
            {filteredLeads.map((lead) => (
              <LeadCardDB key={lead.id} lead={lead} onDragStart={() => {}} onClick={() => setSelectedLead(lead)} currencyCode={currencyCode} />
            ))}
          </div>
        ) : viewMode === "kanban" && stages.length > 0 ? (
          /* Kanban View (#8) */
          <div className="flex gap-3 h-full min-w-max">
            {stages.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => l.stage_id === stage.id);
              return (
                <div
                  key={stage.id}
                  className="w-64 md:w-72 flex flex-col rounded-lg bg-muted/40 border border-border/50"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(stage.id)}
                >
                  <div className="px-3 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-sm font-medium text-foreground">{stage.name}</span>
                      <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">{stageLeads.length}</span>
                    </div>
                  </div>
                  <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto scrollbar-thin">
                    {stageLeads.map((lead) => (
                      <LeadCardDB
                        key={lead.id}
                        lead={lead}
                        onDragStart={() => setDraggedLead(lead.id)}
                        onClick={() => setSelectedLead(lead)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({ lead, x: e.clientX, y: e.clientY });
                        }}
                        currencyCode={currencyCode}
                      />
                    ))}
                    {stageLeads.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-4">Nenhum lead</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-3 w-10">
                      <button onClick={toggleSelectAll} className="flex items-center justify-center">
                        {allSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : someSelected ? <MinusSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Telefone</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Instagram</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">País</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Origem</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Canal</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Etapa</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Tags</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Valor</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Qualificação</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Mês Ref.</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Grupo</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Nº Grupo</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Agendamento</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Resumo Agend.</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Consultoria</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Tempo Resp.</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Status Venda</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Avaliação SDR</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Obs. SDR</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Observações</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Gravação</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Google Cal.</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Criado em</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Atualizado</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground sticky right-0 bg-muted/50">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => {
                    const stage = stages.find((s) => s.id === lead.stage_id);
                    const isSelected = selectedIds.has(lead.id);
                    return (
                      <tr key={lead.id} onClick={() => setSelectedLead(lead)} className={`border-b border-border hover:bg-muted/30 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                        <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => toggleSelect(lead.id)} className="flex items-center justify-center">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-foreground">{lead.name}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{lead.phone || "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{lead.email || "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{lead.instagram || "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{lead.country || "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{lead.source || "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{lead.channel || "—"}</td>
                        <td className="px-3 py-2.5">
                          {stage ? <span className="inline-flex items-center gap-1.5 text-xs"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />{stage.name}</span> : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {lead.tags.map((tag) => <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tagColors[tag.toLowerCase()] || "bg-muted text-muted-foreground"}`}>{tag}</span>)}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-foreground font-medium">{lead.value_estimate ? formatCurrency(lead.value_estimate, currencyCode) : "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{lead.qualification_score || "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{lead.reference_month || "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{lead.group_link ? <a href={lead.group_link} target="_blank" rel="noreferrer" className="text-primary underline text-xs" onClick={e => e.stopPropagation()}>Link</a> : "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{lead.group_number || "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{lead.scheduling_date ? new Date(lead.scheduling_date).toLocaleDateString("pt-BR") : "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground max-w-[150px] truncate">{lead.scheduling_summary || "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{lead.consultation_done ? "✅ Sim" : "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{lead.response_time_minutes != null ? `${lead.response_time_minutes} min` : "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{lead.sale_status || "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{lead.sdr_evaluation || "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground max-w-[150px] truncate">{lead.sdr_observations || "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground max-w-[150px] truncate">{lead.observations || "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{lead.call_recording_link ? <a href={lead.call_recording_link} target="_blank" rel="noreferrer" className="text-primary underline text-xs" onClick={e => e.stopPropagation()}>Link</a> : "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{lead.google_calendar_event_id || "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{new Date(lead.updated_at).toLocaleDateString("pt-BR")}</td>
                        <td className="px-3 py-2.5 sticky right-0 bg-card">
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setEditTarget(lead)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted" title="Editar Lead">
                              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            <button onClick={() => setTransferTarget(lead)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted" title="Transferir SDR">
                              <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            <button onClick={() => handleDeleteRequest(lead)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-destructive/10" title="Excluir">
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
      </div>

      {/* Context Menu (#16) */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button onClick={() => { setEditTarget(contextMenu.lead); setContextMenu(null); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors">
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
            <button onClick={() => { setTransferTarget(contextMenu.lead); setContextMenu(null); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors">
              <ArrowRightLeft className="w-3.5 h-3.5" /> Transferir SDR
            </button>
            <button onClick={() => { setMoveTarget(contextMenu.lead); setContextMenu(null); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors">
              <Move className="w-3.5 h-3.5" /> Mover para Etapa
            </button>
            <div className="h-px bg-border my-1" />
            <button onClick={() => { handleDeleteRequest(contextMenu.lead); setContextMenu(null); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Excluir
            </button>
          </div>
        </>
      )}

      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onFieldUpdate={updateLeadField}
          onLeadChanged={() => {
            const updated = leads.find(l => l.id === selectedLead.id);
            if (updated) setSelectedLead(updated);
          }}
        />
      )}

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

      {editTarget && (
        <EditLeadDialog
          open={!!editTarget}
          onOpenChange={(open) => { if (!open) setEditTarget(null); }}
          lead={editTarget}
          sdrs={sdrs}
          onSave={handleEditSave}
        />
      )}

      {transferTarget && (
        <TransferLeadDialog
          open={!!transferTarget}
          onOpenChange={(open) => { if (!open) setTransferTarget(null); }}
          leadName={transferTarget.name}
          currentSdrId={transferTarget.sdr_id}
          sdrs={sdrs}
          onConfirm={handleTransfer}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteWarning(null); } }}
        title="Excluir Lead"
        description={
          deleteWarning
            ? `Tem certeza que deseja excluir "${deleteTarget?.name}"?\n\n⚠️ ${deleteWarning}`
            : `Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`
        }
        onConfirm={handleDelete}
        confirmLabel="Excluir"
        destructive
      />

      <ImportLeadsDialog
        open={showImport}
        onOpenChange={setShowImport}
        onComplete={refetch}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Excluir Leads em Massa"
        description={`Tem certeza que deseja excluir ${selectedIds.size} lead(s)? Esta ação não pode ser desfeita. Os dados serão salvos para possível restauração em até 30 dias.`}
        onConfirm={handleBulkDelete}
        confirmLabel="Excluir Todos"
        destructive
      />

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

function LeadCardDB({ lead, onDragStart, onClick, onContextMenu, currencyCode }: { lead: DBLead; onDragStart: () => void; onClick: () => void; onContextMenu?: (e: React.MouseEvent) => void; currencyCode: string }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium text-card-foreground leading-tight">{lead.name}</p>
        {lead.value_estimate && <span className="text-xs font-semibold text-primary">{formatCurrency(lead.value_estimate, currencyCode)}</span>}
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
