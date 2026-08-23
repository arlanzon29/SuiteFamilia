import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type { Conocimiento } from '../../dominio/modelo'
import type {
  DatosConocimiento,
  FiltroConocimientos,
  RepositorioConocimientos,
} from '../../dominio/contratos'

/**
 * Conocimientos, contra la tabla `conocimientos` de Supabase.
 *
 * La tabla la crea `supabase/migracion-08-saber.sql`. Lo que importa desde
 * aquí:
 *
 * - **El filtro se traduce en la consulta**, no se aplica después: `tema` es
 *   `.eq()`, `soloDe` es `.eq('creado_por', …)`, `q` es `.or(ilike, ilike)`.
 *   El servidor devuelve solo las filas que la pantalla va a pintar — es la
 *   diferencia con `articulos`/`pendientes`, que sí se traen enteros.
 * - **`creado` y `creado_por` no se mandan nunca**: los pone la base.
 * - **`enlace` viaja tal cual**, con cadena vacía convertida a `null` ya en
 *   el caso de uso, antes de llegar aquí.
 */

type Fila = {
  id: string
  titulo: string
  descripcion: string
  tema: string
  enlace: string | null
  creado: string
  creado_por: string | null
}

const COLUMNAS = 'id, titulo, descripcion, tema, enlace, creado, creado_por'

const aDominio = (f: Fila): Conocimiento => ({
  id: f.id,
  titulo: f.titulo,
  descripcion: f.descripcion,
  tema: f.tema,
  enlace: f.enlace,
  creado: f.creado,
  creadoPor: f.creado_por,
})

const revienta = (error: PostgrestError): never => {
  const m = error.message.toLowerCase()
  if (m.includes('failed to fetch')) throw new Error('Sin conexión con el servidor.')
  if (error.code === '23514') throw new Error('El título debe tener entre 1 y 120 caracteres.')
  if (error.code === '23503') throw new Error('Ese tema ya no existe.')
  throw new Error(error.message)
}

/** Escapa `%`, `_` y `,` para que un texto de búsqueda no rompa el `.or()` de PostgREST. */
const escapaIlike = (s: string): string => s.replace(/[%_,]/g, (c) => `\\${c}`)

export const repositorioConocimientosSupabase = (
  sb: SupabaseClient,
): RepositorioConocimientos => ({
  async listar(filtro?: FiltroConocimientos): Promise<Conocimiento[]> {
    let consulta = sb.from('conocimientos').select(COLUMNAS).order('creado', { ascending: false })
    if (filtro?.tema) consulta = consulta.eq('tema', filtro.tema)
    if (filtro?.soloDe) consulta = consulta.eq('creado_por', filtro.soloDe)
    const q = filtro?.q?.trim()
    if (q) {
      const t = `%${escapaIlike(q)}%`
      consulta = consulta.or(`titulo.ilike.${t},descripcion.ilike.${t}`)
    }
    const { data, error } = await consulta
    if (error) revienta(error)
    return (data as Fila[]).map(aDominio)
  },

  async listarUltimos(cuantos: number): Promise<Conocimiento[]> {
    const { data, error } = await sb
      .from('conocimientos')
      .select(COLUMNAS)
      .order('creado', { ascending: false })
      .limit(cuantos)
    if (error) revienta(error)
    return (data as Fila[]).map(aDominio)
  },

  /** `head: true`: la cifra sale de la cabecera `Content-Range`, sin traerse ni una fila. */
  async contar(): Promise<number> {
    const { count, error } = await sb
      .from('conocimientos')
      .select('id', { count: 'exact', head: true })
    if (error) revienta(error)
    return count ?? 0
  },

  async obtener(id: string): Promise<Conocimiento | null> {
    const { data, error } = await sb
      .from('conocimientos')
      .select(COLUMNAS)
      .eq('id', id)
      .maybeSingle()
    if (error) revienta(error)
    return data ? aDominio(data as Fila) : null
  },

  async crear(datos: DatosConocimiento): Promise<Conocimiento> {
    const { data, error } = await sb
      .from('conocimientos')
      .insert({
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        tema: datos.tema,
        enlace: datos.enlace,
      })
      .select(COLUMNAS)
      .single()
    if (error) revienta(error)
    return aDominio(data as Fila)
  },

  async editar(id: string, datos: DatosConocimiento): Promise<Conocimiento> {
    const { data, error } = await sb
      .from('conocimientos')
      .update({
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        tema: datos.tema,
        enlace: datos.enlace,
      })
      .eq('id', id)
      .select(COLUMNAS)
      .single()
    if (error) revienta(error)
    return aDominio(data as Fila)
  },

  async borrar(id: string): Promise<void> {
    const { error } = await sb.from('conocimientos').delete().eq('id', id)
    if (error) revienta(error)
  },
})
