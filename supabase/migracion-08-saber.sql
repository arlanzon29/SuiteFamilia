-- ---------------------------------------------------------------------------
-- Migración 08: las tablas de "Saber"
-- ---------------------------------------------------------------------------
--
-- Dos tablas, en la misma base que la compra y Pendientes, porque la cuenta es
-- la misma y la casa es la misma.
--
-- Ejecutar en el SQL Editor de Supabase. Es idempotente.
--
--
-- POR QUÉ EL FILTRO VIVE EN LA CONSULTA Y NO EN EL CLIENTE
--
-- A diferencia de la compra y de Pendientes —que traen su tabla entera y
-- filtran en JavaScript, decisión razonada para una tabla de una casa—, aquí
-- el listado de conocimientos se pide siempre con filtro: por tema, por quién
-- lo apuntó, por texto. `infraestructura/supabase/conocimientos.ts` traduce
-- eso a `.eq()` / `.ilike()` de verdad, así que el servidor devuelve solo las
-- filas que la pantalla va a pintar. Es una decisión explícita, pedida así
-- desde el principio y no una migración posterior de una fase 1 en memoria.
--
--
-- QUIÉN LO APUNTÓ
--
-- Mismo patrón que `pendientes.creado_por` en migracion-06: sale de
-- `auth.uid()` por defecto, nunca de lo que mande el cliente. Es historia —
-- quién apuntó qué—, no un permiso: el RLS de abajo deja que cualquiera de
-- los dos vea, edite y borre todo, porque el conocimiento es de la casa.
--
--
-- LAS FOTOS NO ESTÁN AQUÍ
--
-- Van al mismo cubo `imagenes` que ya creó migracion-04-fotos.sql, con sus
-- mismas políticas —el cubo es por cubo, no por carpeta—. La diferencia con
-- las fotos de producto de la compra es que aquí puede haber varias por
-- conocimiento, así que la ruta no se deduce del nombre (aquí no hay nombre
-- estable) sino del id, que es un uuid y no cambia nunca:
--
--     imagenes/saber/<id-conocimiento>__<id-foto>-80.jpg   miniatura
--     imagenes/saber/<id-conocimiento>__<id-foto>-720.jpg  grande
--
-- No hace falta tabla de fotos: se listan con `storage.list('saber')` y se
-- agrupan por el prefijo antes del `__`. Está en
-- `infraestructura/supabase/fotos.ts`.
-- ---------------------------------------------------------------------------


-- 1. Temas -------------------------------------------------------------------
--
-- Lista cerrada de categorías, igual que `supermercados` en la compra: se dan
-- de alta en Ajustes y se eligen al crear un conocimiento, nunca se escriben
-- a mano. `citext` para que «Recetas» y «recetas» sean el mismo tema.

create table if not exists temas (
  nombre      citext primary key
                check (char_length(nombre) between 1 and 50),
  created_at  timestamptz not null default now()
);


-- 2. Conocimientos -------------------------------------------------------------

create table if not exists conocimientos (
  id           uuid primary key default gen_random_uuid(),

  titulo       text not null
                 check (char_length(btrim(titulo)) between 1 and 120),

  -- Puede estar vacía; `not null default ''` para no tener que distinguir
  -- nulo de cadena vacía, que serían el mismo «sin descripción».
  descripcion  text not null default '',

  tema         citext not null references temas(nombre)
                 on update cascade on delete cascade,

  -- Un enlace, por ejemplo a un vídeo. Nulo si no lleva.
  enlace       text
                 check (enlace is null or char_length(enlace) <= 2048),

  -- Cuándo se apuntó. Lo pone el servidor.
  creado       timestamptz not null default now(),

  -- Quién lo apuntó. Sale de `auth.uid()`, no de lo que mande el cliente.
  creado_por   uuid default auth.uid() references auth.users(id)
                 on delete set null
);

-- Borrar un tema se lleva sus conocimientos: lo dice `on delete cascade` de
-- arriba, y lo cuenta el diálogo de Ajustes antes de dejar borrar un tema.

-- Los dos índices que pide el filtro server-side: por tema y por autor,
-- siempre ordenado por fecha. Sin ellos, `.eq('tema', …).order('creado')`
-- tendría que ordenar la tabla entera en cada consulta.
create index if not exists conocimientos_tema_creado_idx
  on conocimientos (tema, creado desc);

create index if not exists conocimientos_creado_por_creado_idx
  on conocimientos (creado_por, creado desc);

create index if not exists conocimientos_creado_idx
  on conocimientos (creado desc);

-- No hay índice para el buscador de texto (`ilike '%…%'`) a propósito: con el
-- conocimiento de una casa —cientos de filas, no millones— un `seq scan`
-- ordenado por el índice de arriba no se nota. Si esto creciera de verdad, la
-- salida es `pg_trgm` con un índice `gin`, y entonces sí hace falta la
-- extensión.


-- 3. Seguridad (RLS) ----------------------------------------------------------
--
-- Igual que el resto de la suite: quien tiene cuenta lo ve y lo edita todo. El
-- conocimiento es de la casa, no de quien lo apuntó.

alter table temas         enable row level security;
alter table conocimientos enable row level security;

drop policy if exists "usuarios autenticados" on temas;
create policy "usuarios autenticados" on temas
  for all to authenticated using (true) with check (true);

drop policy if exists "usuarios autenticados" on conocimientos;
create policy "usuarios autenticados" on conocimientos
  for all to authenticated using (true) with check (true);


-- 4. Datos de ejemplo (opcional) ----------------------------------------------
-- Descomenta para tener algo con lo que probar contra la base de verdad.

-- insert into temas (nombre) values
--   ('Recetas'), ('Bricolaje'), ('Salud'), ('Jardín'), ('Tecnología');
