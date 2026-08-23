import type { Tema } from '../../dominio/modelo'
import type { Dependencias } from '../dependencias'

/**
 * Los temas son la lista cerrada de categorías: se gestionan aparte, en
 * Ajustes, igual que los supermercados en la compra. Al crear o editar un
 * conocimiento se elige uno de los ya dados de alta, y no se escribe a mano
 * — así no aparecen «Receta» y «recetas» como dos temas distintos.
 */

export const crearTema =
  (d: Dependencias) =>
  async (nombre: string): Promise<Tema | null> => {
    const n = nombre.trim()
    if (!n) return null
    return d.temas.crear(n)
  }

export const renombrarTema =
  (d: Dependencias) =>
  async (id: string, nombre: string): Promise<Tema | null> => {
    const n = nombre.trim()
    if (!n) return null
    return d.temas.renombrar(id, n)
  }

/** Borra también, en cascada, los conocimientos de ese tema — lo dice la migración. */
export const borrarTema =
  (d: Dependencias) =>
  async (id: string): Promise<void> =>
    d.temas.borrar(id)
