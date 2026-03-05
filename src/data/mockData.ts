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
  stage: string;
  funnelId: string;
  lastInteraction: string;
  createdAt: string;
  value?: number;
  hasAppointment?: boolean;
  appointmentDate?: string;
  appointmentAttended?: boolean;
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

export const mockLeads: Lead[] = [
  { id: "l1", name: "Maria Silva", email: "maria@email.com", phone: "(11) 99999-1111", origin: "Instagram Orgânico", channel: "instagram", tags: ["quente", "instagram"], sdr: "Carlos", stage: "s1", funnelId: "f1", lastInteraction: "Há 2h", createdAt: "2026-03-05", value: 2500 },
  { id: "l2", name: "João Oliveira", email: "joao@email.com", phone: "(21) 98888-2222", origin: "Tráfego Pago", channel: "whatsapp", tags: ["morno", "facebook-ads"], sdr: "Ana", stage: "s1", funnelId: "f1", lastInteraction: "Há 5h", createdAt: "2026-03-05", value: 4000 },
  { id: "l3", name: "Ana Costa", email: "ana@email.com", phone: "(31) 97777-3333", origin: "YouTube", channel: "instagram", tags: ["quente", "youtube"], sdr: "Carlos", stage: "s2", funnelId: "f1", lastInteraction: "Há 1d", createdAt: "2026-03-04", value: 1500 },
  { id: "l4", name: "Pedro Santos", email: "pedro@email.com", phone: "(41) 96666-4444", origin: "WhatsApp", channel: "whatsapp", tags: ["frio"], sdr: "Ana", stage: "s2", funnelId: "f1", lastInteraction: "Há 3h", createdAt: "2026-03-05", value: undefined, hasAppointment: true, appointmentDate: "2026-03-05", appointmentAttended: true },
  { id: "l5", name: "Lucas Ferreira", email: "lucas@email.com", phone: "(51) 95555-5555", origin: "Indicação", channel: "whatsapp", tags: ["quente", "indicação"], sdr: "Carlos", stage: "s3", funnelId: "f1", lastInteraction: "Há 30min", createdAt: "2026-03-04", value: 6000, hasAppointment: true, appointmentDate: "2026-03-04", appointmentAttended: true },
  { id: "l6", name: "Carla Mendes", email: "carla@email.com", phone: "(61) 94444-6666", origin: "Tráfego Pago", channel: "instagram", tags: ["morno"], sdr: "Ana", stage: "s3", funnelId: "f1", lastInteraction: "Há 1h", createdAt: "2026-03-03", value: 3000, hasAppointment: true, appointmentDate: "2026-03-03", appointmentAttended: false },
  { id: "l7", name: "Rafael Lima", email: "rafael@email.com", phone: "(71) 93333-7777", origin: "Instagram Orgânico", channel: "instagram", tags: ["quente"], sdr: "Carlos", stage: "s4", funnelId: "f1", lastInteraction: "Há 2d", createdAt: "2026-03-02", value: 5000, hasAppointment: true, appointmentDate: "2026-03-02", appointmentAttended: true },
  { id: "l8", name: "Juliana Rocha", email: "juliana@email.com", phone: "(81) 92222-8888", origin: "YouTube", channel: "whatsapp", tags: ["quente", "vip"], sdr: "Ana", stage: "s5", funnelId: "f1", lastInteraction: "Há 4h", createdAt: "2026-03-01", value: 12000, hasAppointment: true, appointmentDate: "2026-03-01", appointmentAttended: true },
  { id: "l9", name: "Bruno Almeida", email: "bruno@email.com", phone: "(91) 91111-9999", origin: "Tráfego Pago", channel: "whatsapp", tags: ["cliente"], sdr: "Carlos", stage: "s6", funnelId: "f1", lastInteraction: "Há 1d", createdAt: "2026-02-28", value: 8000, hasAppointment: true, appointmentDate: "2026-02-28", appointmentAttended: false },
  { id: "l10", name: "Fernanda Dias", email: "fernanda@email.com", phone: "(11) 90000-0000", origin: "Indicação", channel: "instagram", tags: ["cliente", "vip"], sdr: "Ana", stage: "s6", funnelId: "f1", lastInteraction: "Há 6h", createdAt: "2026-02-27", value: 15000, hasAppointment: true, appointmentDate: "2026-02-27", appointmentAttended: true },
  // Extra leads for richer data
  { id: "l11", name: "Thiago Nunes", email: "thiago@email.com", phone: "(11) 91234-5678", origin: "Instagram Orgânico", channel: "instagram", tags: ["quente"], sdr: "Pedro", stage: "s1", funnelId: "f1", lastInteraction: "Há 1h", createdAt: "2026-03-05", value: 3500 },
  { id: "l12", name: "Camila Souza", email: "camila@email.com", phone: "(21) 99876-5432", origin: "WhatsApp", channel: "whatsapp", tags: ["morno"], sdr: "Pedro", stage: "s2", funnelId: "f1", lastInteraction: "Há 4h", createdAt: "2026-03-05", value: 2000, hasAppointment: true, appointmentDate: "2026-03-05", appointmentAttended: false },
  { id: "l13", name: "Diego Martins", email: "diego@email.com", phone: "(31) 98765-4321", origin: "Tráfego Pago", channel: "instagram", tags: ["quente"], sdr: "Carlos", stage: "s4", funnelId: "f1", lastInteraction: "Há 3h", createdAt: "2026-03-03", value: 7500, hasAppointment: true, appointmentDate: "2026-03-03", appointmentAttended: true },
  { id: "l14", name: "Larissa Oliveira", email: "larissa@email.com", phone: "(41) 97654-3210", origin: "Instagram Orgânico", channel: "whatsapp", tags: ["frio"], sdr: "Ana", stage: "s1", funnelId: "f1", lastInteraction: "Há 6h", createdAt: "2026-03-04", value: 1800 },
  { id: "l15", name: "Felipe Ramos", email: "felipe@email.com", phone: "(51) 96543-2109", origin: "WhatsApp", channel: "whatsapp", tags: ["quente"], sdr: "Pedro", stage: "s3", funnelId: "f1", lastInteraction: "Há 2h", createdAt: "2026-03-05", value: 4500, hasAppointment: true, appointmentDate: "2026-03-05", appointmentAttended: true },
];
