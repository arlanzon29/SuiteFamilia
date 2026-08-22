import { construyeCasosDeUso, type CasosDeUso, type Dependencias } from '../aplicacion'
import { nuevoAlmacen, type Almacen } from './memoria/almacen'
import { autenticacionMemoria } from './memoria/autenticacion'
import { repositorioPendientesMemoria } from './memoria/repositorios'
import { relojDelSistema } from './reloj'
import { clienteSupabase, haySupabase } from './supabase/cliente'
import { autenticacionSupabase } from './supabase/autenticacion'

/**
 * El único punto donde se elige la implementación de cada contrato.
 *
 * **Fase 2, a medias y a propósito**: la autenticación ya es la de verdad,
 * los pendientes siguen en memoria. Es el mismo camino que recorrió la compra
 * —los puertos entraron de uno en uno, no todos a la vez—, y aquí el orden lo
 * marca lo que existe: la cuenta ya está creada en Supabase y es la misma de
 * la compra, mientras que la tabla `pendientes` todavía no tiene ni migración.
 *
 * Que el modo mixto se vea en el tipo es la ventaja de tener un solo sitio
 * donde se decide: quien lea esto sabe exactamente qué es real y qué no.
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
  return {
    // Real. La cuenta es la de la suite entera.
    auth: autenticacionSupabase(clienteSupabase()),
    // Todavía en memoria: la tabla `pendientes` es el paso siguiente. Al
    // entrar, esta línea es lo único que cambia.
    pendientes: repositorioPendientesMemoria(nuevoAlmacen()),
    reloj: relojDelSistema(),
  }
}

export const casosDeUsoPorDefecto = (): CasosDeUso =>
  construyeCasosDeUso(dependenciasPorDefecto())
