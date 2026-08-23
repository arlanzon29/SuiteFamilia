/** Una categoría del conocimiento: «recetas», «bricolaje», «salud»… */
export type Tema = {
  id: string
  nombre: string
}

/** Ordena por nombre con las reglas del español (acentos, ñ). */
export const porNombre = (a: Tema, b: Tema): number =>
  a.nombre.localeCompare(b.nombre, 'es')
