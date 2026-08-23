/**
 * Un pendiente: algo de la casa que está a medias y no se puede olvidar.
 *
 * Sin prioridades, sin etiquetas, sin persona asignada: en una casa de dos, lo
 * que ordena la lista es la antigüedad y lo que aclara el reparto es hablarlo,
 * no un campo. `creadoPor` y `finalizadoPor` **no son eso**: son historia de
 * quién hizo qué, no un reparto de trabajo ni un permiso.
 *
 * `finalizado` es toda la máquina de estados que tiene esto: nulo mientras
 * está por hacer, y con fecha cuando se resolvió. Deshacer es volver a ponerlo
 * a nulo, y por eso no hay ningún campo de estado aparte que pudiera
 * contradecirlo. Se sopesó tenerlo —'P' y 'C'— y se dejó fuera por eso mismo;
 * está razonado en `supabase/migracion-06-pendientes.sql`.
 */
export type Pendiente = {
  /**
   * En la tabla es un autonumérico, y aquí va como texto.
   *
   * No es descuido: el identificador de un pendiente solo se compara y se pasa
   * por la ruta de la ficha, nunca se suma ni se ordena por él. Tenerlo como
   * texto evita que un `id` numérico se cuele en un sitio donde se esperaba
   * una cadena y salga un `1` donde debía ir `"1"`.
   */
  id: string
  /** Una línea. Es lo que se lee en la fila de la lista. */
  titulo: string
  /** Todo lo que haga falta recordar. Puede estar vacía. */
  descripcion: string
  /**
   * Cuándo se anotó, en ISO completo con zona: `2026-08-17T08:37:00.123Z`.
   *
   * Es un **instante**, no un día. La diferencia importa: cortar el ISO por la
   * `T` da el día en UTC, que a partir de las diez de la noche en España ya es
   * el de mañana. El día se calcula en la pantalla, en la zona de quien mira.
   */
  creado: string
  /**
   * Quién lo apuntó, por su identificador de cuenta. Nulo si esa cuenta ya no
   * existe.
   *
   * Es el identificador y **no el correo** por una razón de fuera: el correo
   * vive en `auth.users`, que PostgREST no expone, así que una consulta a
   * `pendientes` no puede traerlo. La pantalla no lo necesita para lo único
   * que hace con esto —decir «tú» o «la otra persona»—, que sale de comparar
   * con la sesión. Poner nombres de verdad pediría una tabla de perfiles, y
   * hoy no la hay ni en la compra.
   */
  creadoPor: string | null
  /** Cuándo se dio por hecho, en el mismo formato. Nulo mientras esté por hacer. */
  finalizado: string | null
  /** Quién lo cerró, igual que el anterior. Nulo mientras esté por hacer. */
  finalizadoPor: string | null
  /**
   * El día en que hay que hacerlo, `YYYY-MM-DD`. Nulo = «alguna vez».
   *
   * Este sí es un **día** y no un instante, al revés que los otros dos: «pasar
   * la ITV el 3 de septiembre» no ocurre a las 11:42, ocurre ese día. Por eso
   * no lleva hora ni zona, y por eso se compara con el «hoy» de quien mira sin
   * convertir nada.
   */
  fechaPrevista: string | null
  /**
   * Si es urgente o merece destacarse en la lista. Por defecto, `false`: la
   * mayoría de lo que se apunta en una casa no lo es, y marcarlo así es una
   * decisión explícita de quien lo anota o lo edita.
   */
  importante: boolean
}

export const estaHecho = (p: Pendiente): boolean => p.finalizado !== null

/**
 * Cuántos días de antelación se enseña algo que tiene fecha.
 *
 * Lo que se apunta para dentro de meses no debe estorbar hoy. Siete días es el
 * horizonte de «esta semana me toca», que es justo cuando deja de ser una nota
 * al futuro y pasa a ser algo que hacer.
 */
export const DIAS_DE_ANTELACION = 7

/**
 * Si un pendiente ya debe verse, dado el «hoy» de quien mira (`YYYY-MM-DD`).
 *
 * Sin fecha prevista se ve siempre: sin fecha es «alguna vez», y eso se hace
 * cuando se puede. Con fecha, se ve desde una semana antes.
 *
 * La resta se hace aquí y no en la consulta a propósito. Podría hacerla
 * Postgres, pero su `current_date` es UTC: a partir de las diez de la noche en
 * España ya sería mañana, y un pendiente aparecería un día antes de la cuenta.
 * El «hoy» de quien mira solo lo sabe el teléfono.
 */
export const yaToca = (p: Pendiente, hoy: string): boolean => {
  if (!p.fechaPrevista) return true
  return p.fechaPrevista <= sumaDias(hoy, DIAS_DE_ANTELACION)
}

/**
 * Suma días a un `YYYY-MM-DD` y devuelve otro igual.
 *
 * A mediodía y no a medianoche: en los dos domingos del año en que cambia la
 * hora, un día tiene 23 o 25 horas, y sumar 24 desde las 00:00 puede caer en
 * el día anterior o dejarlo clavado. Desde las 12:00 sobra margen.
 */
const sumaDias = (dia: string, dias: number): string => {
  const [a, m, d] = dia.split('-').map(Number)
  const f = new Date(a, m - 1, d, 12)
  f.setDate(f.getDate() + dias)
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(
    f.getDate(),
  ).padStart(2, '0')}`
}

/**
 * Lo que queda por hacer y ya toca, de lo más antiguo a lo más reciente.
 *
 * El filtro de la ventana va aquí dentro y no en cada pantalla: si estuviera
 * fuera, bastaría que a una se le olvidara para enseñar lo que aún no toca.
 */
export const porHacer = (ps: Pendiente[], hoy: string): Pendiente[] =>
  ps
    .filter((p) => !estaHecho(p) && yaToca(p, hoy))
    .sort((a, b) => a.creado.localeCompare(b.creado))

/**
 * Todo lo que queda por hacer, **sin la ventana de aparición**: incluye lo
 * apuntado para más adelante, mezclado con lo que ya toca.
 *
 * Es para el filtro «todo el histórico» de la pantalla de Pendientes, que
 * existe para cuando hace falta ver de un vistazo todo lo que hay a medias en
 * la casa, sin esperar a que se acerque la fecha de cada cosa. El orden es el
 * mismo que el de `porHacer` —lo más antiguo primero— para que activar el
 * filtro no reordene lo que ya se estaba mirando.
 */
export const todoPorHacer = (ps: Pendiente[]): Pendiente[] =>
  ps.filter((p) => !estaHecho(p)).sort((a, b) => a.creado.localeCompare(b.creado))

/** Lo que está apuntado para más adelante y todavía no se enseña. */
export const paraMasAdelante = (ps: Pendiente[], hoy: string): Pendiente[] =>
  ps
    .filter((p) => !estaHecho(p) && !yaToca(p, hoy))
    .sort((a, b) => (a.fechaPrevista ?? '').localeCompare(b.fechaPrevista ?? ''))

/**
 * Lo resuelto, de lo más reciente a lo más antiguo.
 *
 * Al revés que `porHacer` a propósito: de lo que está por hacer preocupa lo que
 * lleva más tiempo esperando; de lo hecho interesa lo último, que es lo que
 * hace falta consultar («¿cuándo cambiamos la bombona?»).
 */
export const hechos = (ps: Pendiente[]): Pendiente[] =>
  ps
    .filter(estaHecho)
    .sort((a, b) => (b.finalizado ?? '').localeCompare(a.finalizado ?? ''))
