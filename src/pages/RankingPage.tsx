import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, TrendingUp, MessageSquare, Calendar, Phone, DollarSign, Target, Award } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { RankingTable } from "@/components/ranking/RankingTable";
import { SectionCard } from "@/components/ranking/SectionCard";
import { TopThreePodium } from "@/components/ranking/TopThreePodium";

type Period = "today" | "7d" | "30d" | "90d";

const periodLabels: Record<Period, string> = {
  today: "Hoje",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
};

function getPeriodRange(period: Period) {
  const end = endOfDay(new Date());
  const start = period === "today" ? startOfDay(new Date()) : startOfDay(subDays(new Date(), parseInt(period)));
  return { start: start.toISOString(), end: end.toISOString() };
}

function useRankingData(projectId: string | undefined, period: Period) {
  const range = getPeriodRange(period);

  const leads = useQuery({
    queryKey: ["ranking-leads", projectId, period],
    queryFn: async () => {
      if (!projectId) return [];
      const { data } = await supabase
        .from("leads")
        .select("id, name, sdr_id, closer_id, consultation_done, sale_status, value_estimate, scheduling_date, created_at, source, channel")
        .eq("project_id", projectId)
        .gte("created_at", range.start)
        .lte("created_at", range.end);
      return data || [];
    },
    enabled: !!projectId,
  });

  const messages = useQuery({
    queryKey: ["ranking-messages", projectId, period],
    queryFn: async () => {
      if (!projectId) return [];
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, direction, channel, lead_id, created_at")
        .in("lead_id", (leads.data || []).map(l => l.id))
        .gte("created_at", range.start)
        .lte("created_at", range.end);
      return data || [];
    },
    enabled: !!projectId && !!leads.data?.length,
  });

  const profiles = useQuery({
    queryKey: ["ranking-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, avatar_url");
      return data || [];
    },
  });

  const roles = useQuery({
    queryKey: ["ranking-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, role");
      return data || [];
    },
  });

  return { leads: leads.data || [], messages: messages.data || [], profiles: profiles.data || [], roles: roles.data || [], isLoading: leads.isLoading || profiles.isLoading || roles.isLoading };
}

function getUserName(profiles: { user_id: string; full_name: string }[], userId: string) {
  return profiles.find(p => p.user_id === userId)?.full_name || "—";
}

function getAvatarUrl(profiles: { user_id: string; avatar_url?: string | null }[], userId: string) {
  return profiles.find(p => p.user_id === userId)?.avatar_url || null;
}

function pct(a: number, b: number) {
  if (b === 0) return "0%";
  return `${((a / b) * 100).toFixed(1)}%`;
}

function currency(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

// --- SDR Tab ---

function SDRRanking({ projectId, period }: { projectId: string | undefined; period: Period }) {
  const { leads, messages, profiles, roles, isLoading } = useRankingData(projectId, period);

  const sdrUsers = useMemo(() => roles.filter(r => r.role === "sdr").map(r => r.user_id), [roles]);

  const sdrStats = useMemo(() => {
    return sdrUsers.map(userId => {
      const sdrLeads = leads.filter(l => l.sdr_id === userId);
      const callsAgendadas = sdrLeads.filter(l => l.scheduling_date).length;
      const callsRealizadas = sdrLeads.filter(l => l.consultation_done).length;
      const vendas = sdrLeads.filter(l => l.sale_status === "sold").length;
      const receita = sdrLeads.filter(l => l.sale_status === "sold").reduce((s, l) => s + (Number(l.value_estimate) || 0), 0);
      const sdrMessages = messages.filter(m => m.sender_id === userId);
      const disparosIG = sdrMessages.filter(m => m.direction === "outbound" && m.channel === "instagram").length;
      const disparosWA = sdrMessages.filter(m => m.direction === "outbound" && m.channel === "whatsapp").length;
      const totalDisparos = disparosIG + disparosWA;
      const retornos = messages.filter(m => m.direction === "inbound" && sdrLeads.some(l => l.id === m.lead_id)).length;
      const agendamentos = callsAgendadas;

      // Instagram-specific metrics
      const igInbound = messages.filter(m => m.direction === "inbound" && m.channel === "instagram" && sdrLeads.some(l => l.id === m.lead_id)).length;
      const igOutbound = sdrMessages.filter(m => m.direction === "outbound" && m.channel === "instagram").length;

      // Calculate avg response time for Instagram (outbound replies after inbound)
      const sdrLeadIds = new Set(sdrLeads.map(l => l.id));
      const igMsgs = messages
        .filter(m => m.channel === "instagram" && sdrLeadIds.has(m.lead_id))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      let totalResponseMs = 0;
      let responseCount = 0;
      for (let i = 1; i < igMsgs.length; i++) {
        if (igMsgs[i].direction === "outbound" && igMsgs[i - 1].direction === "inbound" && igMsgs[i].lead_id === igMsgs[i - 1].lead_id) {
          totalResponseMs += new Date(igMsgs[i].created_at).getTime() - new Date(igMsgs[i - 1].created_at).getTime();
          responseCount++;
        }
      }
      const avgResponseMin = responseCount > 0 ? Math.round(totalResponseMs / responseCount / 60000) : 0;
      const avgResponseFmt = responseCount > 0 ? (avgResponseMin < 60 ? `${avgResponseMin}min` : `${Math.round(avgResponseMin / 60)}h${avgResponseMin % 60}min`) : "—";

      return {
        userId,
        name: getUserName(profiles, userId),
        avatarUrl: getAvatarUrl(profiles, userId),
        callsRealizadas,
        callsAgendadas,
        vendas,
        receita,
        disparosIG,
        disparosWA,
        totalDisparos,
        retornos,
        agendamentos,
        igInbound,
        igOutbound,
        avgResponseMin,
        avgResponseFmt,
        taxaRealizacao: pct(callsRealizadas, callsAgendadas),
        taxaConversao: pct(vendas, callsRealizadas),
        taxaResposta: pct(retornos, totalDisparos),
        taxaAgendamento: pct(agendamentos, retornos),
        taxaComparecimento: pct(callsRealizadas, callsAgendadas),
        ticketMedio: vendas > 0 ? receita / vendas : 0,
      };
    }).sort((a, b) => b.callsRealizadas - a.callsRealizadas || b.vendas - a.vendas);
  }, [sdrUsers, leads, messages, profiles]);

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Carregando...</div>;

  return (
    <div className="space-y-6">
      {/* Podium Top 3 */}
      <TopThreePodium
        title="🏆 Top 3 SDRs — Calls Realizadas & Vendas"
        entries={sdrStats.slice(0, 3).map(s => ({
          name: s.name,
          avatarUrl: s.avatarUrl,
          mainValue: String(s.callsRealizadas),
          mainLabel: "Calls Realizadas",
          secondaryValue: String(s.vendas),
          secondaryLabel: "vendas",
        }))}
      />

      {/* Principal Table */}
      <SectionCard title="Ranking Principal — Calls Agendadas → Realizadas → Vendas → Receita" icon={<Trophy className="w-4 h-4 text-yellow-500" />}>
        <RankingTable
          columns={[
            { key: "position", label: "#" },
            { key: "name", label: "SDR" },
            { key: "callsAgendadas", label: "Calls Agendadas", icon: <Calendar className="w-3.5 h-3.5 text-purple-500" /> },
            { key: "callsRealizadas", label: "Calls Realizadas", icon: <Phone className="w-3.5 h-3.5 text-primary" /> },
            { key: "taxaRealizacao", label: "% Realização" },
            { key: "vendas", label: "Vendas", icon: <DollarSign className="w-3.5 h-3.5 text-green-500" /> },
            { key: "taxaConversao", label: "% Conversão" },
            { key: "receitaFmt", label: "Receita", icon: <TrendingUp className="w-3.5 h-3.5 text-primary" /> },
            { key: "ticketMedioFmt", label: "Ticket Médio" },
          ]}
          data={sdrStats.map(s => ({ ...s, receitaFmt: currency(s.receita), ticketMedioFmt: currency(s.ticketMedio) }))}
        />
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Volume de Disparos" icon={<MessageSquare className="w-4 h-4 text-blue-500" />}>
          <RankingTable
            columns={[
              { key: "position", label: "#" },
              { key: "name", label: "SDR" },
              { key: "disparosIG", label: "Instagram" },
              { key: "disparosWA", label: "WhatsApp" },
              { key: "totalDisparos", label: "Total" },
            ]}
            data={[...sdrStats].sort((a, b) => b.totalDisparos - a.totalDisparos)}
          />
        </SectionCard>

        <SectionCard title="Retornos" icon={<TrendingUp className="w-4 h-4 text-green-500" />}>
          <RankingTable
            columns={[
              { key: "position", label: "#" },
              { key: "name", label: "SDR" },
              { key: "totalDisparos", label: "Disparos" },
              { key: "retornos", label: "Retornos" },
              { key: "taxaResposta", label: "Taxa" },
            ]}
            data={[...sdrStats].sort((a, b) => b.retornos - a.retornos)}
          />
        </SectionCard>

        <SectionCard title="Agendamentos" icon={<Calendar className="w-4 h-4 text-purple-500" />}>
          <RankingTable
            columns={[
              { key: "position", label: "#" },
              { key: "name", label: "SDR" },
              { key: "retornos", label: "Retornos" },
              { key: "agendamentos", label: "Agendamentos" },
              { key: "taxaAgendamento", label: "Taxa" },
            ]}
            data={[...sdrStats].sort((a, b) => b.agendamentos - a.agendamentos)}
          />
        </SectionCard>

        <SectionCard title="Comparecimento" icon={<Phone className="w-4 h-4 text-red-500" />}>
          <RankingTable
            columns={[
              { key: "position", label: "#" },
              { key: "name", label: "SDR" },
              { key: "callsAgendadas", label: "Agendadas" },
              { key: "callsRealizadas", label: "Realizadas" },
              { key: "taxaComparecimento", label: "Taxa" },
            ]}
            data={[...sdrStats].sort((a, b) => b.callsRealizadas - a.callsRealizadas)}
          />
        </SectionCard>
      </div>
    </div>
  );
}

// --- Closer Tab ---

function CloserRanking({ projectId, period }: { projectId: string | undefined; period: Period }) {
  const { leads, profiles, roles, isLoading } = useRankingData(projectId, period);

  const closerUsers = useMemo(() => roles.filter(r => r.role === "closer").map(r => r.user_id), [roles]);

  const closerStats = useMemo(() => {
    return closerUsers.map(userId => {
      const closerLeads = leads.filter(l => l.closer_id === userId);
      const callsRealizadas = closerLeads.filter(l => l.consultation_done).length;
      const vendas = closerLeads.filter(l => l.sale_status === "sold").length;
      const faturamento = closerLeads.filter(l => l.sale_status === "sold").reduce((s, l) => s + (Number(l.value_estimate) || 0), 0);
      const ticketMedio = vendas > 0 ? faturamento / vendas : 0;

      return {
        userId,
        name: getUserName(profiles, userId),
        avatarUrl: getAvatarUrl(profiles, userId),
        callsRealizadas,
        vendas,
        faturamento,
        faturamentoFmt: currency(faturamento),
        ticketMedio,
        ticketMedioFmt: currency(ticketMedio),
        taxaConversao: pct(vendas, callsRealizadas),
      };
    }).sort((a, b) => b.faturamento - a.faturamento || b.vendas - a.vendas);
  }, [closerUsers, leads, profiles]);

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Carregando...</div>;

  return (
    <div className="space-y-6">
      {/* Podium Top 3 */}
      <TopThreePodium
        title="🏆 Top 3 Closers — Faturamento & Conversão"
        entries={closerStats.slice(0, 3).map(s => ({
          name: s.name,
          avatarUrl: s.avatarUrl,
          mainValue: s.faturamentoFmt,
          mainLabel: "Faturamento",
          secondaryValue: s.taxaConversao,
          secondaryLabel: "conversão",
        }))}
      />

      {/* Principal */}
      <SectionCard title="Ranking Principal — Faturamento & Conversão" icon={<Trophy className="w-4 h-4 text-yellow-500" />}>
        <RankingTable
          columns={[
            { key: "position", label: "#" },
            { key: "name", label: "Closer" },
            { key: "callsRealizadas", label: "Calls Realizadas", icon: <Phone className="w-3.5 h-3.5 text-primary" /> },
            { key: "vendas", label: "Vendas", icon: <DollarSign className="w-3.5 h-3.5 text-green-500" /> },
            { key: "faturamentoFmt", label: "Faturamento", icon: <TrendingUp className="w-3.5 h-3.5 text-primary" /> },
            { key: "ticketMedioFmt", label: "Ticket Médio" },
            { key: "taxaConversao", label: "Conversão", icon: <Target className="w-3.5 h-3.5 text-orange-500" /> },
          ]}
          data={closerStats}
        />
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Faturamento" icon={<DollarSign className="w-4 h-4 text-green-500" />}>
          <RankingTable
            columns={[
              { key: "position", label: "#" },
              { key: "name", label: "Closer" },
              { key: "faturamentoFmt", label: "Faturamento" },
              { key: "vendas", label: "Vendas" },
              { key: "ticketMedioFmt", label: "Ticket Médio" },
            ]}
            data={[...closerStats].sort((a, b) => b.faturamento - a.faturamento)}
          />
        </SectionCard>

        <SectionCard title="Conversão" icon={<Target className="w-4 h-4 text-orange-500" />}>
          <RankingTable
            columns={[
              { key: "position", label: "#" },
              { key: "name", label: "Closer" },
              { key: "callsRealizadas", label: "Calls" },
              { key: "vendas", label: "Vendas" },
              { key: "taxaConversao", label: "Conversão" },
            ]}
            data={[...closerStats].sort((a, b) => {
              const aRate = a.callsRealizadas > 0 ? a.vendas / a.callsRealizadas : 0;
              const bRate = b.callsRealizadas > 0 ? b.vendas / b.callsRealizadas : 0;
              return bRate - aRate;
            })}
          />
        </SectionCard>

        <SectionCard title="Volume de Vendas" icon={<Award className="w-4 h-4 text-blue-500" />}>
          <RankingTable
            columns={[
              { key: "position", label: "#" },
              { key: "name", label: "Closer" },
              { key: "vendas", label: "Vendas" },
              { key: "faturamentoFmt", label: "Faturamento" },
            ]}
            data={[...closerStats].sort((a, b) => b.vendas - a.vendas)}
          />
        </SectionCard>

        <SectionCard title="Ticket Médio" icon={<TrendingUp className="w-4 h-4 text-purple-500" />}>
          <RankingTable
            columns={[
              { key: "position", label: "#" },
              { key: "name", label: "Closer" },
              { key: "ticketMedioFmt", label: "Ticket Médio" },
              { key: "vendas", label: "Vendas" },
              { key: "faturamentoFmt", label: "Faturamento" },
            ]}
            data={[...closerStats].sort((a, b) => b.ticketMedio - a.ticketMedio)}
          />
        </SectionCard>
      </div>
    </div>
  );
}

// --- Page ---

export default function RankingPage() {
  const { currentProject } = useProject();
  const [period, setPeriod] = useState<Period>("30d");

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Ranking
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Performance do time de vendas</p>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(periodLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="sdr" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="sdr" className="flex-1 sm:flex-none">Ranking SDR</TabsTrigger>
            <TabsTrigger value="closer" className="flex-1 sm:flex-none">Ranking Closers</TabsTrigger>
          </TabsList>
          <TabsContent value="sdr">
            <SDRRanking projectId={currentProject?.id} period={period} />
          </TabsContent>
          <TabsContent value="closer">
            <CloserRanking projectId={currentProject?.id} period={period} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
