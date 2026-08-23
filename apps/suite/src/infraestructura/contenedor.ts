import { construyeCasosDeUso, type CasosDeUso, type Dependencias } from '../aplicacion'
import { autenticacionMemoria } from './memoria/autenticacion'
import {
  repositorioResumenCompraMemoria,
  repositorioResumenPendientesMemoria,
} from './memoria/resumen'
import { relojDelSistema } from './reloj'
import { clienteSupabase, haySupabase } from './supabase/cliente'
import { autenticacionSupabase } from './supabase/autenticacion'
import { repositorioResumenCompraSupabase } from './supabase/resumenCompra'
import { repositorioResumenPendientesSupabase } from './supabase/resumenPendientes'

/**
 * El único punto donde se elige la implementación de cada contrato.
 *
 * Sin `.env` —o con `--mode memoria`— todo simulado: autenticación falsa y
 * cifras de ejemplo. Con `.env`, la autenticación es Supabase Auth y las
 * cifras salen de la misma base que compra y pendientes: no hay tabla propia
 * de la portada, así que no hay un camino mixto que atravesar.
 */

const enMemoria = (): Dependencias => ({
  resumenCompra: repositorioResumenCompraMemoria(),
  resumenPendientes: repositorioResumenPendientesMemoria(),
  auth: autenticacionMemoria(),
  reloj: relojDelSistema(),
})

/** Todo simulado, con cifras de ejemplo fijas. */
export const dependenciasEnMemoria = (): Dependencias => enMemoria()

/**
 * Lo que usa la aplicación al arrancar.
 *
 * Sin `.env` configurado —o con `--mode memoria`, que lo vacía— todo sigue
 * simulado: el proyecto arranca recién clonado y se puede revisar la
 * interfaz sin credenciales. Con `.env`, la autenticación es Supabase Auth y
 * hay que entrar con una cuenta de verdad, la misma que en compra y pendientes.
 */
export const dependenciasPorDefecto = (): Dependencias => {
  if (!haySupabase) return dependenciasEnMemoria()
  const sb = clienteSupabase()
  return {
    auth: autenticacionSupabase(sb),
    resumenCompra: repositorioResumenCompraSupabase(sb),
    resumenPendientes: repositorioResumenPendientesSupabase(sb),
    reloj: relojDelSistema(),
  }
}

export const casosDeUsoPorDefecto = (): CasosDeUso =>
  construyeCasosDeUso(dependenciasPorDefecto())
