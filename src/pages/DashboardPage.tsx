import { useState, useMemo } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { useLeads } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Target, DollarSign, Clock, ArrowUpRight, ArrowDownRight,
  CalendarCheck, CalendarClock, Percent, Instagram, MessageCircle,
  ChevronDown, Calendar as CalendarIcon, Send
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { IntegrationHealthBanner } from "@/components/IntegrationHealthBanner";
import { formatCurrency } from "@/lib/currency";

type ChannelFilter = "all" | "instagram" | "whatsapp";

const datePresets = [
  { label: "Hoje", value: "today", days: 1 },
  { label: "Ontem", value: "yesterday", days: 1 },
  { label: "Últimos 7 dias", value: "7d", days: 7 },
  { label: "Últimos 14 dias", value: "14d", days: 14 },
  { label: "Últimos 30 dias", value: "30d", days: 30 },
  { label: "Últimos 60 dias", value: "60d", days: 60 },
  { label: "Personalizado", value: "custom", days: 0 },
];

function getDateRange(preset: string, customFrom?: Date, customTo?: Date) {
  const now = new Date();
  let from = new Date(); let to = new Date();
  let daysDiff = 1;

  if (preset === "today") { from = new Date(now.toDateString()); to = now; daysDiff = 1; }
  else if (preset === "yesterday") { from = subDays(new Date(now.toDateString()), 1); to = new Date(now.toDateString()); daysDiff = 1; }
  else if (preset === "custom" && customFrom && customTo) { from = customFrom; to = customTo; daysDiff = Math.max(1, Math.ceil((customTo.getTime() - customFrom.getTime()) / 86400000) + 1); }
  else { const d = parseInt(preset) || 7; from = subDays(new Date(now.toDateString()), d - 1); to = now; daysDiff = d; }

  const prevTo = subDays(from, 1);
  const prevFrom = subDays(prevTo, daysDiff - 1);
  return { from: from.toISOString(), to: to.toISOString(), prevFrom: prevFrom.toISOString(), prevTo: prevTo.toISOString() };
}

function PeriodComparison({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  const pctChange = previous === 0 ? 100 : ((current - previous) / previous) * 100;
  const isUp = pctChange >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${isUp ? "text-emerald-500" : "text-red-400"}`}>
      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(pctChange).toFixed(1)}%
    </span>
  );
}

export default function DashboardPage() {
  const { currentProject, projects } = useProject();
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<string>("30d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectingStart, setSelectingStart] = useState(true);

  const projectId = projectFilter === "all" ? currentProject?.id : projectFilter;
  const currencyCode = currentProject?.currency_code || "BRL";

  const { from, to, prevFrom, prevTo } = useMemo(() => getDateRange(datePreset, customFrom, customTo), [datePreset, customFrom, customTo]);

  // Fetch leads for current period
  const { data: currentLeads = [] } = useQuery({
    queryKey: ["dashboard-leads", projectId, from, to],
    queryFn: async () => {
      if (!projectId) return [];
      const { data } = await supabase.from("leads")
        .select("id, name, sdr_id, closer_id, consultation_done, sale_status, value_estimate, scheduling_date, created_at, source, channel, response_time_minutes")
        .eq("project_id", projectId).gte("created_at", from).lte("created_at", to);
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch leads for previous period
  const { data: prevLeads = [] } = useQuery({
    queryKey: ["dashboard-leads-prev", projectId, prevFrom, prevTo],
    queryFn: async () => {
      if (!projectId) return [];
      const { data } = await supabase.from("leads")
        .select("id, consultation_done, sale_status, value_estimate, scheduling_date, response_time_minutes")
        .eq("project_id", projectId).gte("created_at", prevFrom).lte("created_at", prevTo);
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch profiles for SDR/Closer names
  const { data: profiles = [] } = useQuery({
    queryKey: ["dashboard-profiles"],
    queryFn: async () => { const { data } = await supabase.from("profiles").select("user_id, full_name"); return data || []; },
  });

  const getName = (userId: string | null) => profiles.find(p => p.user_id === userId)?.full_name || "—";

  // KPIs
  const appointments = currentLeads.filter(l => l.scheduling_date);
  const attended = currentLeads.filter(l => l.consultation_done);
  const attendanceRate = appointments.length > 0 ? (attended.length / appointments.length) * 100 : 0;
  const closed = currentLeads.filter(l => l.sale_status === "sold");
  const conversionRate = currentLeads.length > 0 ? (closed.length / currentLeads.length) * 100 : 0;
  const totalRevenue = closed.reduce((s, l) => s + (Number(l.value_estimate) || 0), 0);
  const leadsWithResponse = currentLeads.filter(l => l.response_time_minutes != null);
  const avgResponse = leadsWithResponse.length > 0 ? leadsWithResponse.reduce((s, l) => s + (l.response_time_minutes || 0), 0) / leadsWithResponse.length : 0;

  // Previous KPIs
  const prevAppts = prevLeads.filter(l => l.scheduling_date);
  const prevAttended = prevLeads.filter(l => l.consultation_done);
  const prevAttRate = prevAppts.length > 0 ? (prevAttended.length / prevAppts.length) * 100 : 0;
  const prevClosed = prevLeads.filter(l => l.sale_status === "sold");
  const prevConvRate = prevLeads.length > 0 ? (prevClosed.length / prevLeads.length) * 100 : 0;
  const prevRevenue = prevClosed.reduce((s, l) => s + (Number(l.value_estimate) || 0), 0);

  // Leads per day chart
  const leadsPerDayData = useMemo(() => {
    const days: Record<string, { day: string; instagram: number; whatsapp: number; total: number }> = {};
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    currentLeads.forEach(l => {
      const d = new Date(l.created_at);
      const key = d.toISOString().slice(0, 10);
      const label = `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
      if (!days[key]) days[key] = { day: label, instagram: 0, whatsapp: 0, total: 0 };
      days[key].total++;
      if (l.channel === "instagram") days[key].instagram++;
      if (l.channel === "whatsapp") days[key].whatsapp++;
    });
    return Object.entries(days).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [currentLeads]);

  // SDR Performance
  const sdrPerformance = useMemo(() => {
    const map: Record<string, { contatos: number; agendamentos: number; comparecimentos: number; vendas: number; receita: number }> = {};
    currentLeads.forEach(l => {
      const sdr = l.sdr_id || "unassigned";
      if (!map[sdr]) map[sdr] = { contatos: 0, agendamentos: 0, comparecimentos: 0, vendas: 0, receita: 0 };
      map[sdr].contatos++;
      if (l.scheduling_date) map[sdr].agendamentos++;
      if (l.consultation_done) map[sdr].comparecimentos++;
      if (l.sale_status === "sold") { map[sdr].vendas++; map[sdr].receita += Number(l.value_estimate) || 0; }
    });
    return Object.entries(map).map(([userId, d]) => ({ name: getName(userId), ...d }));
  }, [currentLeads, profiles]);

  // Closer Performance
  const closerPerformance = useMemo(() => {
    const map: Record<string, { calls: number; realizadas: number; vendas: number; receita: number }> = {};
    currentLeads.forEach(l => {
      const c = l.closer_id || "unassigned";
      if (!map[c]) map[c] = { calls: 0, realizadas: 0, vendas: 0, receita: 0 };
      if (l.scheduling_date) { map[c].calls++; if (l.consultation_done) map[c].realizadas++; }
      if (l.sale_status === "sold") { map[c].vendas++; map[c].receita += Number(l.value_estimate) || 0; }
    });
    return Object.entries(map).map(([userId, d]) => ({ name: getName(userId), ...d }));
  }, [currentLeads, profiles]);

  const tooltipStyle = { backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--card-foreground))" };

  const handleDateSelect = (day: Date | undefined) => {
    if (!day) return;
    if (selectingStart) { setCustomFrom(day); setCustomTo(undefined); setSelectingStart(false); }
    else {
      if (customFrom && day < customFrom) { setCustomTo(customFrom); setCustomFrom(day); } else { setCustomTo(day); }
      setSelectingStart(true); setCalendarOpen(false); setDatePreset("custom");
    }
  };

  const dateLabel = useMemo(() => {
    if (datePreset === "custom" && customFrom && customTo) return `${format(customFrom, "dd/MM", { locale: ptBR })} - ${format(customTo, "dd/MM", { locale: ptBR })}`;
    return datePresets.find(p => p.value === datePreset)?.label || "Período";
  }, [datePreset, customFrom, customTo]);

  const formatResponseTime = (min: number) => min < 60 ? `${Math.round(min)} min` : `${Math.floor(min / 60)}h ${Math.round(min % 60)}min`;

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 overflow-y-auto h-full scrollbar-thin">
      <IntegrationHealthBanner />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-base md:text-lg font-semibold text-foreground">Dashboard</h1>
          <p className="text-xs md:text-sm text-muted-foreground">{currentProject?.name || "—"} · Visão Geral</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[150px] h-8 text-xs bg-card border-border"><SelectValue placeholder="Projeto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Projeto Atual</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs bg-card border-border gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />{dateLabel}<ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex">
                <div className="border-r border-border p-2 space-y-0.5 min-w-[140px]">
                  {datePresets.filter(p => p.value !== "custom").map(p => (
                    <button key={p.value} onClick={() => { setDatePreset(p.value); setCalendarOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs hover:bg-muted transition-colors ${datePreset === p.value ? "bg-muted font-medium text-foreground" : "text-muted-foreground"}`}>{p.label}</button>
                  ))}
                </div>
                <div className="p-2"><Calendar mode="single" selected={selectingStart ? customFrom : customTo} onSelect={handleDateSelect} locale={ptBR} className="pointer-events-auto" /></div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="w-4 h-4 text-primary" /></div>
            <PeriodComparison current={currentLeads.length} previous={prevLeads.length} /></div>
          <p className="text-2xl font-bold text-card-foreground">{currentLeads.length}</p>
          <p className="text-xs text-muted-foreground">Leads no Período</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Target className="w-4 h-4 text-primary" /></div>
            <PeriodComparison current={conversionRate} previous={prevConvRate} /></div>
          <p className="text-2xl font-bold text-card-foreground">{conversionRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><DollarSign className="w-4 h-4 text-primary" /></div>
            <PeriodComparison current={totalRevenue} previous={prevRevenue} /></div>
          <p className="text-2xl font-bold text-card-foreground">{formatCurrency(totalRevenue, currencyCode)}</p>
          <p className="text-xs text-muted-foreground">Receita Período</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><CalendarClock className="w-4 h-4 text-primary" /></div>
            <PeriodComparison current={appointments.length} previous={prevAppts.length} /></div>
          <p className="text-2xl font-bold text-card-foreground">{appointments.length}</p>
          <p className="text-xs text-muted-foreground">Agendamentos</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><CalendarCheck className="w-4 h-4 text-primary" /></div>
            <PeriodComparison current={attendanceRate} previous={prevAttRate} /></div>
          <p className="text-2xl font-bold text-card-foreground">{attendanceRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Taxa Comparecimento</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Clock className="w-4 h-4 text-primary" /></div></div>
          <p className="text-2xl font-bold text-card-foreground">{formatResponseTime(avgResponse)}</p>
          <p className="text-xs text-muted-foreground">Tempo Médio Resposta</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-4 md:p-5 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Leads por Dia</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={leadsPerDayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="instagram" name="Instagram" fill="hsl(340, 75%, 55%)" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="whatsapp" name="WhatsApp" fill="hsl(152, 69%, 40%)" radius={[4, 4, 0, 0]} stackId="a" />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="p-4 md:p-5 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Resumo Rápido</h3>
          <div className="space-y-3">
            {[
              { label: "Instagram", value: currentLeads.filter(l => l.channel === "instagram").length, icon: Instagram, color: "text-pink-400" },
              { label: "WhatsApp", value: currentLeads.filter(l => l.channel === "whatsapp").length, icon: MessageCircle, color: "text-emerald-400" },
              { label: "Vendas Ganhas", value: closed.length, icon: DollarSign, color: "text-primary" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-xs text-muted-foreground flex-1">{item.label}</span>
                <span className="text-sm font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SDR Performance */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">Performance SDRs</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-border">
              {["SDR", "Contatos", "Agendamentos", "Comparecimentos", "Vendas", "Receita"].map(h => (
                <th key={h} className="text-left text-[10px] uppercase tracking-wider text-muted-foreground pb-2 px-2 first:pl-0">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {sdrPerformance.map(sdr => (
                <tr key={sdr.name} className="border-b border-border/50">
                  <td className="py-2.5 text-sm font-medium text-foreground">{sdr.name}</td>
                  <td className="py-2.5 text-sm text-muted-foreground px-2">{sdr.contatos}</td>
                  <td className="py-2.5 text-sm text-muted-foreground px-2">{sdr.agendamentos}</td>
                  <td className="py-2.5 text-sm text-muted-foreground px-2">{sdr.comparecimentos}</td>
                  <td className="py-2.5 text-sm font-medium text-foreground px-2">{sdr.vendas}</td>
                  <td className="py-2.5 text-sm font-medium text-foreground px-2">{formatCurrency(sdr.receita, currencyCode)}</td>
                </tr>
              ))}
              {sdrPerformance.length === 0 && <tr><td colSpan={6} className="py-4 text-sm text-muted-foreground text-center">Nenhum dado no período</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Closer Performance */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">Performance Closers</h3>
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
              {closerPerformance.length === 0 && <tr><td colSpan={6} className="py-4 text-sm text-muted-foreground text-center">Nenhum dado no período</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
