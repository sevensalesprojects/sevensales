import { useState, useMemo } from "react";
import { useExpert } from "@/contexts/ExpertContext";
import { mockLeads } from "@/data/mockData";
import {
  Phone, PhoneCall, Percent, FileText, DollarSign, TrendingUp,
  Users, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const TODAY = "2026-03-05";

type Currency = "BRL" | "USD";

const currencyFormat = (value: number, currency: Currency) => {
  const symbol = currency === "BRL" ? "R$" : "$";
  const rate = currency === "USD" ? 0.18 : 1;
  const converted = value * rate;
  return `${symbol} ${converted.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function ClosersPage() {
  const { currentExpert } = useExpert();
  const [closerFilter, setCloserFilter] = useState("all");
  const [currency, setCurrency] = useState<Currency>("BRL");

  const closers = useMemo(() => {
    const set = new Set(mockLeads.map((l) => l.closer).filter(Boolean));
    return Array.from(set) as string[];
  }, []);

  const filteredLeads = useMemo(() => {
    return mockLeads.filter((l) => {
      if (closerFilter !== "all" && l.closer !== closerFilter) return false;
      return true;
    });
  }, [closerFilter]);

  const leadsWithAppointment = filteredLeads.filter((l) => l.hasAppointment);
  const callsRealized = leadsWithAppointment.filter((l) => l.appointmentAttended).length;
  const attendanceRate = leadsWithAppointment.length > 0
    ? ((callsRealized / leadsWithAppointment.length) * 100).toFixed(1) : "0";
  const closed = filteredLeads.filter((l) => l.stage === "s6");
  const totalRevenue = closed.reduce((sum, l) => sum + (l.value || 0), 0);
  const ticketMedio = closed.length > 0 ? totalRevenue / closed.length : 0;
  const conversionRate = leadsWithAppointment.length > 0
    ? ((closed.length / leadsWithAppointment.length) * 100).toFixed(1) : "0";

  // Performance per closer
  const closerPerformance = useMemo(() => {
    const map: Record<string, { calls: number; realizadas: number; vendas: number; receita: number; propostas: number }> = {};
    filteredLeads.forEach((l) => {
      const c = l.closer || "Sem closer";
      if (!map[c]) map[c] = { calls: 0, realizadas: 0, vendas: 0, receita: 0, propostas: 0 };
      if (l.hasAppointment) {
        map[c].calls++;
        if (l.appointmentAttended) map[c].realizadas++;
      }
      if (["s5", "s6"].includes(l.stage)) map[c].propostas++;
      if (l.stage === "s6") {
        map[c].vendas++;
        map[c].receita += l.value || 0;
      }
    });
    return Object.entries(map).map(([name, d]) => ({ name, ...d }));
  }, [filteredLeads]);

  // Lead origin by SDR
  const sdrOrigin = useMemo(() => {
    const map: Record<string, { enviados: number; callsRealizadas: number; vendas: number; receita: number }> = {};
    filteredLeads.forEach((l) => {
      if (!map[l.sdr]) map[l.sdr] = { enviados: 0, callsRealizadas: 0, vendas: 0, receita: 0 };
      if (l.hasAppointment) {
        map[l.sdr].enviados++;
        if (l.appointmentAttended) map[l.sdr].callsRealizadas++;
      }
      if (l.stage === "s6") {
        map[l.sdr].vendas++;
        map[l.sdr].receita += l.value || 0;
      }
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

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full scrollbar-thin">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Closers</h1>
          <p className="text-sm text-muted-foreground">{currentExpert.name} · Gestão Comercial</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={closerFilter} onValueChange={setCloserFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-card border-border">
              <SelectValue placeholder="Closer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Closers</SelectItem>
              {closers.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <KPICard icon={Phone} label="Calls Agendadas" value={leadsWithAppointment.length} />
        <KPICard icon={PhoneCall} label="Calls Realizadas" value={callsRealized} />
        <KPICard icon={Percent} label="Taxa Comparecimento" value={`${attendanceRate}%`} />
        <KPICard icon={FileText} label="Propostas" value={filteredLeads.filter(l => ["s5","s6"].includes(l.stage)).length} />
        <KPICard icon={DollarSign} label="Receita" value={currencyFormat(totalRevenue, currency)} />
        <KPICard icon={TrendingUp} label="Ticket Médio" value={currencyFormat(ticketMedio, currency)} />
      </div>

      {/* Closer Performance */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">Ranking de Closers</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Closer", "Calls Agend.", "Calls Realiz.", "Propostas", "Vendas", "Receita", "Conversão"].map((h) => (
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
                    {c.calls > 0 ? ((c.vendas / c.calls) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Origem dos Leads (SDR quality) */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">Qualidade dos Leads por SDR</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["SDR", "Leads Enviados", "Calls Realizadas", "Vendas", "Receita", "Conversão"].map((h) => (
                  <th key={h} className="text-left text-[10px] uppercase tracking-wider text-muted-foreground pb-2 px-2 first:pl-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sdrOrigin.map((s) => (
                <tr key={s.name} className="border-b border-border/50">
                  <td className="py-2.5 text-sm font-medium text-foreground">{s.name}</td>
                  <td className="py-2.5 text-sm text-muted-foreground px-2">{s.enviados}</td>
                  <td className="py-2.5 text-sm text-muted-foreground px-2">{s.callsRealizadas}</td>
                  <td className="py-2.5 text-sm font-medium text-foreground px-2">{s.vendas}</td>
                  <td className="py-2.5 text-sm font-medium text-foreground px-2">{currencyFormat(s.receita, currency)}</td>
                  <td className="py-2.5 text-sm font-medium text-foreground px-2">
                    {s.enviados > 0 ? ((s.vendas / s.enviados) * 100).toFixed(1) : 0}%
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

function KPICard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <p className="text-2xl font-bold text-card-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
