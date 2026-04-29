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
  atendido: string;
  observacion: string | null;
  observacion2: string | null;
  paciente_id: string | null;
  creado_en: string;
};

export type LeadFilters = {
  sede?: string;
  atendido?: string;
  q?: string;
};
