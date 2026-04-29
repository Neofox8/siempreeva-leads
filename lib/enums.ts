import type { EstadoLead, OrigenLead } from "@/types/lead";

export const ESTADO_OPTIONS: EstadoLead[] = [
  "no_atendido",
  "atendido",
  "enviado_info",
  "agendado",
  "asistio",
  "no_asistio",
  "no_compro",
  "descartado",
  "paciente",
];

export const ESTADO_LABELS: Record<EstadoLead, string> = {
  no_atendido: "No Atendido",
  atendido: "Atendido",
  enviado_info: "Enviado Info",
  agendado: "Agendado",
  asistio: "Asistió",
  no_asistio: "No Asistió",
  no_compro: "No Compró",
  descartado: "Descartado",
  paciente: "Paciente ⭐",
};

/** Clases Tailwind para el `<select>` del cell de atendido. */
export const ESTADO_COLORS: Record<EstadoLead, string> = {
  no_atendido: "border-amber-300 bg-amber-50 text-amber-800",
  atendido: "border-green-300 bg-green-50 text-green-800",
  enviado_info: "border-slate-300 bg-slate-100 text-slate-700",
  agendado: "border-blue-300 bg-blue-50 text-blue-800",
  asistio: "border-emerald-400 bg-emerald-100 text-emerald-900",
  no_asistio: "border-red-200 bg-red-50 text-red-700",
  no_compro: "border-red-200 bg-red-50 text-red-700",
  descartado: "border-red-200 bg-red-50 text-red-700",
  paciente: "border-berry bg-berry/10 text-berry",
};

export const ORIGEN_OPTIONS: OrigenLead[] = [
  "instagram_manychat",
  "messenger_manual",
  "whatsapp",
  "referido",
  "otro",
];

export const ORIGEN_LABELS: Record<OrigenLead, string> = {
  instagram_manychat: "Instagram (ManyChat)",
  messenger_manual: "Messenger Manual",
  whatsapp: "WhatsApp",
  referido: "Referido",
  otro: "Otro",
};
