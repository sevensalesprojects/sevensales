import { useState, useMemo } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/currency";
import { Phone, PhoneCall, Percent, FileText, DollarSign, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subDays, startOfDay, endOfDay } from "date-fns";

type Period = "7d" | "30d" | "90d" | "all";

function getPeriodRange(period: Period) {
  if (period === "all") return { start: null, end: null };
  const end = endOfDay(new Date());
  const start = startOfDay(subDays(new Date(), parseInt(period)));
  return { start: start.toISOString(), end: end.toISOString() };
}

export default function ClosersPage() {
  const { currentProject } = useProject();
  const currencyCode = currentProject?.currency_code || "BRL";
  const [period, setPeriod] = useState<Period>("30d");
  const range = useMemo(() => getPeriodRange(period), [period]);

  const { data: closerRoles = [] } = useQuery({
    queryKey: ["closer-roles"],
    queryFn: async () => { const { data } = await supabase.from("user_roles").select("user_id").eq("role", "closer"); return data || []; },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["closer-profiles", closerRoles.map(r => r.user_id)],
    queryFn: async () => {
      if (closerRoles.length === 0) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name").in("user_id", closerRoles.map(r => r.user_id));
      return data || [];
    },
    enabled: closerRoles.length > 0,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["closer-leads", currentProject?.id, period],
    queryFn: async () => {
      if (!currentProject) return [];
      let q = supabase.from("leads")
        .select("id, sdr_id, closer_id, scheduling_date, consultation_done, sale_status, value_estimate")
        .eq("project_id", currentProject.id);
      if (range.start) q = q.gte("created_at", range.start);
      if (range.end) q = q.lte("created_at", range.end);
      const { data } = await q;
      return data || [];
    },
    enabled: !!currentProject,
  });

  const { data: sdrProfiles = [] } = useQuery({
    queryKey: ["closer-sdr-profiles"],
    queryFn: async () => { const { data } = await supabase.from("profiles").select("user_id, full_name"); return data || []; },
  });

  const getName = (id: string | null) => [...profiles, ...sdrProfiles].find(p => p.user_id === id)?.full_name || "—";

  const leadsWithAppointment = leads.filter(l => l.scheduling_date);
  const callsRealized = leads.filter(l => l.consultation_done).length;
  const attendanceRate = leadsWithAppointment.length > 0 ? ((callsRealized / leadsWithAppointment.length) * 100).toFixed(1) : "0";
  const closed = leads.filter(l => l.sale_status === "sold");
  const totalRevenue = closed.reduce((s, l) => s + (Number(l.value_estimate) || 0), 0);
  const ticketMedio = closed.length > 0 ? totalRevenue / closed.length : 0;
  const conversionRate = leadsWithAppointment.length > 0 ? ((closed.length / leadsWithAppointment.length) * 100).toFixed(1) : "0";

  const closerPerformance = useMemo(() => {
    const map: Record<string, { calls: number; realizadas: number; vendas: number; receita: number; propostas: number }> = {};
    leads.forEach(l => {
      const c = l.closer_id || "unassigned";
      if (!map[c]) map[c] = { calls: 0, realizadas: 0, vendas: 0, receita: 0, propostas: 0 };
      if (l.scheduling_date) { map[c].calls++; if (l.consultation_done) map[c].realizadas++; }
      if (l.sale_status === "sold") { map[c].vendas++; map[c].receita += Number(l.value_estimate) || 0; }
    });
    return Object.entries(map).map(([userId, d]) => ({ name: getName(userId), ...d }));
  }, [leads, profiles, sdrProfiles]);

  const sdrOrigin = useMemo(() => {
    const map: Record<string, { enviados: number; callsRealizadas: number; vendas: number; receita: number }> = {};
    leads.forEach(l => {
      const sdr = l.sdr_id || "unassigned";
      if (!map[sdr]) map[sdr] = { enviados: 0, callsRealizadas: 0, vendas: 0, receita: 0 };
      if (l.scheduling_date) { map[sdr].enviados++; if (l.consultation_done) map[sdr].callsRealizadas++; }
      if (l.sale_status === "sold") { map[sdr].vendas++; map[sdr].receita += Number(l.value_estimate) || 0; }
    });
    return Object.entries(map).map(([userId, d]) => ({ name: getName(userId), ...d }));
  }, [leads, sdrProfiles]);

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 overflow-y-auto h-full scrollbar-thin">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-base md:text-lg font-semibold text-foreground">Closers</h1>
          <p className="text-xs md:text-sm text-muted-foreground">{currentProject?.name || "—"} · Gestão Comercial</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-[160px] h-8 text-xs bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="all">Todo o período</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard icon={Phone} label="Calls Agendadas" value={leadsWithAppointment.length} />
        <KPICard icon={PhoneCall} label="Calls Realizadas" value={callsRealized} />
        <KPICard icon={Percent} label="Taxa Comparecimento" value={`${attendanceRate}%`} />
        <KPICard icon={FileText} label="Vendas" value={closed.length} />
        <KPICard icon={DollarSign} label="Receita" value={formatCurrency(totalRevenue, currencyCode)} />
        <KPICard icon={TrendingUp} label="Ticket Médio" value={formatCurrency(ticketMedio, currencyCode)} />
      </div>

      <div className="p-5 rounded-xl bg-card border border-border">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">Ranking de Closers</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-border">
              {["Closer", "Calls Agend.", "Calls Realiz.", "Vendas", "Receita", "Conversão"].map(h => (
                <th key={h} className="text-left text-[10px] uppercase tracking-wider text-muted-foreground pb-2 px-2 first:pl-0">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {closerPerformance.map(c => (
                <tr key={c.name} className="border-b border-border/50">
                  <td className="py-2.5 text-sm font-medium text-foreground">{c.name}</td>
                  <td className="py-2.5 text-sm text-muted-foreground px-2">{c.calls}</td>
                  <td className="py-2.5 text-sm text-muted-foreground px-2">{c.realizadas}</td>
                  <td className="py-2.5 text-sm font-medium text-foreground px-2">{c.vendas}</td>
                  <td className="py-2.5 text-sm font-medium text-foreground px-2">{formatCurrency(c.receita, currencyCode)}</td>
                  <td className="py-2.5 text-sm font-medium text-foreground px-2">{c.calls > 0 ? ((c.vendas / c.calls) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
              {closerPerformance.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Nenhum closer encontrado</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-card border border-border">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">Qualidade dos Leads por SDR</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-border">
              {["SDR", "Leads Enviados", "Calls Realizadas", "Vendas", "Receita", "Conversão"].map(h => (
                <th key={h} className="text-left text-[10px] uppercase tracking-wider text-muted-foreground pb-2 px-2 first:pl-0">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {sdrOrigin.map(s => (
                <tr key={s.name} className="border-b border-border/50">
                  <td className="py-2.5 text-sm font-medium text-foreground">{s.name}</td>
                  <td className="py-2.5 text-sm text-muted-foreground px-2">{s.enviados}</td>
                  <td className="py-2.5 text-sm text-muted-foreground px-2">{s.callsRealizadas}</td>
                  <td className="py-2.5 text-sm font-medium text-foreground px-2">{s.vendas}</td>
                  <td className="py-2.5 text-sm font-medium text-foreground px-2">{formatCurrency(s.receita, currencyCode)}</td>
                  <td className="py-2.5 text-sm font-medium text-foreground px-2">{s.enviados > 0 ? ((s.vendas / s.enviados) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2"><Icon className="w-4 h-4 text-primary" /></div>
      <p className="text-2xl font-bold text-card-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
