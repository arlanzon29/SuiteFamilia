import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type { Pendiente } from '../../dominio/modelo'
import type { DatosPendiente, RepositorioPendientes } from '../../dominio/contratos'

/**
 * Los pendientes, contra la tabla `pendientes` de Supabase.
 *
 * La tabla la crea `supabase/migracion-06-pendientes.sql`, y ahí está razonada
 * columna por columna. Lo que importa desde aquí:
 *
 * - **`id` es un autonumérico** y el dominio lo quiere como texto, así que se
 *   convierte al entrar y al salir. Es la única traducción de identidad que
 *   hay, y es de ida y vuelta: `String(fila.id)` al leer, `Number(id)` al
 *   escribir.
 * - **`creado`, `creado_por` y las dos de cierre no se mandan nunca.** Las
 *   pone la base: `now()` y `auth.uid()` al insertar, y las de cierre al
 *   marcar. Mandarlas desde aquí sería dejar que el reloj de un móvil ordenara
 *   la lista de la otra persona.
 * - **`fecha_prevista` viaja tal cual**, `YYYY-MM-DD`, porque es un día y no
 *   un instante: no hay zona que convertir.
 */

/** La fila tal y como viene de la tabla. */
type Fila = {
  id: number
  titulo: string
  descripcion: string
  creado: string
  creado_por: string | null
  finalizado: string | null
  finalizado_por: string | null
  fecha_prevista: string | null
}

/** Las columnas que se piden. Explícitas, para que un `select *` no traiga de más. */
const COLUMNAS = 'id, titulo, descripcion, creado, creado_por, finalizado, finalizado_por, fecha_prevista'

const aDominio = (f: Fila): Pendiente => ({
  id: String(f.id),
  titulo: f.titulo,
  descripcion: f.descripcion,
  creado: f.creado,
  creadoPor: f.creado_por,
  finalizado: f.finalizado,
  finalizadoPor: f.finalizado_por,
  fechaPrevista: f.fecha_prevista,
})

/** Supabase responde en inglés; la interfaz habla en castellano. */
const revienta = (error: PostgrestError): never => {
  const m = error.message.toLowerCase()
  if (m.includes('failed to fetch')) throw new Error('Sin conexión con el servidor.')
  throw new Error(error.message)
}

export const repositorioPendientesSupabase = (
  sb: SupabaseClient,
): RepositorioPendientes => ({
  /**
   * Todo lo que queda por hacer, **incluido lo apuntado para más adelante**.
   *
   * Se trae entero a propósito: lo que una casa tiene a medias son unas pocas
   * cosas y no crece con el tiempo, se resuelve. La ventana de los siete días
   * se aplica al pintar, para que lo apuntado para noviembre siga siendo
   * editable y borrable en marzo.
   */
  async listarPorHacer(): Promise<Pendiente[]> {
    const { data, error } = await sb
      .from('pendientes')
      .select(COLUMNAS)
      .is('finalizado', null)
      .order('creado', { ascending: true })
    if (error) revienta(error)
    return ((data ?? []) as Fila[]).map(aDominio)
  },

  /**
   * Los últimos resueltos. Este sí va acotado, y es la diferencia importante
   * con el de arriba: lo hecho crece indefinidamente.
   */
  async listarUltimosHechos(cuantos: number): Promise<Pendiente[]> {
    const { data, error } = await sb
      .from('pendientes')
      .select(COLUMNAS)
      .not('finalizado', 'is', null)
      .order('finalizado', { ascending: false })
      .limit(cuantos)
    if (error) revienta(error)
    return ((data ?? []) as Fila[]).map(aDominio)
  },

  /**
   * La cuenta del mes, **sin traer ni una fila**: `head: true` manda un HEAD y
   * la cifra viene en la cabecera `Content-Range`. Por eso sale más barato que
   * ampliar el listado solo para poder contar.
   *
   * Los dos extremos se calculan en la zona de quien mira —`mes` llega ya
   * resuelto por la pantalla— y se comparan contra un instante, que es lo que
   * es `finalizado`. El límite superior es «menor que el día 1 del mes que
   * viene» y no «menor o igual que el último día», que se dejaría fuera todo
   * lo cerrado durante ese último día.
   */
  async contarResueltosEn(mes: string): Promise<number> {
    const [a, m] = mes.split('-').map(Number)
    const desde = new Date(a, m - 1, 1).toISOString()
    const hasta = new Date(a, m, 1).toISOString()
    const { count, error } = await sb
      .from('pendientes')
      .select('id', { count: 'exact', head: true })
      .gte('finalizado', desde)
      .lt('finalizado', hasta)
    if (error) revienta(error)
    return count ?? 0
  },

  async obtener(id: string): Promise<Pendiente | null> {
    const { data, error } = await sb
      .from('pendientes')
      .select(COLUMNAS)
      // `maybeSingle` y no `single`: que no esté es una respuesta válida —la
      // otra persona ha podido borrarlo— y no un fallo que haya que enseñar.
      .eq('id', Number(id))
      .maybeSingle()
    if (error) revienta(error)
    return data ? aDominio(data as Fila) : null
  },

  async crear(datos: DatosPendiente): Promise<Pendiente> {
    const { data, error } = await sb
      .from('pendientes')
      .insert({
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        fecha_prevista: datos.fechaPrevista,
      })
      .select(COLUMNAS)
      .single()
    if (error) revienta(error)
    return aDominio(data as Fila)
  },

  /** Título, descripción y fecha prevista. Las otras dos fechas no se tocan. */
  async editar(id: string, datos: DatosPendiente): Promise<Pendiente> {
    const { data, error } = await sb
      .from('pendientes')
      .update({
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        fecha_prevista: datos.fechaPrevista,
      })
      .eq('id', Number(id))
      .select(COLUMNAS)
      .single()
    if (error) revienta(error)
    return aDominio(data as Fila)
  },

  /**
   * Da por hecho o deshace. Idempotente: si la fila ya no está, el `update` no
   * toca nada y no falla, que es justo lo que pide el contrato.
   *
   * La fecha y la persona van **en la misma escritura**, en los dos sentidos.
   * La tabla lo sostiene con un `check`, así que separarlas en dos llamadas
   * sería además un error a medio camino.
   *
   * `now()` y `auth.uid()` no se pueden pedir desde el cliente en un `update`
   * normal, así que aquí sí viajan calculados: el instante del navegador y el
   * identificador de la sesión, que es el mismo que lleva el token.
   */
  async marcarHecho(id: string, hecho: boolean): Promise<void> {
    const { data } = await sb.auth.getSession()
    const quien = data.session?.user.id ?? null
    const { error } = await sb
      .from('pendientes')
      .update(
        hecho
          ? { finalizado: new Date().toISOString(), finalizado_por: quien }
          : { finalizado: null, finalizado_por: null },
      )
      .eq('id', Number(id))
    if (error) revienta(error)
  },

  async borrar(id: string): Promise<void> {
    const { error } = await sb.from('pendientes').delete().eq('id', Number(id))
    if (error) revienta(error)
  },
})
