import type { Pendiente } from '../../dominio/modelo'
import { hechos } from '../../dominio/modelo'
import { resueltosEn } from '../../dominio/servicios/agrupacion'
import type { DatosPendiente, RepositorioPendientes } from '../../dominio/contratos'
import { copia, nuevoId, type Almacen } from './almacen'
import { ID_LOCAL } from './autenticacion'

/**
 * Implementación de los contratos contra memoria. Es lo que sostiene la
 * aplicación cuando no hay `.env`, y lo que permite revisar la interfaz sin
 * credenciales.
 *
 * Las fechas y la persona las pone **el almacén**, nunca quien llama: son el
 * registro de cuándo pasó algo y de quién lo hizo. Contra Supabase las pone el
 * servidor, que además evita que el reloj torcido de un móvil ordene mal la
 * lista de la otra persona.
 */

export const repositorioPendientesMemoria = (a: Almacen): RepositorioPendientes => ({
  /**
   * Todo lo que queda, **incluido lo de más adelante**: la ventana de los
   * siete días la aplica la pantalla, no el almacén. `porHacer` del dominio sí
   * la aplica, así que aquí no se usa —solo el filtro de lo no resuelto—.
   */
  async listarPorHacer(): Promise<Pendiente[]> {
    return copia(a.pendientes.filter((p) => p.finalizado === null))
  },

  async listarUltimosHechos(cuantos: number): Promise<Pendiente[]> {
    return copia(hechos(a.pendientes).slice(0, cuantos))
  },

  async contarResueltosEn(mes: string): Promise<number> {
    return resueltosEn(a.pendientes, mes)
  },

  async obtener(id: string): Promise<Pendiente | null> {
    const p = a.pendientes.find((x) => x.id === id)
    return p ? { ...p } : null
  },

  async crear(datos: DatosPendiente): Promise<Pendiente> {
    const p: Pendiente = {
      id: nuevoId('p'),
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      creado: new Date().toISOString(),
      creadoPor: ID_LOCAL,
      finalizado: null,
      finalizadoPor: null,
      fechaPrevista: datos.fechaPrevista,
      importante: datos.importante,
    }
    a.pendientes.push(p)
    return { ...p }
  },

  async editar(id: string, datos: DatosPendiente): Promise<Pendiente> {
    const p = a.pendientes.find((x) => x.id === id)
    if (!p) throw new Error('El pendiente ya no existe.')
    p.titulo = datos.titulo
    p.descripcion = datos.descripcion
    p.fechaPrevista = datos.fechaPrevista
    p.importante = datos.importante
    return { ...p }
  },

  async marcarHecho(id: string, hecho: boolean): Promise<void> {
    // Idempotente y silencioso si ya no está, igual que contra Supabase: la
    // otra persona puede haberlo borrado entre medias.
    const p = a.pendientes.find((x) => x.id === id)
    if (!p) return
    // La fecha y la persona van juntas siempre, en los dos sentidos. La tabla
    // lo sostiene con un `check`; aquí se sostiene escribiéndolas a la vez.
    p.finalizado = hecho ? new Date().toISOString() : null
    p.finalizadoPor = hecho ? ID_LOCAL : null
  },

  async borrar(id: string): Promise<void> {
    a.pendientes = a.pendientes.filter((x) => x.id !== id)
  },
})
