export type EstadoLead =
  | "no_atendido"
  | "atendido"
  | "enviado_info"
  | "agendado"
  | "asistio"
  | "no_asistio"
  | "no_compro"
  | "descartado"
  | "paciente";

export type OrigenLead =
  | "instagram_manychat"
  | "messenger_manual"
  | "whatsapp"
  | "referido"
  | "otro";

export type Lead = {
  id: string;
  fecha: string;
  nombre: string | null;
  usuario: string | null;
  celular: string | null;
  sede: string | null;
  seguidora: boolean | null;
  turno: string | null;
  dia: string | null;
  atendido: EstadoLead;
  observacion: string | null;
  observacion2: string | null;
  paciente_id: string | null;
  fuente: OrigenLead | null;
  convertido: boolean | null;
  fecha_conversion: string | null;
  creado_en: string;
};

export type LeadFilters = {
  sede?: string;
  atendido?: EstadoLead | "";
  q?: string;
};

export type Rol = "admin" | "staff";

export type SesionUsuario = {
  id: string;
  email: string | null;
  nombre: string | null;
  rol: Rol;
};
