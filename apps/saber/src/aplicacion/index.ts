import type { Dependencias } from './dependencias'
import { cargarTemas } from './casos/datos'
import { crearTema, renombrarTema, borrarTema } from './casos/temas'
import {
  buscarConocimientos,
  cargarUltimosConocimientos,
  contarConocimientos,
  crearConocimiento,
  editarConocimiento,
  borrarConocimiento,
  obtenerConocimiento,
} from './casos/conocimientos'
import { cargarFotos, anadirFoto, quitarFoto } from './casos/fotos'
import { actualizarNombre, cerrarSesion, iniciarSesion, sesionActual } from './casos/sesion'

/**
 * Los casos de uso ya enlazados a sus dependencias. Es lo único que la capa de
 * presentación puede llamar: nunca un repositorio directamente.
 */
export const construyeCasosDeUso = (d: Dependencias) => ({
  cargarTemas: cargarTemas(d),

  crearTema: crearTema(d),
  renombrarTema: renombrarTema(d),
  borrarTema: borrarTema(d),

  buscarConocimientos: buscarConocimientos(d),
  cargarUltimosConocimientos: cargarUltimosConocimientos(d),
  contarConocimientos: contarConocimientos(d),
  crearConocimiento: crearConocimiento(d),
  editarConocimiento: editarConocimiento(d),
  borrarConocimiento: borrarConocimiento(d),
  obtenerConocimiento: obtenerConocimiento(d),

  cargarFotos: cargarFotos(d),
  anadirFoto: anadirFoto(d),
  quitarFoto: quitarFoto(d),

  sesionActual: sesionActual(d),
  iniciarSesion: iniciarSesion(d),
  cerrarSesion: cerrarSesion(d),
  actualizarNombre: actualizarNombre(d),

  /** El «hoy» que usa Inicio para «hace N días». */
  hoy: () => d.reloj.hoy(),
})

export type CasosDeUso = ReturnType<typeof construyeCasosDeUso>
export type { Dependencias }
export type { Instantanea } from './casos/datos'
export type { Entrada } from './casos/conocimientos'
