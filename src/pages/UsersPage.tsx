import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Search, Shield, ShieldCheck, UserCog, MoreHorizontal,
  Pencil, Trash2, Eye, EyeOff, Lock, Users as UsersIcon,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: "admin_master" | "admin" | "gestor" | "sdr";
  status: "active" | "inactive";
  experts: string[];
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  admin_master: "Admin Master",
  admin: "Admin",
  gestor: "Gestor",
  sdr: "SDR",
};

const roleColors: Record<string, string> = {
  admin_master: "bg-primary/15 text-primary",
  admin: "bg-chart-4/15 text-chart-4",
  gestor: "bg-warning/15 text-warning",
  sdr: "bg-info/15 text-info",
};

const mockUsers: User[] = [
  { id: "u1", name: "Admin Master", initials: "AM", email: "admin@vendaflow.com", role: "admin_master", status: "active", experts: ["Todos"], createdAt: "2026-01-01" },
  { id: "u2", name: "Carlos Mendes", initials: "CM", email: "carlos@vendaflow.com", role: "sdr", status: "active", experts: ["Expert Fábio"], createdAt: "2026-02-10" },
  { id: "u3", name: "Ana Rodrigues", initials: "AR", email: "ana@vendaflow.com", role: "sdr", status: "active", experts: ["Expert Fábio", "Expert Leonardo"], createdAt: "2026-02-12" },
  { id: "u4", name: "Roberto Lima", initials: "RL", email: "roberto@vendaflow.com", role: "gestor", status: "active", experts: ["Expert Leonardo", "Expert Josias"], createdAt: "2026-01-20" },
  { id: "u5", name: "Juliana Costa", initials: "JC", email: "juliana@vendaflow.com", role: "admin", status: "active", experts: ["Todos"], createdAt: "2026-01-15" },
  { id: "u6", name: "Marcos Silva", initials: "MS", email: "marcos@vendaflow.com", role: "sdr", status: "inactive", experts: ["Expert Fábio"], createdAt: "2026-03-01" },
];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string | null>(null);

  const filtered = mockUsers.filter((u) => {
    const matchSearch = !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base md:text-lg font-semibold text-foreground">Usuários</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Gestão de acesso · {mockUsers.length} usuários</p>
        </div>
        <button onClick={() => toast({ title: "Em breve", description: "Convite de novos usuários será disponibilizado em breve." })} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Novo Usuário</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Role summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {(["admin_master", "admin", "gestor", "sdr"] as const).map((role) => {
            const count = mockUsers.filter((u) => u.role === role).length;
            return (
              <button
                key={role}
                onClick={() => setFilterRole(filterRole === role ? null : role)}
                className={`bg-card border rounded-lg p-4 text-left transition-colors ${filterRole === role ? "border-primary" : "border-border hover:border-primary/30"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[role]}`}>{roleLabels[role]}</span>
                  <span className="text-lg font-bold text-foreground">{count}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {role === "admin_master" ? "Acesso total ao sistema" : role === "admin" ? "Gestão de leads e funis" : role === "gestor" ? "Métricas e gestão" : "Leads atribuídos"}
                </p>
              </button>
            );
          })}
        </div>

        {/* Users - Mobile cards / Desktop table */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">Todos os Usuários</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full md:w-56 rounded-md border border-input bg-muted/50 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-border">
            {filtered.map((user) => (
              <div key={user.id} className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">{user.initials}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[user.role]}`}>{roleLabels[user.role]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {user.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toast({ title: "Em breve" })} className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button onClick={() => toast({ title: "Em breve" })} className="w-7 h-7 rounded flex items-center justify-center hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <table className="hidden md:table w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Usuário</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Cargo</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Experts</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Criado em</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">{user.initials}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[user.role]}`}>{roleLabels[user.role]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.experts.map((exp) => (
                        <span key={exp} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{exp}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                      {user.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{user.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => toast({ title: "Em breve", description: "Edição de usuário será disponibilizada em breve." })} className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted" title="Editar">
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => toast({ title: "Em breve", description: "Gestão de permissões será disponibilizada em breve." })} className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted" title="Permissões">
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => toast({ title: "Em breve", description: "Exclusão de usuário será disponibilizada em breve.", variant: "destructive" })} className="w-7 h-7 rounded flex items-center justify-center hover:bg-destructive/10" title="Excluir">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Permissions Info */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Matriz de Permissões
          </h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Permissão</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Admin Master</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Admin</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Gestor</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">SDR</th>
              </tr>
            </thead>
            <tbody>
              {[
                { perm: "Acessar todos os experts", am: true, ad: false, ge: false, sdr: false },
                { perm: "Editar integrações", am: true, ad: true, ge: false, sdr: false },
                { perm: "Gerenciar usuários", am: true, ad: false, ge: false, sdr: false },
                { perm: "Ver métricas", am: true, ad: true, ge: true, sdr: false },
                { perm: "Gerenciar leads", am: true, ad: true, ge: true, sdr: false },
                { perm: "Enviar mensagens", am: true, ad: true, ge: true, sdr: true },
                { perm: "Registrar notas", am: true, ad: true, ge: true, sdr: true },
                { perm: "Acessar leads atribuídos", am: true, ad: true, ge: true, sdr: true },
              ].map((row) => (
                <tr key={row.perm} className="border-b border-border/50">
                  <td className="py-2 px-3 text-foreground">{row.perm}</td>
                  {[row.am, row.ad, row.ge, row.sdr].map((val, i) => (
                    <td key={i} className="py-2 px-3 text-center">
                      {val ? <span className="text-success">✓</span> : <span className="text-muted-foreground">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
