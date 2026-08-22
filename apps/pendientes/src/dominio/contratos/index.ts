import type { Pendiente } from '../modelo'

/**
 * Contratos: lo que el dominio necesita del mundo exterior, expresado como
 * interfaces. La capa de aplicación depende solo de esto; quien lo implementa
 * —memoria o Supabase— vive en `infraestructura/`.
 *
 * Se llaman contratos y no puertos: «puerto» es vocabulario de arquitectura
 * hexagonal, y esto son capas concéntricas. Está razonado en
 * `docs/como-se-escriben-las-aplicaciones.md`. La compra todavía los llama
 * `puertos/` y está pendiente de renombrar.
 */

/** Lo que se puede escribir de un pendiente. Todo lo demás lo pone el almacén. */
export type DatosPendiente = {
  titulo: string
  descripcion: string
  /** `YYYY-MM-DD`, o nulo para «alguna vez». */
  fechaPrevista: string | null
}

export interface RepositorioPendientes {
  /**
   * Todo lo que queda por hacer, **incluido lo apuntado para más adelante**.
   *
   * Se trae entero porque lo que una casa tiene a medias son unas pocas cosas,
   * siempre: no crece con el tiempo, se resuelve. La ventana de los siete días
   * se aplica al pintar y no aquí, para que lo apuntado para noviembre siga
   * siendo accesible —editable, borrable— en marzo.
   */
  listarPorHacer(): Promise<Pendiente[]>

  /**
   * Los últimos resueltos, del más reciente al más antiguo.
   *
   * Este sí va acotado, y es la diferencia importante con el de arriba: lo
   * hecho **crece indefinidamente**. En dos años son cientos de filas, y la
   * pantalla de Hechos enseña las últimas. Traerlo entero en cada arranque
   * para pintar dos grupos de mes es el error que en la compra hubo que
   * deshacer con el puerto de listas.
   */
  listarUltimosHechos(cuantos: number): Promise<Pendiente[]>

  /**
   * Cuántos se resolvieron en un mes (`YYYY-MM`), sin traerse las filas.
   *
   * Existe porque el pie de Hechos dice «N resueltos este mes» y esa cuenta ya
   * no sale de lo cargado: lo cargado son los últimos cinco, que pueden ser de
   * meses anteriores. Contra Supabase es un `count` de cabecera —no baja ni
   * una fila— y sale más barato que ampliar el listado solo para contar.
   */
  contarResueltosEn(mes: string): Promise<number>

  obtener(id: string): Promise<Pendiente | null>

  /** Nace por hacer. `creado` y `creadoPor` los pone quien guarda. */
  crear(datos: DatosPendiente): Promise<Pendiente>

  /**
   * Cambia título, descripción y fecha prevista, y **solo** eso.
   *
   * La fecha prevista sí se edita, a diferencia de las otras dos: `creado` y
   * `finalizado` son el registro de lo que pasó y no se retocan, mientras que
   * la fecha prevista es un plan, y los planes cambian.
   */
  editar(id: string, datos: DatosPendiente): Promise<Pendiente>

  /**
   * Da por hecho o deshace: con `true` se sella la fecha de realización y
   * quién lo cierra, con `false` vuelven las dos a nulo. Las dos van juntas
   * siempre; la tabla lo sostiene con un `check`.
   *
   * Es **idempotente**: si el pendiente ya no está, no hace nada en vez de
   * fallar. La aplicación la usan dos personas, así que la otra puede haberlo
   * borrado entre medias.
   *
   * Va aparte de `editar` por lo mismo que en la compra `marcarComprado` va
   * aparte de `guardarItems`: se toca desde la ficha con un dedo, y quien llama
   * ya sabe el estado que quiere dejar. Pasarlo por `editar` obligaría a mandar
   * además el título y la descripción, con el riesgo de pisarlos.
   */
  marcarHecho(id: string, hecho: boolean): Promise<void>

  borrar(id: string): Promise<void>
}

export type Sesion = {
  /**
   * El identificador de la cuenta, que es con lo que se comparan `creadoPor` y
   * `finalizadoPor` para saber si algo lo hiciste tú o la otra persona.
   */
  id: string
  email: string
}

export interface ServicioAutenticacion {
  sesionActual(): Promise<Sesion | null>
  entrar(email: string, contrasena: string): Promise<Sesion>
  salir(): Promise<void>
}

/**
 * El «hoy» de la aplicación. Es un contrato para que lo que depende de la
 * fecha —«hace 5 días», el saludo de Inicio, la ventana de los siete días— sea
 * comprobable sin tocar el reloj de la máquina.
 */
export interface Reloj {
  /** ISO 'YYYY-MM-DD' */
  hoy(): string
}
