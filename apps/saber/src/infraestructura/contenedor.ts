import { construyeCasosDeUso, type CasosDeUso, type Dependencias } from '../aplicacion'
import { nuevoAlmacen, type Almacen } from './memoria/almacen'
import { autenticacionMemoria } from './memoria/autenticacion'
import {
  repositorioConocimientosMemoria,
  repositorioFotosMemoria,
  repositorioTemasMemoria,
} from './memoria/repositorios'
import { relojDelSistema } from './reloj'
import { clienteSupabase, haySupabase } from './supabase/cliente'
import { autenticacionSupabase } from './supabase/autenticacion'
import { repositorioTemasSupabase } from './supabase/temas'
import { repositorioConocimientosSupabase } from './supabase/conocimientos'
import { repositorioFotosSupabase } from './supabase/fotos'

/**
 * El único punto donde se elige la implementación de cada contrato.
 *
 * A diferencia de cómo empezaron la compra y Pendientes, aquí Supabase es
 * fase 1: no hay un tramo intermedio en memoria mientras se escribía la
 * migración. `supabase/migracion-08-saber.sql` ya existe, y con `.env`
 * configurado la aplicación escribe contra la base de verdad desde el primer
 * arranque.
 *
 * El modo memoria no desaparece: sigue siendo cómo se arranca el proyecto
 * recién clonado y sin credenciales, y cómo lo usa `saber-memoria` en
 * `.claude/launch.json`.
 */

const enMemoria = (almacen: Almacen): Dependencias => ({
  temas: repositorioTemasMemoria(almacen),
  conocimientos: repositorioConocimientosMemoria(almacen),
  fotos: repositorioFotosMemoria(almacen),
  auth: autenticacionMemoria(),
  reloj: relojDelSistema(),
})

/** Todo simulado, con los datos de ejemplo de la semilla. */
export const dependenciasEnMemoria = (): Dependencias => enMemoria(nuevoAlmacen())

/**
 * Lo que usa la aplicación al arrancar.
 *
 * Sin `.env` configurado —o con `--mode memoria`, que lo vacía— todo sigue
 * simulado y con semilla. Con `.env`, la autenticación y los dos repositorios
 * son los de Supabase.
 */
export const dependenciasPorDefecto = (): Dependencias => {
  if (!haySupabase) return dependenciasEnMemoria()
  const sb = clienteSupabase()
  return {
    auth: autenticacionSupabase(sb),
    temas: repositorioTemasSupabase(sb),
    conocimientos: repositorioConocimientosSupabase(sb),
    fotos: repositorioFotosSupabase(sb),
    reloj: relojDelSistema(),
  }
}

export const casosDeUsoPorDefecto = (): CasosDeUso =>
  construyeCasosDeUso(dependenciasPorDefecto())
