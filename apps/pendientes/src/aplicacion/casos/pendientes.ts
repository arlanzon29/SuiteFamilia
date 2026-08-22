import type { Pendiente } from '../../dominio/modelo'
import type { Dependencias } from '../dependencias'

/**
 * Los casos de uso de un pendiente. El recorte del texto vive aquí —y no en la
 * pantalla ni en el repositorio— porque «un título en blanco no es un
 * pendiente» es una regla de la aplicación, no un detalle de la caja de texto
 * ni de la tabla.
 */

export const crearPendiente =
  (d: Dependencias) =>
  async (titulo: string, comentario: string): Promise<Pendiente | null> => {
    const t = titulo.trim()
    // Sin título no hay nada que apuntar. El comentario sí puede ir vacío: hay
    // cosas que se explican solas («pagar el recibo de la comunidad»).
    if (!t) return null
    return d.pendientes.crear({ titulo: t, comentario: comentario.trim() })
  }

export const editarPendiente =
  (d: Dependencias) =>
  async (id: string, titulo: string, comentario: string): Promise<Pendiente | null> => {
    const t = titulo.trim()
    if (!t) return null
    return d.pendientes.editar(id, { titulo: t, comentario: comentario.trim() })
  }

/** Sella la fecha de realización. Quien la pone es el almacén, no la pantalla. */
export const darPorHecho =
  (d: Dependencias) =>
  async (id: string): Promise<void> =>
    d.pendientes.marcarHecho(id, true)

/**
 * Vuelve a dejarlo por hacer: la fecha de realización se pone a nulo.
 *
 * Existe porque dar algo por hecho es un gesto de un toque y equivocarse es
 * fácil. En datos no cuesta nada, y es lo que ya hace la compra al reabrir una
 * lista cerrada.
 */
export const deshacerHecho =
  (d: Dependencias) =>
  async (id: string): Promise<void> =>
    d.pendientes.marcarHecho(id, false)

/**
 * Lo borra de verdad, sin papelera.
 *
 * Es la salida de lo apuntado por error: eso no debe quedarse en «Hechos»
 * fingiendo que se hizo. En la interfaz va como acción secundaria dentro de la
 * ficha —nunca en la fila de la lista— y con confirmación delante.
 */
export const borrarPendiente =
  (d: Dependencias) =>
  async (id: string): Promise<void> =>
    d.pendientes.borrar(id)
