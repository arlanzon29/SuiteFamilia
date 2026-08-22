import type { Pendiente } from '../../dominio/modelo'
import type { RepositorioPendientes } from '../../dominio/contratos'
import { copia, nuevoId, type Almacen } from './almacen'

/**
 * Implementación de los contratos contra memoria. Es el almacén que sostiene la
 * aplicación hasta que entren los repositorios de Supabase; los casos de uso no
 * cambian al sustituirlos.
 *
 * Las dos fechas las pone **el almacén**, nunca quien llama: son el registro de
 * cuándo pasó algo. Contra Supabase las pondrá el servidor con `now()`, que
 * además evita que el reloj torcido de un móvil ordene mal la lista de la otra
 * persona.
 */
export const repositorioPendientesMemoria = (a: Almacen): RepositorioPendientes => ({
  async listar(): Promise<Pendiente[]> {
    return copia(a.pendientes)
  },
  async obtener(id: string): Promise<Pendiente | null> {
    const p = a.pendientes.find((x) => x.id === id)
    return p ? { ...p } : null
  },
  async crear(datos: { titulo: string; comentario: string }): Promise<Pendiente> {
    const p: Pendiente = {
      id: nuevoId('p'),
      titulo: datos.titulo,
      comentario: datos.comentario,
      creado: new Date().toISOString(),
      hecho: null,
    }
    a.pendientes.push(p)
    return { ...p }
  },
  async editar(
    id: string,
    datos: { titulo: string; comentario: string },
  ): Promise<Pendiente> {
    const p = a.pendientes.find((x) => x.id === id)
    if (!p) throw new Error('El pendiente ya no existe.')
    p.titulo = datos.titulo
    p.comentario = datos.comentario
    return { ...p }
  },
  async marcarHecho(id: string, hecho: boolean): Promise<void> {
    // Idempotente y silencioso si ya no está, igual que contra Supabase: la
    // otra persona puede haberlo borrado entre medias.
    const p = a.pendientes.find((x) => x.id === id)
    if (!p) return
    p.hecho = hecho ? new Date().toISOString() : null
  },
  async borrar(id: string): Promise<void> {
    a.pendientes = a.pendientes.filter((x) => x.id !== id)
  },
})
