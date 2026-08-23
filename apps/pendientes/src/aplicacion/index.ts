import type { Dependencias } from './dependencias'
import { cargarTodo } from './casos/datos'
import {
  borrarPendiente,
  crearPendiente,
  darPorHecho,
  deshacerHecho,
  editarPendiente,
  obtenerPendiente,
} from './casos/pendientes'
import { actualizarNombre, cerrarSesion, iniciarSesion, sesionActual } from './casos/sesion'

/**
 * Los casos de uso ya enlazados a sus dependencias. Es lo único que la capa de
 * presentación puede llamar: nunca un repositorio directamente.
 */
export const construyeCasosDeUso = (d: Dependencias) => ({
  cargarTodo: cargarTodo(d),

  crearPendiente: crearPendiente(d),
  editarPendiente: editarPendiente(d),
  darPorHecho: darPorHecho(d),
  deshacerHecho: deshacerHecho(d),
  borrarPendiente: borrarPendiente(d),
  obtenerPendiente: obtenerPendiente(d),

  sesionActual: sesionActual(d),
  iniciarSesion: iniciarSesion(d),
  cerrarSesion: cerrarSesion(d),
  actualizarNombre: actualizarNombre(d),

  /** El «hoy» que usan las pantallas para contar los días. */
  hoy: () => d.reloj.hoy(),
})

export type CasosDeUso = ReturnType<typeof construyeCasosDeUso>
export type { Dependencias }
export type { Instantanea } from './casos/datos'
