import { useState } from "react";
import { useExpert } from "@/contexts/ExpertContext";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Search, MoreHorizontal, Phone, Mail, BarChart3,
  Users, Calendar, Trophy, TrendingUp, Target, CheckCircle2,
} from "lucide-react";

interface SDR {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  expertId: string;
  status: "active" | "inactive";
  metrics: {
    leadsAtribuidos: number;
    contatosRealizados: number;
    agendamentos: number;
    reunioes: number;
    vendas: number;
    taxaConversao: number;
    receita: number;
  };
}

const mockSDRs: SDR[] = [
  {
    id: "sdr1", name: "Carlos Mendes", initials: "CM", email: "carlos@vendaflow.com", phone: "(11) 99999-0001", expertId: "1", status: "active",
    metrics: { leadsAtribuidos: 48, contatosRealizados: 156, agendamentos: 32, reunioes: 28, vendas: 12, taxaConversao: 25, receita: 42000 },
  },
  {
    id: "sdr2", name: "Ana Rodrigues", initials: "AR", email: "ana@vendaflow.com", phone: "(21) 99999-0002", expertId: "1", status: "active",
    metrics: { leadsAtribuidos: 52, contatosRealizados: 189, agendamentos: 41, reunioes: 35, vendas: 18, taxaConversao: 34.6, receita: 67500 },
  },
  {
    id: "sdr3", name: "Roberto Lima", initials: "RL", email: "roberto@vendaflow.com", phone: "(31) 99999-0003", expertId: "2", status: "active",
    metrics: { leadsAtribuidos: 35, contatosRealizados: 120, agendamentos: 22, reunioes: 18, vendas: 8, taxaConversao: 22.8, receita: 28000 },
  },
  {
    id: "sdr4", name: "Juliana Costa", initials: "JC", email: "juliana@vendaflow.com", phone: "(41) 99999-0004", expertId: "1", status: "inactive",
    metrics: { leadsAtribuidos: 0, contatosRealizados: 95, agendamentos: 15, reunioes: 12, vendas: 5, taxaConversao: 33.3, receita: 18500 },
  },
];

export default function SDRsPage() {
  const { currentExpert } = useExpert();
  const [selectedSDR, setSelectedSDR] = useState<SDR | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = mockSDRs.filter((s) => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const ranking = [...mockSDRs].filter((s) => s.status === "active").sort((a, b) => b.metrics.vendas - a.metrics.vendas);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-foreground">SDRs</h1>
          <p className="text-sm text-muted-foreground">Gestão da equipe comercial · {mockSDRs.filter((s) => s.status === "active").length} ativos</p>
        </div>
        <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
          <Plus className="w-3.5 h-3.5" />
          Novo SDR
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total SDRs", value: mockSDRs.length.toString(), icon: Users, color: "text-primary" },
            { label: "Contatos Hoje", value: "45", icon: Phone, color: "text-info" },
            { label: "Agendamentos", value: "12", icon: Calendar, color: "text-warning" },
            { label: "Vendas no Mês", value: "43", icon: Trophy, color: "text-success" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Ranking */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Trophy className="w-4 h-4 text-warning" />
              Ranking de SDRs
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">#</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">SDR</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Contatos</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Agendamentos</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Reuniões</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Vendas</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Conversão</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Receita</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((sdr, i) => (
                <tr key={sdr.id} onClick={() => setSelectedSDR(sdr)} className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-warning/20 text-warning" : i === 1 ? "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground"}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">{sdr.initials}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{sdr.name}</p>
                        <p className="text-[10px] text-muted-foreground">{sdr.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-foreground">{sdr.metrics.contatosRealizados}</td>
                  <td className="px-4 py-3 text-center text-foreground">{sdr.metrics.agendamentos}</td>
                  <td className="px-4 py-3 text-center text-foreground">{sdr.metrics.reunioes}</td>
                  <td className="px-4 py-3 text-center font-semibold text-foreground">{sdr.metrics.vendas}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sdr.metrics.taxaConversao >= 30 ? "bg-success/15 text-success" : sdr.metrics.taxaConversao >= 20 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"}`}>
                      {sdr.metrics.taxaConversao}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">R$ {sdr.metrics.receita.toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SDR List */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Todos os SDRs</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-48 rounded-md border border-input bg-muted/50 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((sdr) => (
              <div key={sdr.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedSDR(sdr)}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">{sdr.initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{sdr.name}</p>
                    <p className="text-xs text-muted-foreground">{sdr.email} · {sdr.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{sdr.metrics.leadsAtribuidos} leads</p>
                    <p className="text-[10px] text-muted-foreground">{sdr.metrics.vendas} vendas</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sdr.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {sdr.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
