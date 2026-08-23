import type { Conocimiento } from '../../dominio/modelo'
import type { DatosConocimiento, FiltroConocimientos } from '../../dominio/contratos'
import type { Dependencias } from '../dependencias'

/**
 * Los casos de uso de un conocimiento. El recorte del texto vive aquí y no en
 * la pantalla ni en el repositorio: «un título en blanco no es un
 * conocimiento» es una regla de la aplicación.
 */

/** Lo que la pantalla manda al crear o editar. */
export type Entrada = {
  titulo: string
  descripcion: string
  tema: string
  /** Cadena vacía o solo espacios cuenta como «sin enlace». */
  enlace: string
}

/**
 * Recorta y decide si hay algo que guardar.
 *
 * Devuelve nulo cuando falta el título o el tema, que es lo que hace que
 * crear y editar compartan la misma regla.
 */
const limpia = (e: Entrada): DatosConocimiento | null => {
  const titulo = e.titulo.trim()
  const tema = e.tema.trim()
  if (!titulo || !tema) return null
  return {
    titulo,
    descripcion: e.descripcion.trim(),
    tema,
    enlace: e.enlace.trim() || null,
  }
}

/** El listado filtrado. Va contra la consulta, no contra un array ya cargado. */
export const buscarConocimientos =
  (d: Dependencias) =>
  async (filtro?: FiltroConocimientos): Promise<Conocimiento[]> =>
    d.conocimientos.listar(filtro)

/** Los últimos apuntados, para Inicio. */
export const cargarUltimosConocimientos =
  (d: Dependencias) =>
  async (cuantos: number): Promise<Conocimiento[]> =>
    d.conocimientos.listarUltimos(cuantos)

/** Cuántos hay en total, para la cifra de Inicio. */
export const contarConocimientos =
  (d: Dependencias) =>
  async (): Promise<number> =>
    d.conocimientos.contar()

export const crearConocimiento =
  (d: Dependencias) =>
  async (entrada: Entrada): Promise<Conocimiento | null> => {
    const datos = limpia(entrada)
    if (!datos) return null
    return d.conocimientos.crear(datos)
  }

export const editarConocimiento =
  (d: Dependencias) =>
  async (id: string, entrada: Entrada): Promise<Conocimiento | null> => {
    const datos = limpia(entrada)
    if (!datos) return null
    return d.conocimientos.editar(id, datos)
  }

export const borrarConocimiento =
  (d: Dependencias) =>
  async (id: string): Promise<void> =>
    d.conocimientos.borrar(id)

/** Uno solo, para la ficha. */
export const obtenerConocimiento =
  (d: Dependencias) =>
  async (id: string): Promise<Conocimiento | null> =>
    d.conocimientos.obtener(id)
