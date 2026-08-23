import type { Dependencias } from './dependencias'
import { cargarResumenCompra, cargarResumenPendientes } from './casos/resumen'
import { actualizarNombre, cerrarSesion, iniciarSesion, sesionActual } from './casos/sesion'

/**
 * Los casos de uso ya enlazados a sus dependencias. Es lo único que la capa de
 * presentación puede llamar: nunca un repositorio directamente.
 */
export const construyeCasosDeUso = (d: Dependencias) => ({
  cargarResumenCompra: cargarResumenCompra(d),
  cargarResumenPendientes: cargarResumenPendientes(d),

  sesionActual: sesionActual(d),
  iniciarSesion: iniciarSesion(d),
  cerrarSesion: cerrarSesion(d),
  actualizarNombre: actualizarNombre(d),

  /** El «hoy» que usa el saludo de Inicio. */
  hoy: () => d.reloj.hoy(),
})

export type CasosDeUso = ReturnType<typeof construyeCasosDeUso>
export type { Dependencias }
