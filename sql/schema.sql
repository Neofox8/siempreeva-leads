-- Siempre Eva — Leads
-- Ejecutar en el SQL Editor de Supabase.
-- Asume que la tabla `pacientes` ya existe en este proyecto.

create table if not exists leads (
  id            uuid        default gen_random_uuid() primary key,
  fecha         timestamptz default now(),
  nombre        text,
  usuario       text,
  celular       text,
  sede          text,
  seguidora     boolean,
  turno         text,
  dia           text,
  atendido      text        default 'No Atendido',
  observacion   text,
  observacion2  text,
  paciente_id   uuid        references pacientes(id) on delete set null,
  creado_en     timestamptz default now()
);

-- Índices para los filtros y el cruce futuro contra pacientes.
create index if not exists idx_leads_fecha    on leads (fecha desc);
create index if not exists idx_leads_celular  on leads (celular);
create index if not exists idx_leads_sede     on leads (sede);
create index if not exists idx_leads_atendido on leads (atendido);

-- RLS: por ahora abierto para el service role.
-- Si más adelante expones la tabla al cliente, define policies aquí.
alter table leads enable row level security;
