-- ---------------------------------------------------------------------------
-- Migración 06: la tabla de Pendientes
-- ---------------------------------------------------------------------------
--
-- La segunda aplicación de la suite deja de funcionar contra memoria. Una sola
-- tabla, en la misma base que la compra, porque la cuenta es la misma y la
-- casa es la misma.
--
-- Ejecutar en el SQL Editor de Supabase. Es idempotente.
--
--
-- POR QUÉ NO HAY COLUMNA DE ESTADO
--
-- El estado es `finalizado`: nula, está pendiente; con fecha, está cerrado.
-- No hay una columna 'P'/'C' aparte, y se sopesó ponerla.
--
-- Guardar la letra *además* de la fecha es tener dos versiones de lo mismo, y
-- dos versiones acaban discrepando: una fila con estado 'C' y `finalizado`
-- nulo, o al revés, y entonces no hay forma de saber cuál de las dos miente.
-- La fecha, en cambio, dice el estado **y** cuándo pasó, que es un dato que la
-- letra no tiene y que Hechos necesita para agrupar por meses.
--
-- Lo que la aplicación hacía por convenio lo impone ahora la base. Consultar
-- es igual de directo:
--
--     where finalizado is null       -- lo que está pendiente
--     where finalizado is not null   -- lo cerrado
--
-- Y deshacer un pendiente es poner `finalizado` a nulo: un solo campo que
-- tocar, sin nada que sincronizar detrás.
--
--
-- POR QUÉ `fecha_prevista` ES `date` Y NO `timestamptz`
--
-- Las otras dos fechas son **instantes**: el momento exacto en que se apuntó y
-- en que se resolvió. Van en `timestamptz`, y las pone el servidor con `now()`
-- —nunca quien llama—, que además evita que el reloj torcido de un móvil
-- ordene mal la lista de la otra persona.
--
-- `fecha_prevista` es otra cosa: es un **día**. «Hay que pasar la ITV el 3 de
-- septiembre» no ocurre a las 11:42; ocurre ese día. Guardarlo como instante
-- obligaría a inventarse una hora y a arrastrar la zona horaria en cada
-- comparación. Por eso `date`.
--
--
-- LA VENTANA DE APARICIÓN, Y POR QUÉ NO ESTÁ AQUÍ
--
-- Lo que se apunta para el futuro no debe salir hasta que falte una semana.
-- Esa resta NO se hace en esta tabla, y es deliberado: el «hoy» depende de la
-- zona de quien mira, y `current_date` en Postgres es UTC. A partir de las diez
-- de la noche en España, UTC ya está en el día siguiente, y un pendiente
-- aparecería un día antes de la cuenta.
--
-- Así que la tabla guarda el dato —la fecha— y quien decide qué se ve es la
-- aplicación, que sabe en qué zona está el teléfono. Es la misma regla que ya
-- rige todo lo que cuenta días en Pendientes. La consulta de la lista lleva el
-- «hoy» como parámetro:
--
--     where finalizado is null
--       and (fecha_prevista is null or fecha_prevista <= :hoy + 7)
--
-- Un pendiente **sin** `fecha_prevista` se ve siempre: sin fecha es «alguna
-- vez», y sale en la lista desde que se apunta.
--
--
-- QUIÉN LO APUNTÓ Y QUIÉN LO CERRÓ
--
-- Dos columnas contra `auth.users`, la misma tabla de cuentas que usa la
-- compra. `creado_por` sale de `auth.uid()` por defecto —del token, no de lo
-- que mande el cliente—, por lo mismo que las fechas las pone el servidor: que
-- la aplicación no tenga que acordarse de rellenarlo y no pueda equivocarse.
--
-- Es un valor por defecto, no un cerrojo: la política de abajo es la de la
-- suite —quien tiene cuenta puede todo— y por tanto un cliente que mandara la
-- columna a mano podría poner otra. Para impedirlo de verdad haría falta un
-- disparador que forzara `auth.uid()` en cada escritura. No está, y es una
-- decisión: esto lo usan dos personas de la misma casa que ya pueden borrarse
-- los pendientes entre ellas. Si algún día entra alguien más, esto es lo
-- primero que hay que apretar.
--
-- Esto **no** convierte los pendientes en propiedad de nadie. El RLS de abajo
-- sigue dejando que cualquiera de los dos vea, edite, cierre y borre todo,
-- porque los pendientes son de la casa. Las dos columnas son historia —quién
-- hizo qué—, no permisos.
--
-- Lo único que `auth.users` guarda de cada cuenta es el correo, así que la
-- pantalla podrá decir «lo cerró maria@…» y no «lo cerró María». Si algún día
-- se quieren nombres de verdad hace falta una tabla de perfiles, y hoy no la
-- hay ni en la compra.
-- ---------------------------------------------------------------------------

create table if not exists pendientes (
  -- Autonumérico. Lo genera la base y no se puede escribir a mano: dos
  -- personas apuntando a la vez desde dos móviles no pueden chocar.
  id             bigint generated always as identity primary key,

  -- Una línea. El recorte del texto y «un título en blanco no es un
  -- pendiente» son regla de la aplicación, pero el `check` la sostiene también
  -- aquí, para que no entre por otra puerta.
  titulo         text not null
                   check (char_length(btrim(titulo)) between 1 and 120),

  -- Puede estar vacía, y por eso es `not null default ''` y no nullable: así
  -- la aplicación no tiene que tratar el nulo y la cadena vacía como dos cosas
  -- distintas, que serían el mismo «no hay descripción».
  descripcion    text not null default '',

  -- Cuándo se apuntó. La pone el servidor.
  creado         timestamptz not null default now(),

  -- Quién lo apuntó. Por el mismo motivo que la fecha, la aplicación no lo
  -- manda: sale del token con `auth.uid()`. Es un defecto, no un cerrojo; el
  -- porqué está en la cabecera.
  creado_por     uuid default auth.uid() references auth.users (id)
                   on delete set null,

  -- Cuándo se resolvió. Nula mientras esté por hacer, y toda la máquina de
  -- estados que hay.
  finalizado     timestamptz,

  -- Quién lo cerró. Nulo mientras esté por hacer, y vuelve a nulo al
  -- deshacerlo, igual que la fecha: van siempre juntos.
  finalizado_por uuid references auth.users (id) on delete set null,

  -- El día en que hay que hacerlo. Nula = «alguna vez».
  fecha_prevista date,

  -- No se puede saber quién lo cerró sin saber cuándo. Al revés sí vale: si
  -- alguien borra su cuenta, el `on delete set null` deja la fila con la fecha
  -- y sin la persona, y la historia de la casa se queda. Por eso los dos
  -- campos de persona admiten nulo: una cuenta puede desaparecer, lo que pasó
  -- en esta casa no.
  check (finalizado is not null or finalizado_por is null)
);


-- Índices. Son dos, uno por cada listado que tiene la aplicación, y los dos
-- parciales: cada uno indexa solo las filas que su pantalla mira.

-- Lo que queda por hacer, de lo más antiguo a lo más reciente, que es el orden
-- de la lista. La ventana de aparición filtra además por `fecha_prevista` en
-- esa misma consulta, y no está en el índice a propósito: con los pendientes
-- de una casa, Postgres descarta esas pocas filas sin despeinarse, y un índice
-- de dos columnas costaría más de mantener de lo que ahorra.
create index if not exists pendientes_por_hacer_idx
  on pendientes (creado) where finalizado is null;

-- Lo resuelto, de lo más reciente a lo más antiguo: el orden de Hechos, y el
-- que agrupa por meses.
create index if not exists pendientes_hechos_idx
  on pendientes (finalizado desc) where finalizado is not null;


-- RLS, igual que el resto de la suite: quien tiene cuenta lo ve todo. No hay
-- dueño por fila porque los pendientes son de la casa, no de quien los apunta;
-- si lo hubiera, la otra persona no podría dar por hecho lo que apuntaste tú,
-- que es justo para lo que sirve.
alter table pendientes enable row level security;

drop policy if exists "usuarios autenticados" on pendientes;

create policy "usuarios autenticados" on pendientes
  for all to authenticated using (true) with check (true);
