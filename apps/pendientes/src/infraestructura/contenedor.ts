import { construyeCasosDeUso, type CasosDeUso, type Dependencias } from '../aplicacion'
import { nuevoAlmacen, type Almacen } from './memoria/almacen'
import { autenticacionMemoria } from './memoria/autenticacion'
import { repositorioPendientesMemoria } from './memoria/repositorios'
import { relojDelSistema } from './reloj'
import { clienteSupabase, haySupabase } from './supabase/cliente'
import { autenticacionSupabase } from './supabase/autenticacion'
import { repositorioPendientesSupabase } from './supabase/pendientes'

/**
 * El único punto donde se elige la implementación de cada contrato.
 *
 * **Fase 2, terminada**: con `.env`, la autenticación y los pendientes son los
 * de Supabase. El modo mixto de la sesión anterior —cuenta real, datos en
 * memoria— duró lo que tardó en existir la tabla.
 *
 * Sin `.env` no cambia nada de lo de antes: todo simulado y con semilla.
 */

const enMemoria = (almacen: Almacen): Dependencias => ({
  pendientes: repositorioPendientesMemoria(almacen),
  auth: autenticacionMemoria(),
  reloj: relojDelSistema(),
})

/** Todo simulado, con los datos de ejemplo de la semilla. */
export const dependenciasEnMemoria = (): Dependencias => enMemoria(nuevoAlmacen())

/**
 * Lo que usa la aplicación al arrancar.
 *
 * Sin `.env` configurado —o con `--mode memoria`, que lo vacía— todo sigue
 * simulado y con semilla: el proyecto arranca recién clonado y se puede
 * revisar la interfaz sin credenciales. Con `.env`, la autenticación es
 * Supabase Auth y hay que entrar con una cuenta de verdad.
 *
 * El reloj no depende de esto y no cambia: es un contrato para poder fijar el
 * «hoy» en una prueba, no algo que dependa de dónde estén los datos.
 */
export const dependenciasPorDefecto = (): Dependencias => {
  if (!haySupabase) return dependenciasEnMemoria()
  const sb = clienteSupabase()
  return {
    auth: autenticacionSupabase(sb),
    pendientes: repositorioPendientesSupabase(sb),
    reloj: relojDelSistema(),
  }
}

export const casosDeUsoPorDefecto = (): CasosDeUso =>
  construyeCasosDeUso(dependenciasPorDefecto())
