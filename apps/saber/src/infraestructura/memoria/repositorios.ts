import type { Conocimiento, Tema } from '../../dominio/modelo'
import { porRecencia } from '../../dominio/modelo'
import type {
  DatosConocimiento,
  FiltroConocimientos,
  Foto,
  RepositorioConocimientos,
  RepositorioFotos,
  RepositorioTemas,
} from '../../dominio/contratos'
import { copia, nuevoId, type Almacen } from './almacen'
import { ID_LOCAL } from './autenticacion'

/**
 * Implementación de los contratos contra memoria. Es lo que sostiene la
 * aplicación cuando no hay `.env`, y lo que permite revisar la interfaz sin
 * credenciales.
 *
 * `RepositorioConocimientos.listar` recibe el mismo filtro que la versión de
 * Supabase y lo aplica aquí, en el array — en memoria no hay servidor al que
 * preguntar, así que «server-side» no aplica, pero la forma del contrato es
 * la misma en los dos caminos.
 */

export const repositorioTemasMemoria = (a: Almacen): RepositorioTemas => ({
  async listar(): Promise<Tema[]> {
    return copia(a.temas)
  },
  async crear(nombre: string): Promise<Tema> {
    const t: Tema = { id: nuevoId('t'), nombre }
    a.temas.push(t)
    return { ...t }
  },
  async renombrar(id: string, nombre: string): Promise<Tema> {
    const t = a.temas.find((x) => x.id === id)
    if (!t) throw new Error('El tema ya no existe.')
    const anterior = t.nombre
    t.nombre = nombre
    a.conocimientos = a.conocimientos.map((c) =>
      c.tema === anterior ? { ...c, tema: nombre } : c,
    )
    return { ...t }
  },
  async borrar(id: string): Promise<void> {
    a.temas = a.temas.filter((x) => x.id !== id)
    a.conocimientos = a.conocimientos.filter((c) => c.tema !== id)
  },
})

const coincide = (c: Conocimiento, filtro?: FiltroConocimientos): boolean => {
  if (!filtro) return true
  if (filtro.tema && c.tema !== filtro.tema) return false
  if (filtro.soloDe && c.creadoPor !== filtro.soloDe) return false
  const q = filtro.q?.trim().toLowerCase()
  if (q && !c.titulo.toLowerCase().includes(q) && !c.descripcion.toLowerCase().includes(q)) {
    return false
  }
  return true
}

export const repositorioConocimientosMemoria = (a: Almacen): RepositorioConocimientos => ({
  async listar(filtro?: FiltroConocimientos): Promise<Conocimiento[]> {
    return copia(a.conocimientos.filter((c) => coincide(c, filtro)).sort(porRecencia))
  },
  async listarUltimos(cuantos: number): Promise<Conocimiento[]> {
    return copia([...a.conocimientos].sort(porRecencia).slice(0, cuantos))
  },
  async contar(): Promise<number> {
    return a.conocimientos.length
  },
  async obtener(id: string): Promise<Conocimiento | null> {
    const c = a.conocimientos.find((x) => x.id === id)
    return c ? { ...c } : null
  },
  async crear(datos: DatosConocimiento): Promise<Conocimiento> {
    const c: Conocimiento = {
      id: nuevoId('c'),
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      tema: datos.tema,
      enlace: datos.enlace,
      creado: new Date().toISOString(),
      creadoPor: ID_LOCAL,
    }
    a.conocimientos.push(c)
    return { ...c }
  },
  async editar(id: string, datos: DatosConocimiento): Promise<Conocimiento> {
    const c = a.conocimientos.find((x) => x.id === id)
    if (!c) throw new Error('El conocimiento ya no existe.')
    c.titulo = datos.titulo
    c.descripcion = datos.descripcion
    c.tema = datos.tema
    c.enlace = datos.enlace
    return { ...c }
  },
  async borrar(id: string): Promise<void> {
    a.conocimientos = a.conocimientos.filter((x) => x.id !== id)
    delete a.fotos[id]
  },
})

/**
 * Fotos sin servidor: el fichero se queda en el navegador y se sirve por
 * `blob:`. No sobrevive a una recarga a propósito, igual que en la compra: es
 * solo el camino sin `.env`.
 */
export const repositorioFotosMemoria = (a: Almacen): RepositorioFotos => ({
  async listar(): Promise<Record<string, Foto[]>> {
    const copiado: Record<string, Foto[]> = {}
    for (const [id, fotos] of Object.entries(a.fotos)) copiado[id] = fotos.map((f) => ({ ...f }))
    return copiado
  },
  async anadir(conocimientoId: string, fichero: Blob): Promise<void> {
    const url = URL.createObjectURL(fichero)
    const foto: Foto = { id: nuevoId('f'), fila: url, ficha: url }
    a.fotos[conocimientoId] = [...(a.fotos[conocimientoId] ?? []), foto]
  },
  async quitar(conocimientoId: string, fotoId: string): Promise<void> {
    const fotos = a.fotos[conocimientoId]
    if (!fotos) return
    const foto = fotos.find((f) => f.id === fotoId)
    if (foto) URL.revokeObjectURL(foto.ficha)
    a.fotos[conocimientoId] = fotos.filter((f) => f.id !== fotoId)
  },
})
