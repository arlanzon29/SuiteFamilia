-- ---------------------------------------------------------------------------
-- Migración 07: el campo «importante» en Pendientes
-- ---------------------------------------------------------------------------
--
-- Ejecutar en el SQL Editor de Supabase. Es idempotente.
--
-- Un campo, no una escala: «importante» es sí o no, con la admiración de
-- siempre en la interfaz. No hay niveles de prioridad porque en una casa de
-- dos no hace falta ordenar por urgencia, solo destacar lo poco que de verdad
-- no puede esperar.
--
-- `not null default false`: lo normal es que algo no sea importante, y
-- ninguna fila existente debe quedar en un estado ambiguo al añadir la
-- columna.
-- ---------------------------------------------------------------------------

alter table pendientes
  add column if not exists importante boolean not null default false;
