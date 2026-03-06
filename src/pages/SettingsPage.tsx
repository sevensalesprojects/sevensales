import { useState, useEffect } from "react";
import { useExpert } from "@/contexts/ExpertContext";
import { useProject } from "@/contexts/ProjectContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFunnels } from "@/hooks/useFunnels";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Building2, Globe, Clock, Users, Kanban, Tags as TagsIcon,
  Zap, Plus, Pencil, Trash2, GripVertical, ChevronRight, Save, X,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Loader2 } from "lucide-react";

type SettingsTab = "system" | "experts" | "funnels" | "tags" | "automation";

const tabItems = [
  { id: "system" as const, label: "Sistema", icon: Building2 },
  { id: "experts" as const, label: "Projetos / Experts", icon: Users },
  { id: "funnels" as const, label: "Funis", icon: Kanban },
  { id: "tags" as const, label: "Tags", icon: TagsIcon },
  { id: "automation" as const, label: "Automações", icon: Zap },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("system");
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      {isMobile ? (
        <div className="border-b border-border shrink-0 overflow-x-auto scrollbar-thin">
          <div className="flex px-2 py-2 gap-1">
            {tabItems.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}>
                <tab.icon className="w-3.5 h-3.5 shrink-0" />{tab.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-56 border-r border-border shrink-0 py-4">
          <p className="px-4 text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Configurações</p>
          <nav className="space-y-0.5 px-2">
            {tabItems.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${activeTab === tab.id ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
                <tab.icon className="w-4 h-4 shrink-0" />{tab.label}
              </button>
            ))}
          </nav>
        </div>
      )}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {activeTab === "system" && <SystemSettings />}
        {activeTab === "experts" && <ExpertsSettings />}
        {activeTab === "funnels" && <FunnelsSettings />}
        {activeTab === "tags" && <TagsSettings />}
        {activeTab === "automation" && <AutomationSettings />}
      </div>
    </div>
  );
}

/* ─── System Settings ─── */
function SystemSettings() {
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const items = [
    { key: "name", label: "Nome da Empresa", value: "Seven Sales", icon: Building2 },
    { key: "timezone", label: "Fuso Horário", value: "América/São Paulo (BRT -3)", icon: Clock },
    { key: "language", label: "Idioma", value: "Português (Brasil)", icon: Globe },
  ];

  const handleSave = () => {
    toast({ title: "Configuração salva", description: `"${editField}" atualizado.` });
    setEditField(null);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Configurações do Sistema</h2>
        <p className="text-sm text-muted-foreground">Configurações globais do CRM</p>
      </div>
      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        {items.map((item) => (
          <div key={item.key} className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                {editField === item.key ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-7 text-xs w-48" />
                    <button onClick={handleSave} className="text-primary hover:text-primary/80"><Save className="w-4 h-4" /></button>
                    <button onClick={() => setEditField(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{item.value}</p>
                )}
              </div>
            </div>
            {editField !== item.key && (
              <button onClick={() => { setEditField(item.key); setEditValue(item.value); }} className="h-7 px-2.5 rounded-md border border-input text-xs text-muted-foreground hover:bg-muted transition-colors">Editar</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Experts Settings ─── */
function ExpertsSettings() {
  const { experts } = useExpert();
  const { refetchProjects } = useProject();
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!newForm.name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("projects").insert({ name: newForm.name, description: newForm.description || null });
    if (!error) {
      toast({ title: "Projeto criado", description: newForm.name });
      await refetchProjects();
      setNewForm({ name: "", description: "" });
      setShowNew(false);
    } else {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Projetos / Experts</h2>
          <p className="text-sm text-muted-foreground">Gerencie os experts e seus projetos</p>
        </div>
        <button onClick={() => setShowNew(true)} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
          <Plus className="w-3.5 h-3.5" /> Novo Expert
        </button>
      </div>

      <div className="space-y-3">
        {experts.map((expert) => (
          <div key={expert.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: expert.color, color: "#fff" }}>{expert.initials}</div>
              <div>
                <p className="text-sm font-medium text-foreground">{expert.name}</p>
                <p className="text-xs text-muted-foreground">Projeto ativo</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Novo Expert / Projeto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Nome do Expert</Label><Input value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} placeholder="Ex: Expert João" /></div>
            <div className="space-y-2"><Label>Descrição</Label><Input value={newForm.description} onChange={(e) => setNewForm({ ...newForm, description: e.target.value })} placeholder="Opcional" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !newForm.name.trim()}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Funnels Settings ─── */
function FunnelsSettings() {
  const { funnels, refetch } = useFunnels();
  const { currentProject } = useProject();
  const [editStage, setEditStage] = useState<{ id: string; name: string; color: string } | null>(null);
  const [deleteStage, setDeleteStage] = useState<{ id: string; name: string } | null>(null);
  const [showAddStage, setShowAddStage] = useState<string | null>(null);
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState("#6366f1");
  const [saving, setSaving] = useState(false);
  const [showNewFunnel, setShowNewFunnel] = useState(false);
  const [newFunnelName, setNewFunnelName] = useState("");

  const handleAddStage = async (funnelId: string) => {
    if (!newStageName.trim()) return;
    setSaving(true);
    const funnel = funnels.find(f => f.id === funnelId);
    const maxPos = funnel ? Math.max(0, ...funnel.stages.map(s => s.position)) + 1 : 0;
    const { error } = await supabase.from("funnel_stages").insert({ funnel_id: funnelId, name: newStageName, color: newStageColor, position: maxPos });
    if (!error) {
      toast({ title: "Etapa adicionada" });
      await refetch();
      setNewStageName("");
      setShowAddStage(null);
    }
    setSaving(false);
  };

  const handleEditStage = async () => {
    if (!editStage) return;
    setSaving(true);
    const { error } = await supabase.from("funnel_stages").update({ name: editStage.name, color: editStage.color }).eq("id", editStage.id);
    if (!error) { toast({ title: "Etapa atualizada" }); await refetch(); }
    setSaving(false);
    setEditStage(null);
  };

  const handleDeleteStage = async () => {
    if (!deleteStage) return;
    const { error } = await supabase.from("funnel_stages").delete().eq("id", deleteStage.id);
    if (!error) { toast({ title: "Etapa excluída" }); await refetch(); }
    setDeleteStage(null);
  };

  const handleCreateFunnel = async () => {
    if (!newFunnelName.trim() || !currentProject) return;
    setSaving(true);
    const { error } = await supabase.from("funnels").insert({ name: newFunnelName, project_id: currentProject.id });
    if (!error) { toast({ title: "Funil criado" }); await refetch(); setNewFunnelName(""); setShowNewFunnel(false); }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Configuração de Funis</h2>
          <p className="text-sm text-muted-foreground">Personalize as etapas dos funis de vendas</p>
        </div>
        <button onClick={() => setShowNewFunnel(true)} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
          <Plus className="w-3.5 h-3.5" /> Novo Funil
        </button>
      </div>

      {funnels.map((funnel) => (
        <div key={funnel.id} className="bg-card border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">{funnel.name}</h3>
            <span className="text-xs text-muted-foreground">{funnel.stages.length} etapas</span>
          </div>
          <div className="divide-y divide-border">
            {funnel.stages.map((stage, i) => (
              <div key={stage.id} className="px-4 py-3 flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-sm text-foreground flex-1">{stage.name}</span>
                <span className="text-xs text-muted-foreground">Etapa {i + 1}</span>
                <button onClick={() => setEditStage({ id: stage.id, name: stage.name, color: stage.color })} className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button onClick={() => setDeleteStage({ id: stage.id, name: stage.name })} className="w-7 h-7 rounded flex items-center justify-center hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-border">
            {showAddStage === funnel.id ? (
              <div className="flex items-center gap-2">
                <Input value={newStageName} onChange={(e) => setNewStageName(e.target.value)} placeholder="Nome da etapa" className="h-8 text-xs flex-1" />
                <input type="color" value={newStageColor} onChange={(e) => setNewStageColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                <Button size="sm" onClick={() => handleAddStage(funnel.id)} disabled={saving}>{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Adicionar"}</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddStage(null)}>Cancelar</Button>
              </div>
            ) : (
              <button onClick={() => setShowAddStage(funnel.id)} className="h-8 px-3 rounded-md border border-dashed border-input text-xs text-muted-foreground hover:bg-muted flex items-center gap-1.5 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Adicionar Etapa
              </button>
            )}
          </div>
        </div>
      ))}

      {funnels.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum funil criado. Crie o primeiro acima.</p>}

      {/* Edit Stage Dialog */}
      <Dialog open={!!editStage} onOpenChange={(open) => { if (!open) setEditStage(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Editar Etapa</DialogTitle></DialogHeader>
          {editStage && (
            <div className="space-y-3">
              <div className="space-y-2"><Label>Nome</Label><Input value={editStage.name} onChange={(e) => setEditStage({ ...editStage, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Cor</Label><input type="color" value={editStage.color} onChange={(e) => setEditStage({ ...editStage, color: e.target.value })} className="w-full h-10 rounded cursor-pointer" /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStage(null)}>Cancelar</Button>
            <Button onClick={handleEditStage} disabled={saving}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Stage Confirm */}
      <ConfirmDialog open={!!deleteStage} onOpenChange={(open) => { if (!open) setDeleteStage(null); }}
        title="Excluir Etapa" description={`Excluir etapa "${deleteStage?.name}"? Leads nessa etapa ficarão sem etapa.`}
        onConfirm={handleDeleteStage} confirmLabel="Excluir" destructive />

      {/* New Funnel Dialog */}
      <Dialog open={showNewFunnel} onOpenChange={setShowNewFunnel}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Novo Funil</DialogTitle></DialogHeader>
          <div className="space-y-2"><Label>Nome do Funil</Label><Input value={newFunnelName} onChange={(e) => setNewFunnelName(e.target.value)} placeholder="Ex: Funil Lançamento" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFunnel(false)}>Cancelar</Button>
            <Button onClick={handleCreateFunnel} disabled={saving || !newFunnelName.trim()}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Tags Settings ─── */
function TagsSettings() {
  const { currentProject } = useProject();
  const [tags, setTags] = useState<{ id: string; name: string; category: string; color: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", category: "general" });
  const [editTag, setEditTag] = useState<{ id: string; name: string; category: string } | null>(null);
  const [deleteTag, setDeleteTag] = useState<{ id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchTags = async () => {
    if (!currentProject) return;
    setLoading(true);
    const { data } = await supabase.from("tags").select("*").eq("project_id", currentProject.id).order("category, name");
    if (data) setTags(data);
    setLoading(false);
  };

  useEffect(() => { fetchTags(); }, [currentProject?.id]);

  const categories = Array.from(new Set(tags.map(t => t.category)));

  const handleCreate = async () => {
    if (!newForm.name.trim() || !currentProject) return;
    setSaving(true);
    const { error } = await supabase.from("tags").insert({ name: newForm.name, category: newForm.category, project_id: currentProject.id });
    if (!error) { toast({ title: "Tag criada" }); await fetchTags(); setNewForm({ name: "", category: "general" }); setShowNew(false); }
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!editTag) return;
    setSaving(true);
    const { error } = await supabase.from("tags").update({ name: editTag.name, category: editTag.category }).eq("id", editTag.id);
    if (!error) { toast({ title: "Tag atualizada" }); await fetchTags(); }
    setSaving(false);
    setEditTag(null);
  };

  const handleDelete = async () => {
    if (!deleteTag) return;
    // Remove lead_tags first
    await supabase.from("lead_tags").delete().eq("tag_id", deleteTag.id);
    const { error } = await supabase.from("tags").delete().eq("id", deleteTag.id);
    if (!error) { toast({ title: "Tag excluída" }); await fetchTags(); }
    setDeleteTag(null);
  };

  const categoryLabels: Record<string, string> = { general: "Geral", origem: "Origem", temperatura: "Temperatura", status: "Status" };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Gestão de Tags</h2>
          <p className="text-sm text-muted-foreground">Crie e organize tags para segmentação de leads</p>
        </div>
        <button onClick={() => setShowNew(true)} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
          <Plus className="w-3.5 h-3.5" /> Nova Tag
        </button>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
        <>
          {categories.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tag criada. Crie a primeira acima.</p>}
          {categories.map((cat) => (
            <div key={cat} className="bg-card border border-border rounded-lg">
              <div className="px-4 py-3 border-b border-border"><h3 className="text-sm font-semibold text-foreground">{categoryLabels[cat] || cat}</h3></div>
              <div className="p-4 flex flex-wrap gap-2">
                {tags.filter(t => t.category === cat).map((tag) => (
                  <div key={tag.id} className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium bg-muted text-muted-foreground">
                    {tag.name}
                    <button onClick={() => setEditTag({ id: tag.id, name: tag.name, category: tag.category })} className="hover:opacity-70"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => setDeleteTag({ id: tag.id, name: tag.name })} className="hover:opacity-70"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* New Tag Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Nova Tag</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Nome</Label><Input value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} placeholder="Ex: Lead Quente" /></div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <select value={newForm.category} onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="general">Geral</option>
                <option value="origem">Origem</option>
                <option value="temperatura">Temperatura</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !newForm.name.trim()}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog open={!!editTag} onOpenChange={(open) => { if (!open) setEditTag(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Editar Tag</DialogTitle></DialogHeader>
          {editTag && (
            <div className="space-y-3">
              <div className="space-y-2"><Label>Nome</Label><Input value={editTag.name} onChange={(e) => setEditTag({ ...editTag, name: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <select value={editTag.category} onChange={(e) => setEditTag({ ...editTag, category: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="general">Geral</option>
                  <option value="origem">Origem</option>
                  <option value="temperatura">Temperatura</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTag(null)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={saving}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tag Confirm */}
      <ConfirmDialog open={!!deleteTag} onOpenChange={(open) => { if (!open) setDeleteTag(null); }}
        title="Excluir Tag" description={`Excluir tag "${deleteTag?.name}"? Ela será removida de todos os leads.`}
        onConfirm={handleDelete} confirmLabel="Excluir" destructive />
    </div>
  );
}

/* ─── Automation Settings ─── */
function AutomationSettings() {
  const { currentProject } = useProject();
  const [automations, setAutomations] = useState<{ id: string; name: string; trigger_type: string; action_type: string; is_active: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProject) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from("automations").select("id, name, trigger_type, action_type, is_active").eq("project_id", currentProject.id);
      if (data) setAutomations(data);
      setLoading(false);
    };
    fetch();
  }, [currentProject?.id]);

  const toggleAutomation = async (id: string, currentActive: boolean) => {
    const { error } = await supabase.from("automations").update({ is_active: !currentActive }).eq("id", id);
    if (!error) {
      setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_active: !currentActive } : a));
      toast({ title: !currentActive ? "Automação ativada" : "Automação desativada" });
    }
  };

  // Fallback to mock if empty
  const displayAutomations = automations.length > 0 ? automations : [
    { id: "mock1", name: "Mensagem de boas-vindas", trigger_type: "Lead criado", action_type: "Enviar WhatsApp", is_active: true },
    { id: "mock2", name: "Mover para Cliente", trigger_type: "Compra Hotmart", action_type: "Mover etapa", is_active: true },
    { id: "mock3", name: "Follow-up inatividade", trigger_type: "Inatividade 3 dias", action_type: "Criar tarefa", is_active: false },
    { id: "mock4", name: "Distribuição automática", trigger_type: "Lead criado", action_type: "Atribuir SDR", is_active: false },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Automações</h2>
        <p className="text-sm text-muted-foreground">Configure regras automáticas para o CRM</p>
      </div>
      <div className="space-y-3">
        {displayAutomations.map((auto) => (
          <div key={auto.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${auto.is_active ? "bg-primary/10" : "bg-muted"}`}>
                <Zap className={`w-5 h-5 ${auto.is_active ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{auto.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${auto.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {auto.is_active ? "Ativa" : "Inativa"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Gatilho: {auto.trigger_type}</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Ação: {auto.action_type}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => {
                if (auto.id.startsWith("mock")) {
                  toast({ title: "Automação de exemplo", description: "Crie automações reais no banco de dados." });
                } else {
                  toggleAutomation(auto.id, auto.is_active);
                }
              }}
                className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${auto.is_active ? "bg-primary" : "bg-muted"}`}>
                <div className={`w-4 h-4 rounded-full bg-card absolute top-0.5 transition-transform ${auto.is_active ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
