import type { Conocimiento, Tema } from '../modelo'

/**
 * Contratos: lo que el dominio necesita del mundo exterior, expresado como
 * interfaces. La capa de aplicación depende solo de esto; quien lo implementa
 * —memoria o Supabase— vive en `infraestructura/`.
 *
 * Se llaman contratos y no puertos, siguiendo la corrección que ya hizo
 * Pendientes: está razonado en `docs/como-se-escriben-las-aplicaciones.md`.
 */

export interface RepositorioTemas {
  listar(): Promise<Tema[]>
  crear(nombre: string): Promise<Tema>
  renombrar(id: string, nombre: string): Promise<Tema>
  /** Solo tiene sentido si el tema no tiene conocimientos dentro; ver la implementación. */
  borrar(id: string): Promise<void>
}

/** Lo que se puede escribir de un conocimiento. Lo demás lo pone el almacén. */
export type DatosConocimiento = {
  titulo: string
  descripcion: string
  tema: string
  /** Nulo si no lleva enlace. */
  enlace: string | null
}

/**
 * El filtro del listado, pensado para viajar en la consulta y no aplicarse
 * después en el cliente: contra Supabase se traduce en `.eq()` / `.ilike()`,
 * así que el servidor devuelve solo lo que la pantalla va a pintar. Es una
 * diferencia deliberada con la compra y con Pendientes, que sí traen su tabla
 * entera —ahí es una tabla de una casa; aquí se pidió server-side desde el
 * principio—.
 */
export type FiltroConocimientos = {
  /** Solo los de este tema. */
  tema?: string | null
  /** Solo los que apuntó esta cuenta. */
  soloDe?: string | null
  /** Busca en título y descripción. */
  q?: string
}

export interface RepositorioConocimientos {
  /** Siempre de lo más reciente a lo más antiguo. */
  listar(filtro?: FiltroConocimientos): Promise<Conocimiento[]>
  /** Los últimos `cuantos`, para Inicio. Más barato que pedir el listado entero y recortarlo. */
  listarUltimos(cuantos: number): Promise<Conocimiento[]>
  /** Cuántos hay en total, sin traerse ni una fila. */
  contar(): Promise<number>
  obtener(id: string): Promise<Conocimiento | null>
  /** Nace con `creado` y `creadoPor` puestos por quien guarda. */
  crear(datos: DatosConocimiento): Promise<Conocimiento>
  editar(id: string, datos: DatosConocimiento): Promise<Conocimiento>
  borrar(id: string): Promise<void>
}

/** Una foto de la galería de un conocimiento. */
export type Foto = {
  id: string
  fila: string
  ficha: string
}

/**
 * Fotos de un conocimiento, en galería: puede haber varias, a diferencia de
 * la foto única de producto que tiene la compra.
 *
 * Igual que las imágenes de la compra: se piden **una vez por sesión** y solo
 * se refrescan cuando alguna cambia, porque no viajan con `cargarTodo`.
 */
export interface RepositorioFotos {
  /** Todas las fotos de todos los conocimientos, agrupadas por su id. */
  listar(): Promise<Record<string, Foto[]>>
  /** Añade una foto al final de la galería. Recibe el fichero tal cual sale del móvil. */
  anadir(conocimientoId: string, fichero: Blob): Promise<void>
  quitar(conocimientoId: string, fotoId: string): Promise<void>
}

export type Sesion = {
  /** El identificador de la cuenta, con el que se compara `creadoPor`. */
  id: string
  email: string
  /** El nombre de pila, si se ha guardado. Nulo hasta que alguien lo pone desde Ajustes. */
  nombre: string | null
}

export interface ServicioAutenticacion {
  sesionActual(): Promise<Sesion | null>
  entrar(email: string, contrasena: string): Promise<Sesion>
  salir(): Promise<void>
  actualizarNombre(nombre: string): Promise<Sesion>
}

/** El «hoy» de la aplicación, para lo poco que dependa de la fecha (Inicio, «hace N días»). */
export interface Reloj {
  /** ISO 'YYYY-MM-DD' */
  hoy(): string
}
