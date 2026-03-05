import { useState, useMemo } from "react";
import { useExpert } from "@/contexts/ExpertContext";
import { mockLeads } from "@/data/mockData";
import {
  Users, Target, DollarSign, Clock, ArrowUpRight, ArrowDownRight,
  CalendarCheck, CalendarClock, Percent, Instagram, MessageCircle, Filter
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const TODAY = "2026-03-05";

type ChannelFilter = "all" | "instagram" | "whatsapp";
type Currency = "BRL" | "USD";

const currencyFormat = (value: number, currency: Currency) => {
  const symbol = currency === "BRL" ? "R$" : "$";
  const rate = currency === "USD" ? 0.18 : 1; // mock conversion
  const converted = value * rate;
  return `${symbol} ${converted.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function DashboardPage() {
  const { currentExpert } = useExpert();
  const [sdrFilter, setSdrFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7d");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [currency, setCurrency] = useState<Currency>("BRL");

  // Derive unique SDRs from leads
  const sdrs = useMemo(() => {
    const set = new Set(mockLeads.map((l) => l.sdr));
    return Array.from(set);
  }, []);

  // Date filtering
  const dateThreshold = useMemo(() => {
    const d = new Date(TODAY);
    if (dateRange === "today") return TODAY;
    if (dateRange === "7d") { d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); }
    if (dateRange === "30d") { d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); }
    if (dateRange === "90d") { d.setDate(d.getDate() - 90); return d.toISOString().slice(0, 10); }
    return "2020-01-01";
  }, [dateRange]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return mockLeads.filter((l) => {
      if (sdrFilter !== "all" && l.sdr !== sdrFilter) return false;
      if (l.createdAt < dateThreshold) return false;
      return true;
    });
  }, [sdrFilter, dateThreshold]);

  // Today's leads
  const leadsToday = useMemo(() => filteredLeads.filter((l) => l.createdAt === TODAY), [filteredLeads]);
  const leadsInstagramToday = leadsToday.filter((l) => l.channel === "instagram").length;
  const leadsWhatsappToday = leadsToday.filter((l) => l.channel === "whatsapp").length;

  // Appointments
  const appointments = useMemo(() => filteredLeads.filter((l) => l.hasAppointment), [filteredLeads]);
  const appointmentsAttended = appointments.filter((l) => l.appointmentAttended).length;
  const appointmentRate = appointments.length > 0 ? ((appointmentsAttended / appointments.length) * 100).toFixed(1) : "0";

  // Conversion rate (stage s6 = Fechado)
  const closed = filteredLeads.filter((l) => l.stage === "s6").length;
  const conversionRate = filteredLeads.length > 0 ? ((closed / filteredLeads.length) * 100).toFixed(1) : "0";

  // Revenue
  const totalRevenue = filteredLeads.filter((l) => l.stage === "s6").reduce((sum, l) => sum + (l.value || 0), 0);

  // Leads per day chart data with channel breakdown
  const leadsPerDayData = useMemo(() => {
    const days: Record<string, { day: string; instagram: number; whatsapp: number; total: number }> = {};
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    filteredLeads.forEach((l) => {
      const d = new Date(l.createdAt + "T00:00:00");
      const label = `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
      if (!days[l.createdAt]) days[l.createdAt] = { day: label, instagram: 0, whatsapp: 0, total: 0 };
      days[l.createdAt].total++;
      if (l.channel === "instagram") days[l.createdAt].instagram++;
      if (l.channel === "whatsapp") days[l.createdAt].whatsapp++;
    });
    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [filteredLeads]);

  // Funnel data from leads
  const funnelData = useMemo(() => {
    const stages = [
      { id: "s1", name: "Lead Novo", fill: "hsl(205, 80%, 50%)" },
      { id: "s2", name: "Contato", fill: "hsl(175, 80%, 36%)" },
      { id: "s3", name: "Qualificação", fill: "hsl(38, 92%, 50%)" },
      { id: "s4", name: "Agendamento", fill: "hsl(280, 65%, 55%)" },
      { id: "s5", name: "Proposta", fill: "hsl(340, 75%, 55%)" },
      { id: "s6", name: "Fechado", fill: "hsl(152, 69%, 40%)" },
    ];
    return stages.map((s) => ({
      ...s,
      value: filteredLeads.filter((l) => l.stage === s.id).length,
    }));
  }, [filteredLeads]);

  const maxFunnel = Math.max(...funnelData.map((f) => f.value), 1);

  // SDR performance table from leads
  const sdrPerformance = useMemo(() => {
    const map: Record<string, { contatos: number; agendamentos: number; comparecimentos: number; vendas: number; receita: number }> = {};
    filteredLeads.forEach((l) => {
      if (!map[l.sdr]) map[l.sdr] = { contatos: 0, agendamentos: 0, comparecimentos: 0, vendas: 0, receita: 0 };
      map[l.sdr].contatos++;
      if (l.hasAppointment) map[l.sdr].agendamentos++;
      if (l.appointmentAttended) map[l.sdr].comparecimentos++;
      if (l.stage === "s6") {
        map[l.sdr].vendas++;
        map[l.sdr].receita += l.value || 0;
      }
    });
    return Object.entries(map).map(([name, d]) => ({ name, ...d }));
  }, [filteredLeads]);

  // Avg time (mock)
  const avgTime = "4.2 dias";

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
    color: "hsl(var(--card-foreground))",
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full scrollbar-thin">
      {/* Header with filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{currentExpert.name} · Admin Master</p>
        </div>
        <div className="flex items-center gap-2">
          {/* SDR Filter */}
          <Select value={sdrFilter} onValueChange={setSdrFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-card border-border">
              <SelectValue placeholder="SDR" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos SDRs</SelectItem>
              {sdrs.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[130px] h-8 text-xs bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>

          {/* Currency */}
          <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
            <SelectTrigger className="w-[90px] h-8 text-xs bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">R$ Real</SelectItem>
              <SelectItem value="USD">$ Dólar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Leads Hoje */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{leadsToday.length}</p>
          <p className="text-xs text-muted-foreground">Leads Hoje</p>
          <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Instagram className="w-3 h-3 text-pink-400" />
              {leadsInstagramToday}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-emerald-400" />
              {leadsWhatsappToday}
            </span>
          </div>
        </div>

        {/* Taxa de Conversão */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{conversionRate}%</p>
          <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
        </div>

        {/* Vendas */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{currencyFormat(totalRevenue, currency)}</p>
          <p className="text-xs text-muted-foreground">Receita Período</p>
        </div>

        {/* Agendamentos Realizados */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarClock className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{appointments.length}</p>
          <p className="text-xs text-muted-foreground">Agendamentos</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {filteredLeads.length > 0 ? ((appointments.length / filteredLeads.length) * 100).toFixed(1) : 0}% dos leads
          </p>
        </div>

        {/* Comparecimentos */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{appointmentsAttended}</p>
          <p className="text-xs text-muted-foreground">Comparecimentos</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {appointmentRate}% taxa comparecimento
          </p>
        </div>

        {/* Tempo Médio */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{avgTime}</p>
          <p className="text-xs text-muted-foreground">Tempo Médio</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Leads per day with channel filter */}
        <div className="col-span-2 p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-card-foreground">Leads por Dia</h3>
            <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as ChannelFilter)}>
              <SelectTrigger className="w-[150px] h-7 text-xs bg-muted/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Canais</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={leadsPerDayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={tooltipStyle} />
              {(channelFilter === "all" || channelFilter === "instagram") && (
                <Bar dataKey="instagram" name="Instagram" fill="hsl(340, 75%, 55%)" radius={[4, 4, 0, 0]} stackId="a" />
              )}
              {(channelFilter === "all" || channelFilter === "whatsapp") && (
                <Bar dataKey="whatsapp" name="WhatsApp" fill="hsl(152, 69%, 40%)" radius={[4, 4, 0, 0]} stackId="a" />
              )}
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Funnel */}
        <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Funil de Conversão</h3>
          <div className="space-y-2.5">
            {funnelData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-xs text-muted-foreground flex-1">{item.name}</span>
                <span className="text-xs font-medium text-foreground">{item.value}</span>
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(item.value / maxFunnel) * 100}%`, backgroundColor: item.fill }}
                  />
                </div>
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
            <thead>
              <tr className="border-b border-border">
                {["SDR", "Contatos", "Agendamentos", "Comparecimentos", "Taxa Comp.", "Vendas", "Receita", "Conversão"].map((h) => (
                  <th key={h} className="text-left text-[10px] uppercase tracking-wider text-muted-foreground pb-2 px-2 first:pl-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sdrPerformance.map((sdr) => (
                <tr key={sdr.name} className="border-b border-border/50">
                  <td className="py-2.5 text-sm font-medium text-foreground">{sdr.name}</td>
                  <td className="py-2.5 text-sm text-muted-foreground px-2">{sdr.contatos}</td>
                  <td className="py-2.5 text-sm text-muted-foreground px-2">{sdr.agendamentos}</td>
                  <td className="py-2.5 text-sm text-muted-foreground px-2">{sdr.comparecimentos}</td>
                  <td className="py-2.5 text-sm font-medium text-foreground px-2">
                    {sdr.agendamentos > 0 ? ((sdr.comparecimentos / sdr.agendamentos) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="py-2.5 text-sm font-medium text-success px-2">{sdr.vendas}</td>
                  <td className="py-2.5 text-sm font-medium text-foreground px-2">{currencyFormat(sdr.receita, currency)}</td>
                  <td className="py-2.5 text-sm font-medium text-foreground px-2">
                    {sdr.contatos > 0 ? ((sdr.vendas / sdr.contatos) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
