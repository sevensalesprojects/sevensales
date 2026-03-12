import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Search, ShieldCheck, Pencil, Trash2, Lock, Power,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Loader2 } from "lucide-react";

type AppRole = "admin_master" | "admin" | "gestor" | "sdr" | "closer";

interface DBUser {
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
  roles: AppRole[];
}

const roleLabels: Record<string, string> = {
  admin_master: "Admin Master",
  admin: "Admin",
  gestor: "Gestor",
  sdr: "SDR",
  closer: "Closer",
};

const roleColors: Record<string, string> = {
  admin_master: "bg-primary/15 text-primary",
  admin: "bg-chart-4/15 text-chart-4",
  gestor: "bg-warning/15 text-warning",
  sdr: "bg-info/15 text-info",
  closer: "bg-chart-2/15 text-chart-2",
};

const allRoles: AppRole[] = ["admin_master", "admin", "gestor", "sdr", "closer"];

export default function UsersPage() {
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<DBUser | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", phone: "" });
  const [editRoles, setEditRoles] = useState<AppRole[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteUser, setDeleteUser] = useState<DBUser | null>(null);
  const [showRolesDialog, setShowRolesDialog] = useState<DBUser | null>(null);
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ full_name: "", email: "", phone: "", role: "sdr" as AppRole });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");
    if (profiles) {
      const mapped: DBUser[] = profiles.map((p) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        phone: p.phone,
        avatar_url: p.avatar_url,
        status: p.status,
        created_at: p.created_at,
        roles: (roles || []).filter((r) => r.user_id === p.user_id).map((r) => r.role as AppRole),
      }));
      setUsers(mapped);
    }
    setLoading(false);
  };

  const getInitials = (name: string) => name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const filtered = users.filter((u) => {
    const matchSearch = !searchQuery || u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = !filterRole || u.roles.includes(filterRole as AppRole);
    return matchSearch && matchRole;
  });

  const roleCounts = allRoles.reduce((acc, role) => {
    acc[role] = users.filter((u) => u.roles.includes(role)).length;
    return acc;
  }, {} as Record<string, number>);

  // Edit user
  const openEdit = (user: DBUser) => {
    setEditUser(user);
    setEditForm({ full_name: user.full_name, email: user.email || "", phone: user.phone || "" });
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: editForm.full_name,
      email: editForm.email || null,
      phone: editForm.phone || null,
    }).eq("user_id", editUser.user_id);
    if (!error) {
      toast({ title: "Usuário atualizado" });
      await fetchUsers();
    } else {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
    setSaving(false);
    setEditUser(null);
  };

  // Toggle status
  const toggleStatus = async (user: DBUser) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("user_id", user.user_id);
    if (!error) {
      toast({ title: newStatus === "active" ? "Usuário ativado" : "Usuário desativado" });
      setUsers(prev => prev.map(u => u.user_id === user.user_id ? { ...u, status: newStatus } : u));
    }
  };

  // Delete user (soft - just mark inactive and remove roles)
  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    await supabase.from("profiles").update({ status: "inactive" }).eq("user_id", deleteUser.user_id);
    toast({ title: "Usuário removido", description: `${deleteUser.full_name} foi desativado. Histórico mantido.` });
    await fetchUsers();
    setDeleteUser(null);
  };

  // Roles management
  const openRoles = (user: DBUser) => {
    setShowRolesDialog(user);
    setEditRoles([...user.roles]);
  };

  const handleSaveRoles = async () => {
    if (!showRolesDialog) return;
    setSaving(true);
    const userId = showRolesDialog.user_id;
    const current = showRolesDialog.roles;

    // Remove roles that were unchecked
    for (const role of current) {
      if (!editRoles.includes(role)) {
        await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      }
    }
    // Add new roles
    for (const role of editRoles) {
      if (!current.includes(role)) {
        await supabase.from("user_roles").insert({ user_id: userId, role });
      }
    }

    toast({ title: "Permissões atualizadas" });
    await fetchUsers();
    setSaving(false);
    setShowRolesDialog(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base md:text-lg font-semibold text-foreground">Usuários</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Gestão de acesso · {users.length} usuários</p>
        </div>
        <button onClick={() => toast({ title: "Em breve", description: "Convite de novos usuários será disponibilizado em breve." })}
          className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
          <Plus className="w-3.5 h-3.5" /><span className="hidden md:inline">Novo Usuário</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Role summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {allRoles.map((role) => (
            <button key={role} onClick={() => setFilterRole(filterRole === role ? null : role)}
              className={`bg-card border rounded-lg p-4 text-left transition-colors ${filterRole === role ? "border-primary" : "border-border hover:border-primary/30"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[role]}`}>{roleLabels[role]}</span>
                <span className="text-lg font-bold text-foreground">{roleCounts[role] || 0}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {role === "admin_master" ? "Acesso total ao sistema" : role === "admin" ? "Gestão de leads e funis" : role === "gestor" ? "Métricas e gestão" : role === "closer" ? "Fechamento de vendas" : "Leads atribuídos"}
              </p>
            </button>
          ))}
        </div>

        {/* Users table */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">Todos os Usuários</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full md:w-56 rounded-md border border-input bg-muted/50 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-border">
                {filtered.map((user) => (
                  <div key={user.user_id} className="px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">{getInitials(user.full_name)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.full_name}</p>
                          <p className="text-[10px] text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((r) => <span key={r} className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[r]}`}>{roleLabels[r]}</span>)}
                        {user.roles.length === 0 && <span className="text-xs text-muted-foreground">Sem cargo</span>}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                        {user.status === "active" ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <table className="hidden md:table w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Usuário</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Cargos</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Criado em</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.user_id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">{getInitials(user.full_name)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.full_name}</p>
                            <p className="text-[10px] text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((r) => <span key={r} className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[r]}`}>{roleLabels[r]}</span>)}
                          {user.roles.length === 0 && <span className="text-xs text-muted-foreground">Sem cargo</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                          {user.status === "active" ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(user.created_at).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(user)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted" title="Editar">
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => openRoles(user)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted" title="Permissões">
                            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => toggleStatus(user)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted" title={user.status === "active" ? "Desativar" : "Ativar"}>
                            <Power className={`w-3.5 h-3.5 ${user.status === "active" ? "text-warning" : "text-success"}`} />
                          </button>
                          <button onClick={() => setDeleteUser(user)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-destructive/10" title="Excluir">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Permissions matrix */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" /> Matriz de Permissões
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Permissão</th>
                  {allRoles.map(r => <th key={r} className="text-center py-2 px-3 font-medium text-muted-foreground">{roleLabels[r]}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { perm: "Acessar todos os experts", am: true, ad: false, ge: false, sdr: false, cl: false },
                  { perm: "Editar integrações", am: true, ad: true, ge: false, sdr: false, cl: false },
                  { perm: "Gerenciar usuários", am: true, ad: false, ge: false, sdr: false, cl: false },
                  { perm: "Ver métricas", am: true, ad: true, ge: true, sdr: false, cl: false },
                  { perm: "Gerenciar leads", am: true, ad: true, ge: true, sdr: false, cl: false },
                  { perm: "Enviar mensagens", am: true, ad: true, ge: true, sdr: true, cl: true },
                  { perm: "Registrar notas", am: true, ad: true, ge: true, sdr: true, cl: true },
                  { perm: "Acessar leads atribuídos", am: true, ad: true, ge: true, sdr: true, cl: true },
                  { perm: "Fechar vendas", am: true, ad: true, ge: false, sdr: false, cl: true },
                ].map((row) => (
                  <tr key={row.perm} className="border-b border-border/50">
                    <td className="py-2 px-3 text-foreground">{row.perm}</td>
                    {[row.am, row.ad, row.ge, row.sdr, row.cl].map((val, i) => (
                      <td key={i} className="py-2 px-3 text-center">{val ? <span className="text-success">✓</span> : <span className="text-muted-foreground">—</span>}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Nome</Label><Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Roles Dialog */}
      <Dialog open={!!showRolesDialog} onOpenChange={(open) => { if (!open) setShowRolesDialog(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Permissões — {showRolesDialog?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {allRoles.map((role) => (
              <div key={role} className="flex items-center gap-3">
                <Checkbox
                  id={`role-${role}`}
                  checked={editRoles.includes(role)}
                  onCheckedChange={(checked) => {
                    setEditRoles(prev => checked ? [...prev, role] : prev.filter(r => r !== role));
                  }}
                />
                <label htmlFor={`role-${role}`} className="text-sm text-foreground cursor-pointer">{roleLabels[role]}</label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRolesDialog(null)}>Cancelar</Button>
            <Button onClick={handleSaveRoles} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteUser}
        onOpenChange={(open) => { if (!open) setDeleteUser(null); }}
        title="Excluir Usuário"
        description={`Deseja remover "${deleteUser?.full_name}"? O usuário será desativado e o histórico mantido.`}
        onConfirm={handleDeleteUser}
        confirmLabel="Excluir"
        destructive
      />
    </div>
  );
}
