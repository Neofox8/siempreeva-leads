-- Siempre Eva — Migración 02: campos extra en leads + tabla usuarios
-- Ejecutar después de schema.sql en el SQL Editor de Supabase.

-- 1) Nuevos campos en leads
alter table leads add column if not exists fuente text default 'manychat';
alter table leads add column if not exists convertido boolean default false;
alter table leads add column if not exists fecha_conversion timestamptz;

create index if not exists idx_leads_fuente on leads (fuente);

-- 2) Tabla usuarios (perfil + rol, ligada a auth.users)
create table if not exists usuarios (
  id          uuid        references auth.users(id) on delete cascade primary key,
  nombre      text,
  email       text,
  rol         text        default 'staff' check (rol in ('admin', 'staff')),
  activo      boolean     default true,
  creado_en   timestamptz default now()
);

-- 3) RLS: cada usuario puede leer su propio perfil.
-- El service role bypassa RLS, así que la app sigue pudiendo leer cualquier fila desde el server.
alter table usuarios enable row level security;

drop policy if exists "usuarios_select_own" on usuarios;
create policy "usuarios_select_own"
  on usuarios for select
  using (auth.uid() = id);

-- 4) Sembrado: para crear el primer admin, después de crear el usuario en
-- Authentication → Users en el dashboard de Supabase, ejecuta algo como:
--
--   insert into usuarios (id, nombre, email, rol)
--   values ('<uuid-del-usuario>', 'Christian', 'christianruiz450@gmail.com', 'admin');
