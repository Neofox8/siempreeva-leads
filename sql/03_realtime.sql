-- Siempre Eva — Migración 03: realtime + policy de lectura
-- Habilita auto-refresh push en el dashboard al insertar nuevos leads.
-- (El polling cada 30s sigue funcionando aunque NO ejecutes este archivo).

-- 1) Sumar la tabla leads a la publicación realtime de Supabase.
alter publication supabase_realtime add table leads;

-- 2) Cualquier usuario autenticado puede leer leads.
--    Realtime aplica RLS, así que sin esta policy los eventos no llegarían
--    al cliente browser (aunque el server component sí lee con service role).
drop policy if exists "leads_select_auth" on leads;
create policy "leads_select_auth"
  on leads for select
  to authenticated
  using (true);
