import type { Pendiente } from '../../dominio/modelo'
import { ID_LOCAL } from './autenticacion'

/**
 * Datos de ejemplo: lo que de verdad se queda a medias en una casa —la
 * revisión de la caldera, el filtro del extractor, la ITV—. Es el contenido
 * que ya traía el boceto, ampliado hasta poder ver todos los estados de las
 * nueve pantallas.
 *
 * Desaparece cuando entren los repositorios de Supabase.
 *
 * **Las fechas son relativas al día en que se arranca**, no fijas como las de
 * la compra. Aquí media interfaz habla de tiempo —«anotado ayer», «hace 18
 * días», los meses de la pantalla de Hechos—, y con fechas fijas la semilla
 * envejece: a los tres meses todo sale como «hace 100 días» y no se puede
 * revisar el diseño de nada.
 */

/** Un instante de hace `dias` días, a una hora creíble del día. */
const hace = (dias: number, hora = 9): string => {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  d.setHours(hora, 30, 0, 0)
  return d.toISOString()
}

/** Un día `YYYY-MM-DD` dentro de `dias` días. */
const dentroDe = (dias: number): string => {
  // A mediodía, por lo mismo que en el resto: en los dos domingos del año en
  // que cambia la hora, sumar días desde medianoche puede quedarse corto.
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + dias)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

type Fila = {
  titulo: string
  descripcion: string
  /** Días desde que se anotó. */
  anotado: number
  /** Días desde que se dio por hecho. `null` es que sigue por hacer. */
  resuelto: number | null
  /**
   * Días desde hoy hasta el día en que toca hacerlo. Sin poner es «alguna
   * vez», que es lo que lleva la mayoría.
   *
   * Hay dos filas a más de una semana vista a propósito: son las que
   * comprueban la ventana de los siete días, porque no deben salir en la lista
   * hasta que se acerquen.
   */
  previsto?: number
  /** Si se marca como importante. Por defecto, `false`. */
  importante?: boolean
}

const FILAS: Fila[] = [
  {
    titulo: 'Pedir cita para la ITV del coche',
    descripcion:
      'Caduca el 30 de septiembre y en el taller de la esquina piden dos semanas de antelación. La ficha técnica y el último informe están en la guantera.\n\nSi no hay hueco antes de fin de mes, mirar la estación de la carretera de Burgos, que suele tener por las tardes.',
    anotado: 0,
    resuelto: null,
    // Dentro de la ventana: quedan menos de siete días, así que se ve.
    previsto: 5,
    importante: true,
  },
  {
    titulo: 'Cambiar el filtro del extractor',
    descripcion:
      'El de carbón lleva puesto desde febrero y ya huele a fritanga en el pasillo. Es el redondo de 20 cm, hay recambio en la ferretería de la plaza.\n\nDe paso, desmontar las rejillas de aluminio y meterlas en el lavavajillas con el programa largo.',
    anotado: 1,
    resuelto: null,
  },
  {
    titulo: 'Revisar la caldera antes del invierno',
    descripcion:
      'El técnico que vino en marzo dejó dicho que la revisión anual toca en septiembre, antes de encender la calefacción. Conviene llamar ahora, que en octubre no hay huecos y acabamos otro invierno con los radiadores del salón a medio gas.\n\nHay que preguntar también por el ruido que hace al arrancar por la mañana, ese golpe seco en la tubería del pasillo. Apuntó que podía ser aire en el circuito y que se purga en diez minutos, pero se fue sin hacerlo.\n\nEl contrato de mantenimiento está en la carpeta azul del mueble de la entrada, con la factura del año pasado grapada detrás. Si el precio ha vuelto a subir, merece la pena pedir presupuesto al servicio del barrio antes de renovar.',
    anotado: 5,
    resuelto: null,
    importante: true,
  },
  {
    titulo: 'Cambiar las pilas del detector de humo',
    descripcion:
      'Lleva pitando cada pocos minutos desde el fin de semana. Son dos de 9 voltios y hay que subirse a la banqueta de la cocina, no a la silla.',
    anotado: 9,
    resuelto: null,
  },
  {
    titulo: 'Arreglar la persiana del dormitorio',
    descripcion:
      'La cinta está deshilachada y sube torcida. Mirar si es solo el recogedor antes de llamar a nadie: el tornillo de la tapa es de estrella y está detrás del cajón.\n\nSi hay que cambiar la cinta entera, medir primero el ancho; la del salón era de 22 mm.',
    anotado: 18,
    resuelto: null,
  },
  {
    titulo: 'Renovar el seguro del coche',
    descripcion:
      'Vence a mitad del mes que viene. Pedir precio en otras dos antes de dejar que se renueve solo, que el año pasado subió sin avisar.',
    anotado: 3,
    resuelto: null,
    // Fuera de la ventana: falta más de una semana, así que NO debe salir en
    // la lista todavía. Es una de las dos que comprueban la regla.
    previsto: 24,
  },
  {
    titulo: 'Cambiar las ruedas de invierno',
    descripcion:
      'Las tiene guardadas el taller. Pedir cita en cuanto empiecen a bajar las temperaturas; el año pasado hubo que esperar tres semanas.',
    anotado: 2,
    resuelto: null,
    previsto: 60,
  },
  {
    titulo: 'Dar de baja el seguro del móvil viejo',
    descripcion:
      'Se sigue cobrando 4,95 al mes de un teléfono que ya no usa nadie. Se pide por el chat de la aseguradora y tardan un par de días en contestar.',
    anotado: 13,
    resuelto: 1,
  },
  {
    titulo: 'Cambiar la bombona de la terraza',
    descripcion: 'La de repuesto estaba vacía. Quedan dos llenas debajo del banco.',
    anotado: 17,
    resuelto: 15,
  },
  {
    titulo: 'Llevar la ropa de invierno a la tintorería',
    descripcion:
      'Los dos abrigos y la manta de lana del sofá. El resguardo está en el corcho de la cocina.',
    anotado: 20,
    resuelto: 11,
  },
  {
    titulo: 'Pagar el recibo de la comunidad',
    descripcion:
      'La derrama del portal iba aparte este trimestre. Pagado por transferencia, el justificante está en el correo.',
    anotado: 22,
    resuelto: 19,
  },
  {
    titulo: 'Podar el ciruelo del patio',
    descripcion:
      'Se hizo antes de que brotara. Las ramas cortadas se llevaron al punto limpio el mismo sábado.',
    anotado: 46,
    resuelto: 41,
  },
  {
    titulo: 'Renovar el seguro del hogar',
    descripcion:
      'Subían 60 euros al renovar. Con la oferta de la competencia delante lo dejaron en el precio del año pasado.',
    anotado: 52,
    resuelto: 44,
  },
]

export type Semilla = {
  pendientes: Pendiente[]
}

/** Las dos cuentas de la casa, para que se vea quién apuntó y quién cerró. */
const YO = ID_LOCAL
const LA_OTRA = 'la-otra-persona'

export const semilla = (): Semilla => ({
  pendientes: FILAS.map((f, i) => ({
    id: 'p' + i,
    titulo: f.titulo,
    descripcion: f.descripcion,
    creado: hace(f.anotado),
    // Alternando, para que en la ficha se vean los dos casos: lo que apuntaste
    // tú y lo que apuntó la otra persona.
    creadoPor: i % 2 === 0 ? YO : LA_OTRA,
    // Por la tarde, que es cuando se resuelven las cosas de casa.
    finalizado: f.resuelto === null ? null : hace(f.resuelto, 19),
    // Van juntas siempre: sin fecha de cierre no hay quien lo cerró.
    finalizadoPor: f.resuelto === null ? null : i % 3 === 0 ? LA_OTRA : YO,
    fechaPrevista: f.previsto === undefined ? null : dentroDe(f.previsto),
    importante: f.importante ?? false,
  })),
})
