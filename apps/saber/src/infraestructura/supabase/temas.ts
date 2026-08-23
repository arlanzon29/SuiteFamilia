import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type { Tema } from '../../dominio/modelo'
import type { RepositorioTemas } from '../../dominio/contratos'

/**
 * Temas, contra la tabla `temas` de Supabase. Mismo patrón que
 * `supermercados` en la compra: el nombre **es** la clave primaria (`citext`,
 * así que «Recetas» y «recetas» son el mismo tema), y aquí `id === nombre`.
 */

type Fila = { nombre: string }

const aDominio = (f: Fila): Tema => ({ id: f.nombre, nombre: f.nombre })

const mensaje = (e: PostgrestError): string => {
  if (e.code === '23505') return 'Ya existe un tema con ese nombre.'
  if (e.code === '23514') return 'El nombre debe tener entre 1 y 50 caracteres.'
  if (e.code === '42501') return 'La sesión no tiene permiso para esto.'
  return e.message
}

export const repositorioTemasSupabase = (sb: SupabaseClient): RepositorioTemas => ({
  async listar(): Promise<Tema[]> {
    const { data, error } = await sb.from('temas').select('nombre').order('nombre')
    if (error) throw new Error(mensaje(error))
    return (data as Fila[]).map(aDominio)
  },

  async crear(nombre: string): Promise<Tema> {
    const { data, error } = await sb.from('temas').insert({ nombre }).select('nombre').single()
    if (error) throw new Error(mensaje(error))
    return aDominio(data as Fila)
  },

  async renombrar(id: string, nombre: string): Promise<Tema> {
    const { data, error } = await sb
      .from('temas')
      .update({ nombre })
      .eq('nombre', id)
      .select('nombre')
      .single()
    if (error) throw new Error(mensaje(error))
    if (!data) throw new Error('El tema ya no existe.')
    return aDominio(data as Fila)
  },

  /** El `on delete cascade` de `conocimientos.tema` se lleva sus conocimientos. */
  async borrar(id: string): Promise<void> {
    const { error } = await sb.from('temas').delete().eq('nombre', id)
    if (error) throw new Error(mensaje(error))
  },
})
