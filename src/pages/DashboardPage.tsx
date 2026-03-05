import { useState, useMemo, useRef } from "react";
import { useExpert } from "@/contexts/ExpertContext";
import { mockLeads } from "@/data/mockData";
import {
  Users, Target, DollarSign, Clock, ArrowUpRight, ArrowDownRight,
  CalendarCheck, CalendarClock, Percent, Instagram, MessageCircle,
  ChevronDown, Calendar as CalendarIcon
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TODAY = "2026-03-05";
const TODAY_DATE = new Date(TODAY + "T12:00:00");

type ChannelFilter = "all" | "instagram" | "whatsapp";
type Currency = "BRL" | "USD";

const currencyFormat = (value: number, currency: Currency) => {
  const symbol = currency === "BRL" ? "R$" : "$";
  const rate = currency === "USD" ? 0.18 : 1;
  return `${symbol} ${(value * rate).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const datePresets = [
  { label: "Hoje", value: "today", days: 1 },
  { label: "Ontem", value: "yesterday", days: 1 },
  { label: "Últimos 7 dias", value: "7d", days: 7 },
  { label: "Últimos 14 dias", value: "14d", days: 14 },
  { label: "Últimos 30 dias", value: "30d", days: 30 },
  { label: "Últimos 60 dias", value: "60d", days: 60 },
  { label: "Personalizado", value: "custom", days: 0 },
];

function getDateRange(preset: string, customFrom?: Date, customTo?: Date): { from: string; to: string; prevFrom: string; prevTo: string } {
  const to = new Date(TODAY + "T23:59:59");
  let from = new Date(TODAY + "T00:00:00");
  let daysDiff = 1;

  if (preset === "today") {
    from = new Date(TODAY + "T00:00:00");
    daysDiff = 1;
  } else if (preset === "yesterday") {
    from = new Date(TODAY + "T00:00:00");
    from.setDate(from.getDate() - 1);
    to.setDate(to.getDate() - 1);
    daysDiff = 1;
  } else if (preset === "custom" && customFrom && customTo) {
    from = customFrom;
    to.setTime(customTo.getTime());
    daysDiff = Math.max(1, Math.ceil((customTo.getTime() - customFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  } else {
    const days = parseInt(preset) || 7;
    from.setDate(from.getDate() - (days - 1));
    daysDiff = days;
  }

  const prevTo = new Date(from);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - (daysDiff - 1));

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    prevFrom: prevFrom.toISOString().slice(0, 10),
    prevTo: prevTo.toISOString().slice(0, 10),
  };
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
  const { currentExpert, experts } = useExpert();
  const [sdrFilter, setSdrFilter] = useState<string>("all");
  const [closerFilter, setCloserFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<string>("7d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [currency, setCurrency] = useState<Currency>("BRL");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectingStart, setSelectingStart] = useState(true);

  const sdrs = useMemo(() => Array.from(new Set(mockLeads.map((l) => l.sdr))), []);
  const closers = useMemo(() => Array.from(new Set(mockLeads.map((l) => l.closer).filter(Boolean))) as string[], []);

  const { from, to, prevFrom, prevTo } = useMemo(
    () => getDateRange(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo]
  );

  const filterLeadsByRange = (rangeFrom: string, rangeTo: string) =>
    mockLeads.filter((l) => {
      if (projectFilter !== "all" && l.expertId !== projectFilter) return false;
      if (sdrFilter !== "all" && l.sdr !== sdrFilter) return false;
      if (closerFilter !== "all" && l.closer !== closerFilter) return false;
      if (l.createdAt < rangeFrom || l.createdAt > rangeTo) return false;
      return true;
    });

  const filteredLeads = useMemo(() => filterLeadsByRange(from, to), [from, to, sdrFilter, closerFilter, projectFilter]);
  const prevLeads = useMemo(() => filterLeadsByRange(prevFrom, prevTo), [prevFrom, prevTo, sdrFilter, closerFilter, projectFilter]);

  // KPIs current
  const leadsToday = filteredLeads.filter((l) => l.createdAt === TODAY);
  const leadsInstagramToday = leadsToday.filter((l) => l.channel === "instagram").length;
  const leadsWhatsappToday = leadsToday.filter((l) => l.channel === "whatsapp").length;

  const appointments = filteredLeads.filter((l) => l.hasAppointment);
  const appointmentsAttended = appointments.filter((l) => l.appointmentAttended).length;
  const attendanceRate = appointments.length > 0 ? (appointmentsAttended / appointments.length) * 100 : 0;

  const closed = filteredLeads.filter((l) => l.stage === "s6");
  const conversionRate = filteredLeads.length > 0 ? (closed.length / filteredLeads.length) * 100 : 0;
  const totalRevenue = closed.reduce((sum, l) => sum + (l.value || 0), 0);

  // Avg response time (business hours only)
  const leadsWithResponse = filteredLeads.filter((l) => l.responseTimeMinutes != null);
  const avgResponseMin = leadsWithResponse.length > 0
    ? leadsWithResponse.reduce((s, l) => s + (l.responseTimeMinutes || 0), 0) / leadsWithResponse.length
    : 0;
  const formatResponseTime = (min: number) => {
    if (min < 60) return `${Math.round(min)} min`;
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return `${h}h ${m}min`;
  };

  // KPIs previous
  const prevAppointments = prevLeads.filter((l) => l.hasAppointment);
  const prevAttended = prevAppointments.filter((l) => l.appointmentAttended).length;
  const prevAttendanceRate = prevAppointments.length > 0 ? (prevAttended / prevAppointments.length) * 100 : 0;
  const prevClosed = prevLeads.filter((l) => l.stage === "s6");
  const prevConvRate = prevLeads.length > 0 ? (prevClosed.length / prevLeads.length) * 100 : 0;
  const prevRevenue = prevClosed.reduce((s, l) => s + (l.value || 0), 0);
  const prevResponseLeads = prevLeads.filter((l) => l.responseTimeMinutes != null);
  const prevAvgResponse = prevResponseLeads.length > 0
    ? prevResponseLeads.reduce((s, l) => s + (l.responseTimeMinutes || 0), 0) / prevResponseLeads.length
    : 0;

  // Chart data
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
    return Object.entries(days).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [filteredLeads]);

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

  // SDR Performance
  const sdrPerformance = useMemo(() => {
    const map: Record<string, { contatos: number; agendamentos: number; comparecimentos: number; vendas: number; receita: number }> = {};
    filteredLeads.forEach((l) => {
      if (!map[l.sdr]) map[l.sdr] = { contatos: 0, agendamentos: 0, comparecimentos: 0, vendas: 0, receita: 0 };
      map[l.sdr].contatos++;
      if (l.hasAppointment) map[l.sdr].agendamentos++;
      if (l.appointmentAttended) map[l.sdr].comparecimentos++;
      if (l.stage === "s6") { map[l.sdr].vendas++; map[l.sdr].receita += l.value || 0; }
    });
    return Object.entries(map).map(([name, d]) => ({ name, ...d }));
  }, [filteredLeads]);

  // Closer Performance
  const closerPerformance = useMemo(() => {
    const map: Record<string, { calls: number; realizadas: number; propostas: number; vendas: number; receita: number }> = {};
    filteredLeads.forEach((l) => {
      const c = l.closer || "Sem closer";
      if (!map[c]) map[c] = { calls: 0, realizadas: 0, propostas: 0, vendas: 0, receita: 0 };
      if (l.hasAppointment) { map[c].calls++; if (l.appointmentAttended) map[c].realizadas++; }
      if (["s5", "s6"].includes(l.stage)) map[c].propostas++;
      if (l.stage === "s6") { map[c].vendas++; map[c].receita += l.value || 0; }
    });
    return Object.entries(map).map(([name, d]) => ({ name, ...d }));
  }, [filteredLeads]);

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
    color: "hsl(var(--card-foreground))",
  };

  const handleDateSelect = (day: Date | undefined) => {
    if (!day) return;
    if (selectingStart) {
      setCustomFrom(day);
      setCustomTo(undefined);
      setSelectingStart(false);
    } else {
      if (customFrom && day < customFrom) {
        setCustomTo(customFrom);
        setCustomFrom(day);
      } else {
        setCustomTo(day);
      }
      setSelectingStart(true);
      setCalendarOpen(false);
      setDatePreset("custom");
    }
  };

  const dateLabel = useMemo(() => {
    if (datePreset === "custom" && customFrom && customTo) {
      return `${format(customFrom, "dd/MM", { locale: ptBR })} - ${format(customTo, "dd/MM", { locale: ptBR })}`;
    }
    return datePresets.find((p) => p.value === datePreset)?.label || "Período";
  }, [datePreset, customFrom, customTo]);

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 overflow-y-auto h-full scrollbar-thin">
      {/* Header with filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-base md:text-lg font-semibold text-foreground">Dashboard</h1>
          <p className="text-xs md:text-sm text-muted-foreground">{currentExpert.name} · Admin Master</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Project Filter */}
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[150px] h-8 text-xs bg-card border-border">
              <SelectValue placeholder="Projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Projetos</SelectItem>
              {experts.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* SDR Filter */}
          <Select value={sdrFilter} onValueChange={setSdrFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs bg-card border-border">
              <SelectValue placeholder="SDR" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos SDRs</SelectItem>
              {sdrs.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Closer Filter */}
          <Select value={closerFilter} onValueChange={setCloserFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs bg-card border-border">
              <SelectValue placeholder="Closer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Closers</SelectItem>
              {closers.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs bg-card border-border gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                {dateLabel}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex">
                <div className="border-r border-border p-2 space-y-0.5 min-w-[140px]">
                  {datePresets.filter(p => p.value !== "custom").map((p) => (
                    <button
                      key={p.value}
                      onClick={() => { setDatePreset(p.value); setCalendarOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs hover:bg-muted transition-colors ${datePreset === p.value ? "bg-muted font-medium text-foreground" : "text-muted-foreground"}`}
                    >
                      {p.label}
                    </button>
                  ))}
                  <div className="border-t border-border my-1" />
                  <p className="px-3 py-1 text-[10px] text-muted-foreground uppercase tracking-wider">Personalizado</p>
                  {customFrom && (
                    <p className="px-3 text-[10px] text-muted-foreground">
                      {selectingStart ? "Selecione início" : `De: ${format(customFrom, "dd/MM/yy")}`}
                    </p>
                  )}
                  {!customFrom && (
                    <p className="px-3 text-[10px] text-muted-foreground">Selecione no calendário</p>
                  )}
                </div>
                <div className="p-2">
                  <Calendar
                    mode="single"
                    selected={selectingStart ? customFrom : customTo}
                    onSelect={handleDateSelect}
                    locale={ptBR}
                    className="pointer-events-auto"
                    modifiers={
                      customFrom && customTo
                        ? { range: { from: customFrom, to: customTo } }
                        : customFrom
                        ? { range: customFrom }
                        : {}
                    }
                    modifiersClassNames={{
                      range: "bg-primary/20 text-primary-foreground",
                    }}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Leads Hoje */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <PeriodComparison current={filteredLeads.length} previous={prevLeads.length} />
          </div>
          <p className="text-2xl font-bold text-card-foreground">{filteredLeads.length}</p>
          <p className="text-xs text-muted-foreground">Leads no Período</p>
          <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Instagram className="w-3 h-3 text-pink-400" />
              {filteredLeads.filter(l => l.channel === "instagram").length}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-emerald-400" />
              {filteredLeads.filter(l => l.channel === "whatsapp").length}
            </span>
          </div>
        </div>

        {/* Taxa de Conversão */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <PeriodComparison current={conversionRate} previous={prevConvRate} />
          </div>
          <p className="text-2xl font-bold text-card-foreground">{conversionRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
        </div>

        {/* Receita */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <PeriodComparison current={totalRevenue} previous={prevRevenue} />
          </div>
          <p className="text-2xl font-bold text-card-foreground">{currencyFormat(totalRevenue, currency)}</p>
          <p className="text-xs text-muted-foreground">Receita Período</p>
        </div>

        {/* Agendamentos */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarClock className="w-4 h-4 text-primary" />
            </div>
            <PeriodComparison current={appointments.length} previous={prevAppointments.length} />
          </div>
          <p className="text-2xl font-bold text-card-foreground">{appointments.length}</p>
          <p className="text-xs text-muted-foreground">Agendamentos</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {filteredLeads.length > 0 ? ((appointments.length / filteredLeads.length) * 100).toFixed(1) : 0}% dos leads
          </p>
        </div>

        {/* Taxa de Comparecimento */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4 text-primary" />
            </div>
            <PeriodComparison current={attendanceRate} previous={prevAttendanceRate} />
          </div>
          <p className="text-2xl font-bold text-card-foreground">{attendanceRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Taxa Comparecimento</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {appointmentsAttended} de {appointments.length} calls
          </p>
        </div>

        {/* Tempo Médio de Resposta */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <PeriodComparison current={avgResponseMin} previous={prevAvgResponse} />
          </div>
          <p className="text-2xl font-bold text-card-foreground">{formatResponseTime(avgResponseMin)}</p>
          <p className="text-xs text-muted-foreground">Tempo Médio Resposta</p>
          <p className="text-[10px] text-muted-foreground mt-1">Horário comercial 08-18h</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leads per day */}
        <div className="lg:col-span-2 p-4 md:p-5 rounded-xl bg-card border border-border">
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
        <div className="p-4 md:p-5 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Funil de Conversão</h3>
          <div className="space-y-2.5">
            {funnelData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-xs text-muted-foreground flex-1">{item.name}</span>
                <span className="text-xs font-medium text-foreground">{item.value}</span>
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(item.value / maxFunnel) * 100}%`, backgroundColor: item.fill }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SDR Performance Panel */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">Performance SDRs</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["SDR", "Contatos", "Agendamentos", "Comparecimentos", "Taxa Comp.", "Vendas", "Receita", "Conversão"].map((h) => (
                  <th key={h} className="text-left text-[10px] uppercase tracking-wider text-muted-foreground pb-2 px-2 first:pl-0">{h}</th>
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
                  <td className="py-2.5 text-sm font-medium text-foreground px-2">{sdr.vendas}</td>
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

      {/* Closer Performance Panel */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">Performance Closers</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Closer", "Calls Agend.", "Calls Realiz.", "Propostas", "Vendas", "Receita", "Ticket Médio", "Conversão"].map((h) => (
                  <th key={h} className="text-left text-[10px] uppercase tracking-wider text-muted-foreground pb-2 px-2 first:pl-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {closerPerformance.map((c) => (
                <tr key={c.name} className="border-b border-border/50">
                  <td className="py-2.5 text-sm font-medium text-foreground">{c.name}</td>
                  <td className="py-2.5 text-sm text-muted-foreground px-2">{c.calls}</td>
                  <td className="py-2.5 text-sm text-muted-foreground px-2">{c.realizadas}</td>
                  <td className="py-2.5 text-sm text-muted-foreground px-2">{c.propostas}</td>
                  <td className="py-2.5 text-sm font-medium text-foreground px-2">{c.vendas}</td>
                  <td className="py-2.5 text-sm font-medium text-foreground px-2">{currencyFormat(c.receita, currency)}</td>
                  <td className="py-2.5 text-sm font-medium text-foreground px-2">
                    {c.vendas > 0 ? currencyFormat(c.receita / c.vendas, currency) : "-"}
                  </td>
                  <td className="py-2.5 text-sm font-medium text-foreground px-2">
                    {c.calls > 0 ? ((c.vendas / c.calls) * 100).toFixed(1) : 0}%
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
