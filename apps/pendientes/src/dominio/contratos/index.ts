import type { Pendiente } from '../modelo'

/**
 * Contratos: lo que el dominio necesita del mundo exterior, expresado como
 * interfaces. La capa de aplicación depende solo de esto; quien lo implementa
 * —memoria hoy, Supabase después— vive en `infraestructura/`.
 *
 * Se llaman contratos y no puertos: «puerto» es vocabulario de arquitectura
 * hexagonal, y esto son capas concéntricas. Está razonado en
 * `docs/como-se-escriben-las-aplicaciones.md`. La compra todavía los llama
 * `puertos/` y está pendiente de renombrar.
 *
 * Todo es asíncrono a propósito, aunque hoy los datos estén en memoria: es lo
 * que permite que la implementación de Supabase entre sin tocar ni un caso de
 * uso ni una pantalla.
 */

export interface RepositorioPendientes {
  listar(): Promise<Pendiente[]>
  obtener(id: string): Promise<Pendiente | null>
  /** Nace por hacer: `hecho` a nulo, y `creado` lo pone quien guarda. */
  crear(datos: { titulo: string; comentario: string }): Promise<Pendiente>
  /**
   * Cambia título y comentario, y **solo** eso. Las dos fechas no se editan a
   * mano: una es cuándo se apuntó y la otra cuándo se resolvió, y las dos son
   * hechos, no opiniones.
   */
  editar(id: string, datos: { titulo: string; comentario: string }): Promise<Pendiente>
  /**
   * Da por hecho o deshace: con `true` se sella la fecha de realización, con
   * `false` vuelve a nulo.
   *
   * Es **idempotente**: si el pendiente ya no está, no hace nada en vez de
   * fallar. La aplicación la usan dos personas, así que la otra puede haberlo
   * borrado entre medias.
   *
   * Va aparte de `editar` por lo mismo que en la compra `marcarComprado` va
   * aparte de `guardarItems`: se toca desde la ficha con un dedo, y quien llama
   * ya sabe el estado que quiere dejar. Pasarlo por `editar` obligaría a mandar
   * además el título y el comentario, con el riesgo de pisarlos.
   */
  marcarHecho(id: string, hecho: boolean): Promise<void>
  borrar(id: string): Promise<void>
}

export type Sesion = {
  email: string
}

export interface ServicioAutenticacion {
  sesionActual(): Promise<Sesion | null>
  entrar(email: string, contrasena: string): Promise<Sesion>
  salir(): Promise<void>
}

/**
 * El «hoy» de la aplicación. Es un contrato para que lo que depende de la
 * fecha —«hace 5 días», el saludo de Inicio— sea comprobable sin tocar el
 * reloj de la máquina.
 */
export interface Reloj {
  /** ISO 'YYYY-MM-DD' */
  hoy(): string
}
