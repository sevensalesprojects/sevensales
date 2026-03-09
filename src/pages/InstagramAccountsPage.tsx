import { useState, useEffect } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Instagram, Plus, Trash2, Loader2, Eye, EyeOff, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface InstagramAccount {
  id: string;
  project_id: string;
  instagram_user_id: string;
  username: string | null;
  page_id: string | null;
  access_token: string;
  status: string;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function InstagramAccountsPage() {
  const { currentProject } = useProject();
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<InstagramAccount | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ username: "", instagram_user_id: "", page_id: "", access_token: "" });
  const [showToken, setShowToken] = useState(false);

  const fetchAccounts = async () => {
    if (!currentProject) return;
    setLoading(true);
    const { data } = await supabase
      .from("instagram_accounts")
      .select("*")
      .eq("project_id", currentProject.id)
      .order("created_at", { ascending: false });
    setAccounts((data as InstagramAccount[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, [currentProject?.id]);

  const openCreate = () => {
    setEditingAccount(null);
    setForm({ username: "", instagram_user_id: "", page_id: "", access_token: "" });
    setShowToken(false);
    setDialogOpen(true);
  };

  const openEdit = (acc: InstagramAccount) => {
    setEditingAccount(acc);
    setForm({
      username: acc.username || "",
      instagram_user_id: acc.instagram_user_id,
      page_id: acc.page_id || "",
      access_token: acc.access_token,
    });
    setShowToken(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!currentProject) return;
    if (!form.instagram_user_id.trim() || !form.access_token.trim()) {
      toast({ title: "Campos obrigatórios", description: "Instagram User ID e Access Token são obrigatórios.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editingAccount) {
        const { error } = await supabase
          .from("instagram_accounts")
          .update({
            username: form.username || null,
            instagram_user_id: form.instagram_user_id,
            page_id: form.page_id || null,
            access_token: form.access_token,
          })
          .eq("id", editingAccount.id);
        if (error) throw error;
        toast({ title: "Conta atualizada" });
      } else {
        const { error } = await supabase
          .from("instagram_accounts")
          .insert({
            project_id: currentProject.id,
            username: form.username || null,
            instagram_user_id: form.instagram_user_id,
            page_id: form.page_id || null,
            access_token: form.access_token,
          });
        if (error) throw error;
        toast({ title: "Conta adicionada" });
      }
      setDialogOpen(false);
      fetchAccounts();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("instagram_accounts").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conta removida" });
      fetchAccounts();
    }
    setDeleteId(null);
  };

  const maskToken = (t: string) => t.length > 12 ? t.slice(0, 6) + "••••••" + t.slice(-6) : "••••••";

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-base md:text-lg font-semibold text-foreground">Contas Instagram</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Gerencie as contas conectadas via Meta Graph API</p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="w-4 h-4" /> Adicionar
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {accounts.length === 0 ? (
          <div className="text-center py-16">
            <Instagram className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma conta Instagram configurada.</p>
            <Button size="sm" variant="outline" onClick={openCreate} className="mt-4 gap-1.5">
              <Plus className="w-4 h-4" /> Adicionar conta
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map(acc => (
              <div key={acc.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-chart-5/10 flex items-center justify-center shrink-0">
                  <Instagram className="w-5 h-5 text-chart-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-foreground truncate">
                      {acc.username ? `@${acc.username}` : acc.instagram_user_id}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${
                      acc.status === "active" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                    }`}>
                      {acc.status === "active" ? <><CheckCircle2 className="w-3 h-3" /> Ativo</> : <><XCircle className="w-3 h-3" /> Inativo</>}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    ID: {acc.instagram_user_id}
                    {acc.page_id && <> · Page: {acc.page_id}</>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Token: {maskToken(acc.access_token)}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(acc)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(acc.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Editar Conta" : "Adicionar Conta Instagram"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Username</Label>
              <Input placeholder="ex: minha_pagina" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div>
              <Label>Instagram User ID *</Label>
              <Input placeholder="ex: 17841400123456789" value={form.instagram_user_id} onChange={e => setForm(f => ({ ...f, instagram_user_id: e.target.value }))} />
              <p className="text-[10px] text-muted-foreground mt-1">ID numérico da conta profissional do Instagram</p>
            </div>
            <div>
              <Label>Page ID</Label>
              <Input placeholder="ex: 123456789012345" value={form.page_id} onChange={e => setForm(f => ({ ...f, page_id: e.target.value }))} />
              <p className="text-[10px] text-muted-foreground mt-1">ID da Facebook Page vinculada (opcional)</p>
            </div>
            <div>
              <Label>Access Token *</Label>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  placeholder="Token de acesso do Meta Graph API"
                  value={form.access_token}
                  onChange={e => setForm(f => ({ ...f, access_token: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {editingAccount ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={open => !open && setDeleteId(null)}
        title="Remover conta Instagram"
        description="Tem certeza que deseja remover esta conta? As mensagens já recebidas serão mantidas."
        onConfirm={handleDelete}
        confirmLabel="Remover"
        variant="destructive"
      />
    </div>
  );
}
