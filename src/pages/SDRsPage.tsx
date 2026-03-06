import { useState, useEffect, useMemo } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import {
  Plus, Search, Phone, Users, Calendar, Trophy,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SDRProfile {
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
}

export default function SDRsPage() {
  const { currentProject } = useProject();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewSDR, setShowNewSDR] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", email: "", phone: "" });

  const currencyCode = currentProject?.currency_code || "BRL";

  // Fetch SDR user IDs
  const { data: sdrRoles = [] } = useQuery({
    queryKey: ["sdr-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id").eq("role", "sdr");
      return data || [];
    },
  });

  // Fetch profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ["sdr-profiles", sdrRoles.map(r => r.user_id)],
    queryFn: async () => {
      if (sdrRoles.length === 0) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name, email, phone, status").in("user_id", sdrRoles.map(r => r.user_id));
      return (data || []) as SDRProfile[];
    },
    enabled: sdrRoles.length > 0,
  });

  // Fetch leads for metrics
  const { data: leads = [] } = useQuery({
    queryKey: ["sdr-leads", currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return [];
      const { data } = await supabase.from("leads")
        .select("id, sdr_id, scheduling_date, consultation_done, sale_status, value_estimate")
        .eq("project_id", currentProject.id);
      return data || [];
    },
    enabled: !!currentProject,
  });

  const sdrs = useMemo(() => {
    return profiles.map(p => {
      const sdrLeads = leads.filter(l => l.sdr_id === p.user_id);
      const agendamentos = sdrLeads.filter(l => l.scheduling_date).length;
      const reunioes = sdrLeads.filter(l => l.consultation_done).length;
      const vendas = sdrLeads.filter(l => l.sale_status === "sold").length;
      const receita = sdrLeads.filter(l => l.sale_status === "sold").reduce((s, l) => s + (Number(l.value_estimate) || 0), 0);
      const initials = p.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      return {
        ...p,
        initials,
        leadsAtribuidos: sdrLeads.length,
        agendamentos,
        reunioes,
        vendas,
        receita,
        taxaConversao: sdrLeads.length > 0 ? (vendas / sdrLeads.length) * 100 : 0,
      };
    });
  }, [profiles, leads]);

  const filtered = sdrs.filter(s => !searchQuery || s.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
  const ranking = [...sdrs].filter(s => s.status === "active").sort((a, b) => b.vendas - a.vendas);

  const handleCreateSDR = async () => {
    if (!newForm.name.trim() || !newForm.email.trim()) return;
    setSaving(true);
    toast({ title: "SDR cadastrado", description: `${newForm.name} foi adicionado. Um convite será enviado para ${newForm.email}.` });
    setSaving(false);
    setNewForm({ name: "", email: "", phone: "" });
    setShowNewSDR(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base md:text-lg font-semibold text-foreground">SDRs</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Gestão da equipe · {sdrs.filter(s => s.status === "active").length} ativos</p>
        </div>
        <button onClick={() => setShowNewSDR(true)} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
          <Plus className="w-3.5 h-3.5" /><span className="hidden md:inline">Novo SDR</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: "Total SDRs", value: sdrs.length.toString(), icon: Users, color: "text-primary" },
            { label: "Leads Atribuídos", value: leads.filter(l => l.sdr_id).length.toString(), icon: Phone, color: "text-info" },
            { label: "Agendamentos", value: leads.filter(l => l.scheduling_date).length.toString(), icon: Calendar, color: "text-warning" },
            { label: "Vendas", value: leads.filter(l => l.sale_status === "sold").length.toString(), icon: Trophy, color: "text-success" },
          ].map(kpi => (
            <div key={kpi.label} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${kpi.color}`}><kpi.icon className="w-5 h-5" /></div>
              <div><p className="text-2xl font-bold text-foreground">{kpi.value}</p><p className="text-xs text-muted-foreground">{kpi.label}</p></div>
            </div>
          ))}
        </div>

        {/* Ranking */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border"><h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Trophy className="w-4 h-4 text-warning" />Ranking de SDRs</h3></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">#</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">SDR</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Leads</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Agendamentos</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Reuniões</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Vendas</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Conversão</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Receita</th>
            </tr></thead>
            <tbody>
              {ranking.map((sdr, i) => (
                <tr key={sdr.user_id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3"><span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-warning/20 text-warning" : "bg-muted text-muted-foreground"}`}>{i + 1}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><span className="text-xs font-medium text-primary">{sdr.initials}</span></div>
                      <div><p className="font-medium text-foreground">{sdr.full_name}</p><p className="text-[10px] text-muted-foreground">{sdr.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-foreground">{sdr.leadsAtribuidos}</td>
                  <td className="px-4 py-3 text-center text-foreground">{sdr.agendamentos}</td>
                  <td className="px-4 py-3 text-center text-foreground">{sdr.reunioes}</td>
                  <td className="px-4 py-3 text-center font-semibold text-foreground">{sdr.vendas}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sdr.taxaConversao >= 30 ? "bg-success/15 text-success" : sdr.taxaConversao >= 20 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"}`}>{sdr.taxaConversao.toFixed(1)}%</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{formatCurrency(sdr.receita, currencyCode)}</td>
                </tr>
              ))}
              {ranking.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Nenhum SDR cadastrado</td></tr>}
            </tbody>
          </table>
        </div>

        {/* SDR List */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Todos os SDRs</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-48 rounded-md border border-input bg-muted/50 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>
          <div className="divide-y divide-border">
            {filtered.map(sdr => (
              <div key={sdr.user_id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><span className="text-xs font-medium text-primary">{sdr.initials}</span></div>
                  <div><p className="text-sm font-medium text-foreground">{sdr.full_name}</p><p className="text-xs text-muted-foreground">{sdr.email} · {sdr.phone || "—"}</p></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right"><p className="text-sm font-medium text-foreground">{sdr.leadsAtribuidos} leads</p><p className="text-[10px] text-muted-foreground">{sdr.vendas} vendas</p></div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sdr.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{sdr.status === "active" ? "Ativo" : "Inativo"}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum SDR encontrado</div>}
          </div>
        </div>
      </div>

      <Dialog open={showNewSDR} onOpenChange={setShowNewSDR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo SDR</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome completo *</Label><Input value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} placeholder="Nome do SDR" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Email *</Label><Input type="email" value={newForm.email} onChange={(e) => setNewForm({ ...newForm, email: e.target.value })} placeholder="email@empresa.com" /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={newForm.phone} onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })} placeholder="(11) 99999-0000" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSDR(false)}>Cancelar</Button>
            <Button onClick={handleCreateSDR} disabled={saving || !newForm.name.trim() || !newForm.email.trim()}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Criar SDR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
