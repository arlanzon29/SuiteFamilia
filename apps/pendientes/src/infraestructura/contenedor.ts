import { construyeCasosDeUso, type CasosDeUso, type Dependencias } from '../aplicacion'
import { nuevoAlmacen, type Almacen } from './memoria/almacen'
import { autenticacionMemoria } from './memoria/autenticacion'
import { repositorioPendientesMemoria } from './memoria/repositorios'
import { relojDelSistema } from './reloj'

/**
 * El único punto donde se elige la implementación de cada contrato.
 *
 * **Fase 1**: todo en memoria, con la semilla. Los repositorios de Supabase son
 * el paso siguiente, y cuando entren se tocará este fichero y solo este: ni el
 * dominio, ni los casos de uso, ni una sola pantalla.
 *
 * Por eso no hay aquí todavía ninguna comprobación de `.env`: mientras no
 * exista la implementación de Supabase, elegir entre dos no es una decisión
 * sino un `if` que siempre cae del mismo lado.
 */

const enMemoria = (almacen: Almacen): Dependencias => ({
  pendientes: repositorioPendientesMemoria(almacen),
  auth: autenticacionMemoria(),
  reloj: relojDelSistema(),
})

/** Todo simulado, con los datos de ejemplo de la semilla. */
export const dependenciasEnMemoria = (): Dependencias => enMemoria(nuevoAlmacen())

/** Lo que usa la aplicación al arrancar. */
export const dependenciasPorDefecto = (): Dependencias => dependenciasEnMemoria()

export const casosDeUsoPorDefecto = (): CasosDeUso =>
  construyeCasosDeUso(dependenciasPorDefecto())
