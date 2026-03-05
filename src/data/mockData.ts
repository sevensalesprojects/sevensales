export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  instagram?: string;
  origin: string;
  channel: "instagram" | "whatsapp" | "youtube" | "trafego_pago" | "indicacao" | "outro";
  tags: string[];
  sdr: string;
  closer?: string;
  stage: string;
  funnelId: string;
  lastInteraction: string;
  createdAt: string;
  value?: number;
  hasAppointment?: boolean;
  appointmentDate?: string;
  appointmentAttended?: boolean;
  responseTimeMinutes?: number; // tempo de resposta em minutos (horário comercial)
}

export interface FunnelStage {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface Funnel {
  id: string;
  name: string;
  expertId: string;
  stages: FunnelStage[];
}

export const defaultStages: FunnelStage[] = [
  { id: "s1", name: "Lead Novo", color: "hsl(var(--info))", order: 0 },
  { id: "s2", name: "Contato Iniciado", color: "hsl(var(--primary))", order: 1 },
  { id: "s3", name: "Qualificação", color: "hsl(var(--warning))", order: 2 },
  { id: "s4", name: "Agendamento", color: "hsl(var(--chart-4))", order: 3 },
  { id: "s5", name: "Proposta", color: "hsl(var(--chart-5))", order: 4 },
  { id: "s6", name: "Fechado", color: "hsl(var(--success))", order: 5 },
];

export const closerStages: FunnelStage[] = [
  { id: "c1", name: "Call Agendada", color: "hsl(var(--info))", order: 0 },
  { id: "c2", name: "Call Realizada", color: "hsl(var(--primary))", order: 1 },
  { id: "c3", name: "Proposta Enviada", color: "hsl(var(--warning))", order: 2 },
  { id: "c4", name: "Follow-up", color: "hsl(var(--chart-4))", order: 3 },
  { id: "c5", name: "Negociação", color: "hsl(var(--chart-5))", order: 4 },
  { id: "c6", name: "Fechado", color: "hsl(var(--success))", order: 5 },
  { id: "c7", name: "Perdido", color: "hsl(var(--destructive))", order: 6 },
];

export const mockLeads: Lead[] = [
  { id: "l1", name: "Maria Silva", email: "maria@email.com", phone: "(11) 99999-1111", origin: "Instagram Orgânico", channel: "instagram", tags: ["quente", "instagram"], sdr: "Carlos", closer: "Ricardo", stage: "s1", funnelId: "f1", lastInteraction: "Há 2h", createdAt: "2026-03-05", value: 2500, responseTimeMinutes: 12 },
  { id: "l2", name: "João Oliveira", email: "joao@email.com", phone: "(21) 98888-2222", origin: "Tráfego Pago", channel: "whatsapp", tags: ["morno", "facebook-ads"], sdr: "Ana", closer: "Marcos", stage: "s1", funnelId: "f1", lastInteraction: "Há 5h", createdAt: "2026-03-05", value: 4000, responseTimeMinutes: 45 },
  { id: "l3", name: "Ana Costa", email: "ana@email.com", phone: "(31) 97777-3333", origin: "YouTube", channel: "instagram", tags: ["quente", "youtube"], sdr: "Carlos", closer: "Ricardo", stage: "s2", funnelId: "f1", lastInteraction: "Há 1d", createdAt: "2026-03-04", value: 1500, responseTimeMinutes: 8 },
  { id: "l4", name: "Pedro Santos", email: "pedro@email.com", phone: "(41) 96666-4444", origin: "WhatsApp", channel: "whatsapp", tags: ["frio"], sdr: "Ana", closer: "Marcos", stage: "s2", funnelId: "f1", lastInteraction: "Há 3h", createdAt: "2026-03-05", value: undefined, hasAppointment: true, appointmentDate: "2026-03-05", appointmentAttended: true, responseTimeMinutes: 22 },
  { id: "l5", name: "Lucas Ferreira", email: "lucas@email.com", phone: "(51) 95555-5555", origin: "Indicação", channel: "whatsapp", tags: ["quente", "indicação"], sdr: "Carlos", closer: "Ricardo", stage: "s3", funnelId: "f1", lastInteraction: "Há 30min", createdAt: "2026-03-04", value: 6000, hasAppointment: true, appointmentDate: "2026-03-04", appointmentAttended: true, responseTimeMinutes: 5 },
  { id: "l6", name: "Carla Mendes", email: "carla@email.com", phone: "(61) 94444-6666", origin: "Tráfego Pago", channel: "instagram", tags: ["morno"], sdr: "Ana", closer: "Marcos", stage: "s3", funnelId: "f1", lastInteraction: "Há 1h", createdAt: "2026-03-03", value: 3000, hasAppointment: true, appointmentDate: "2026-03-03", appointmentAttended: false, responseTimeMinutes: 67 },
  { id: "l7", name: "Rafael Lima", email: "rafael@email.com", phone: "(71) 93333-7777", origin: "Instagram Orgânico", channel: "instagram", tags: ["quente"], sdr: "Carlos", closer: "Ricardo", stage: "s4", funnelId: "f1", lastInteraction: "Há 2d", createdAt: "2026-03-02", value: 5000, hasAppointment: true, appointmentDate: "2026-03-02", appointmentAttended: true, responseTimeMinutes: 15 },
  { id: "l8", name: "Juliana Rocha", email: "juliana@email.com", phone: "(81) 92222-8888", origin: "YouTube", channel: "whatsapp", tags: ["quente", "vip"], sdr: "Ana", closer: "Ricardo", stage: "s5", funnelId: "f1", lastInteraction: "Há 4h", createdAt: "2026-03-01", value: 12000, hasAppointment: true, appointmentDate: "2026-03-01", appointmentAttended: true, responseTimeMinutes: 3 },
  { id: "l9", name: "Bruno Almeida", email: "bruno@email.com", phone: "(91) 91111-9999", origin: "Tráfego Pago", channel: "whatsapp", tags: ["cliente"], sdr: "Carlos", closer: "Marcos", stage: "s6", funnelId: "f1", lastInteraction: "Há 1d", createdAt: "2026-02-28", value: 8000, hasAppointment: true, appointmentDate: "2026-02-28", appointmentAttended: false, responseTimeMinutes: 30 },
  { id: "l10", name: "Fernanda Dias", email: "fernanda@email.com", phone: "(11) 90000-0000", origin: "Indicação", channel: "instagram", tags: ["cliente", "vip"], sdr: "Ana", closer: "Ricardo", stage: "s6", funnelId: "f1", lastInteraction: "Há 6h", createdAt: "2026-02-27", value: 15000, hasAppointment: true, appointmentDate: "2026-02-27", appointmentAttended: true, responseTimeMinutes: 7 },
  { id: "l11", name: "Thiago Nunes", email: "thiago@email.com", phone: "(11) 91234-5678", origin: "Instagram Orgânico", channel: "instagram", tags: ["quente"], sdr: "Pedro", closer: "Ricardo", stage: "s1", funnelId: "f1", lastInteraction: "Há 1h", createdAt: "2026-03-05", value: 3500, responseTimeMinutes: 18 },
  { id: "l12", name: "Camila Souza", email: "camila@email.com", phone: "(21) 99876-5432", origin: "WhatsApp", channel: "whatsapp", tags: ["morno"], sdr: "Pedro", closer: "Marcos", stage: "s2", funnelId: "f1", lastInteraction: "Há 4h", createdAt: "2026-03-05", value: 2000, hasAppointment: true, appointmentDate: "2026-03-05", appointmentAttended: false, responseTimeMinutes: 55 },
  { id: "l13", name: "Diego Martins", email: "diego@email.com", phone: "(31) 98765-4321", origin: "Tráfego Pago", channel: "instagram", tags: ["quente"], sdr: "Carlos", closer: "Ricardo", stage: "s4", funnelId: "f1", lastInteraction: "Há 3h", createdAt: "2026-03-03", value: 7500, hasAppointment: true, appointmentDate: "2026-03-03", appointmentAttended: true, responseTimeMinutes: 10 },
  { id: "l14", name: "Larissa Oliveira", email: "larissa@email.com", phone: "(41) 97654-3210", origin: "Instagram Orgânico", channel: "whatsapp", tags: ["frio"], sdr: "Ana", closer: "Marcos", stage: "s1", funnelId: "f1", lastInteraction: "Há 6h", createdAt: "2026-03-04", value: 1800, responseTimeMinutes: 120 },
  { id: "l15", name: "Felipe Ramos", email: "felipe@email.com", phone: "(51) 96543-2109", origin: "WhatsApp", channel: "whatsapp", tags: ["quente"], sdr: "Pedro", closer: "Ricardo", stage: "s3", funnelId: "f1", lastInteraction: "Há 2h", createdAt: "2026-03-05", value: 4500, hasAppointment: true, appointmentDate: "2026-03-05", appointmentAttended: true, responseTimeMinutes: 25 },
  // Older leads for period comparison
  { id: "l16", name: "Gustavo Pereira", email: "gustavo@email.com", phone: "(11) 91111-1234", origin: "Tráfego Pago", channel: "instagram", tags: ["morno"], sdr: "Carlos", closer: "Marcos", stage: "s6", funnelId: "f1", lastInteraction: "Há 10d", createdAt: "2026-02-20", value: 9000, hasAppointment: true, appointmentDate: "2026-02-20", appointmentAttended: true, responseTimeMinutes: 14 },
  { id: "l17", name: "Natalia Gomes", email: "natalia@email.com", phone: "(21) 92222-5678", origin: "Instagram Orgânico", channel: "instagram", tags: ["quente"], sdr: "Ana", closer: "Ricardo", stage: "s5", funnelId: "f1", lastInteraction: "Há 12d", createdAt: "2026-02-18", value: 5500, hasAppointment: true, appointmentDate: "2026-02-18", appointmentAttended: false, responseTimeMinutes: 40 },
  { id: "l18", name: "Roberto Vieira", email: "roberto@email.com", phone: "(31) 93333-9012", origin: "WhatsApp", channel: "whatsapp", tags: ["frio"], sdr: "Pedro", closer: "Marcos", stage: "s2", funnelId: "f1", lastInteraction: "Há 15d", createdAt: "2026-02-15", value: 2200, responseTimeMinutes: 90 },
  { id: "l19", name: "Amanda Lopes", email: "amanda@email.com", phone: "(41) 94444-3456", origin: "YouTube", channel: "whatsapp", tags: ["morno"], sdr: "Carlos", closer: "Ricardo", stage: "s4", funnelId: "f1", lastInteraction: "Há 18d", createdAt: "2026-02-12", value: 6500, hasAppointment: true, appointmentDate: "2026-02-12", appointmentAttended: true, responseTimeMinutes: 11 },
  { id: "l20", name: "Eduardo Ribeiro", email: "eduardo@email.com", phone: "(51) 95555-7890", origin: "Indicação", channel: "instagram", tags: ["quente"], sdr: "Ana", closer: "Marcos", stage: "s6", funnelId: "f1", lastInteraction: "Há 20d", createdAt: "2026-02-10", value: 11000, hasAppointment: true, appointmentDate: "2026-02-10", appointmentAttended: true, responseTimeMinutes: 6 },
];
