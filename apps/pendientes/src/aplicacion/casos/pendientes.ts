import type { Pendiente } from '../../dominio/modelo'
import type { Dependencias } from '../dependencias'

/**
 * Los casos de uso de un pendiente. El recorte del texto vive aquí —y no en la
 * pantalla ni en el repositorio— porque «un título en blanco no es un
 * pendiente» es una regla de la aplicación, no un detalle de la caja de texto
 * ni de la tabla.
 */

/** Lo que la pantalla manda al crear o editar. La fecha puede no ir. */
export type Entrada = {
  titulo: string
  descripcion: string
  fechaPrevista: string | null
}

/**
 * Recorta y decide si hay algo que guardar.
 *
 * Devuelve nulo cuando el título se queda en blanco, que es lo que hace que
 * crear y editar compartan la misma regla en vez de tener cada uno la suya.
 */
const limpia = (e: Entrada): Entrada | null => {
  const titulo = e.titulo.trim()
  // Sin título no hay nada que apuntar. La descripción sí puede ir vacía: hay
  // cosas que se explican solas («pagar el recibo de la comunidad»).
  if (!titulo) return null
  return {
    titulo,
    descripcion: e.descripcion.trim(),
    // La cadena vacía de un campo de fecha sin rellenar es «alguna vez», que
    // en el modelo es nulo. Normalizarlo aquí evita que la distinción entre
    // «''» y «null» llegue a la tabla.
    fechaPrevista: e.fechaPrevista || null,
  }
}

export const crearPendiente =
  (d: Dependencias) =>
  async (entrada: Entrada): Promise<Pendiente | null> => {
    const datos = limpia(entrada)
    if (!datos) return null
    return d.pendientes.crear(datos)
  }

export const editarPendiente =
  (d: Dependencias) =>
  async (id: string, entrada: Entrada): Promise<Pendiente | null> => {
    const datos = limpia(entrada)
    if (!datos) return null
    return d.pendientes.editar(id, datos)
  }

/**
 * Sella la fecha de realización y quién lo cierra. Las dos las pone el
 * almacén, no la pantalla: la fecha porque el reloj de un móvil puede estar
 * torcido, y la persona porque sale del token de la sesión.
 */
export const darPorHecho =
  (d: Dependencias) =>
  async (id: string): Promise<void> =>
    d.pendientes.marcarHecho(id, true)

/**
 * Vuelve a dejarlo por hacer: la fecha de realización y quién lo cerró se
 * ponen a nulo, las dos a la vez.
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

/** Uno solo, para la ficha. */
export const obtenerPendiente =
  (d: Dependencias) =>
  async (id: string): Promise<Pendiente | null> =>
    d.pendientes.obtener(id)
