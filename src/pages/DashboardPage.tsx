import { useExpert } from "@/contexts/ExpertContext";
import { TrendingUp, Users, Target, DollarSign, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const leadsPerDay = [
  { day: "Seg", leads: 12 },
  { day: "Ter", leads: 19 },
  { day: "Qua", leads: 8 },
  { day: "Qui", leads: 22 },
  { day: "Sex", leads: 31 },
  { day: "Sab", leads: 14 },
  { day: "Dom", leads: 7 },
];

const funnelData = [
  { name: "Lead Novo", value: 120, fill: "hsl(205, 80%, 50%)" },
  { name: "Contato", value: 85, fill: "hsl(175, 80%, 36%)" },
  { name: "Qualificação", value: 52, fill: "hsl(38, 92%, 50%)" },
  { name: "Agendamento", value: 30, fill: "hsl(280, 65%, 55%)" },
  { name: "Proposta", value: 18, fill: "hsl(340, 75%, 55%)" },
  { name: "Fechado", value: 12, fill: "hsl(152, 69%, 40%)" },
];

const revenueData = [
  { month: "Jan", value: 18000 },
  { month: "Fev", value: 32000 },
  { month: "Mar", value: 45000 },
];

const sdrPerformance = [
  { name: "Carlos", contatos: 45, agendamentos: 18, vendas: 8 },
  { name: "Ana", contatos: 52, agendamentos: 22, vendas: 11 },
  { name: "Pedro", contatos: 38, agendamentos: 12, vendas: 5 },
];

export default function DashboardPage() {
  const { currentExpert } = useExpert();

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full scrollbar-thin">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{currentExpert.name} · Visão Geral</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Leads Hoje", value: "31", change: "+18%", up: true, icon: Users },
          { label: "Taxa de Conversão", value: "10.2%", change: "+2.1%", up: true, icon: Target },
          { label: "Vendas do Mês", value: "R$ 45.200", change: "+24%", up: true, icon: DollarSign },
          { label: "Tempo Médio", value: "4.2 dias", change: "-12%", up: false, icon: Clock },
        ].map((kpi) => (
          <div key={kpi.label} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <kpi.icon className="w-4 h-4 text-primary" />
              </div>
              <div className={`flex items-center gap-0.5 text-xs font-medium ${kpi.up ? "text-success" : "text-destructive"}`}>
                {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-card-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Leads per day */}
        <div className="col-span-2 p-5 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Leads por Dia</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={leadsPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Funnel */}
        <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Funil de Conversão</h3>
          <div className="space-y-2">
            {funnelData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-xs text-muted-foreground flex-1">{item.name}</span>
                <span className="text-xs font-medium text-foreground">{item.value}</span>
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(item.value / funnelData[0].value) * 100}%`, backgroundColor: item.fill }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Revenue */}
        <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Receita</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* SDR Performance */}
        <div className="col-span-2 p-5 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Performance SDRs</h3>
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground pb-2">SDR</th>
                  <th className="text-center text-[10px] uppercase tracking-wider text-muted-foreground pb-2">Contatos</th>
                  <th className="text-center text-[10px] uppercase tracking-wider text-muted-foreground pb-2">Agendamentos</th>
                  <th className="text-center text-[10px] uppercase tracking-wider text-muted-foreground pb-2">Vendas</th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-muted-foreground pb-2">Conversão</th>
                </tr>
              </thead>
              <tbody>
                {sdrPerformance.map((sdr) => (
                  <tr key={sdr.name} className="border-b border-border/50">
                    <td className="py-2.5 text-sm font-medium text-foreground">{sdr.name}</td>
                    <td className="py-2.5 text-sm text-center text-muted-foreground">{sdr.contatos}</td>
                    <td className="py-2.5 text-sm text-center text-muted-foreground">{sdr.agendamentos}</td>
                    <td className="py-2.5 text-sm text-center font-medium text-success">{sdr.vendas}</td>
                    <td className="py-2.5 text-sm text-right font-medium text-foreground">
                      {((sdr.vendas / sdr.contatos) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
