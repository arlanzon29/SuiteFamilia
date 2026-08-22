import type { Pendiente } from '../../dominio/modelo'

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

type Fila = {
  titulo: string
  comentario: string
  /** Días desde que se anotó. */
  anotado: number
  /** Días desde que se dio por hecho. `null` es que sigue por hacer. */
  resuelto: number | null
}

const FILAS: Fila[] = [
  {
    titulo: 'Pedir cita para la ITV del coche',
    comentario:
      'Caduca el 30 de septiembre y en el taller de la esquina piden dos semanas de antelación. La ficha técnica y el último informe están en la guantera.\n\nSi no hay hueco antes de fin de mes, mirar la estación de la carretera de Burgos, que suele tener por las tardes.',
    anotado: 0,
    resuelto: null,
  },
  {
    titulo: 'Cambiar el filtro del extractor',
    comentario:
      'El de carbón lleva puesto desde febrero y ya huele a fritanga en el pasillo. Es el redondo de 20 cm, hay recambio en la ferretería de la plaza.\n\nDe paso, desmontar las rejillas de aluminio y meterlas en el lavavajillas con el programa largo.',
    anotado: 1,
    resuelto: null,
  },
  {
    titulo: 'Revisar la caldera antes del invierno',
    comentario:
      'El técnico que vino en marzo dejó dicho que la revisión anual toca en septiembre, antes de encender la calefacción. Conviene llamar ahora, que en octubre no hay huecos y acabamos otro invierno con los radiadores del salón a medio gas.\n\nHay que preguntar también por el ruido que hace al arrancar por la mañana, ese golpe seco en la tubería del pasillo. Apuntó que podía ser aire en el circuito y que se purga en diez minutos, pero se fue sin hacerlo.\n\nEl contrato de mantenimiento está en la carpeta azul del mueble de la entrada, con la factura del año pasado grapada detrás. Si el precio ha vuelto a subir, merece la pena pedir presupuesto al servicio del barrio antes de renovar.',
    anotado: 5,
    resuelto: null,
  },
  {
    titulo: 'Cambiar las pilas del detector de humo',
    comentario:
      'Lleva pitando cada pocos minutos desde el fin de semana. Son dos de 9 voltios y hay que subirse a la banqueta de la cocina, no a la silla.',
    anotado: 9,
    resuelto: null,
  },
  {
    titulo: 'Arreglar la persiana del dormitorio',
    comentario:
      'La cinta está deshilachada y sube torcida. Mirar si es solo el recogedor antes de llamar a nadie: el tornillo de la tapa es de estrella y está detrás del cajón.\n\nSi hay que cambiar la cinta entera, medir primero el ancho; la del salón era de 22 mm.',
    anotado: 18,
    resuelto: null,
  },
  {
    titulo: 'Dar de baja el seguro del móvil viejo',
    comentario:
      'Se sigue cobrando 4,95 al mes de un teléfono que ya no usa nadie. Se pide por el chat de la aseguradora y tardan un par de días en contestar.',
    anotado: 13,
    resuelto: 1,
  },
  {
    titulo: 'Cambiar la bombona de la terraza',
    comentario: 'La de repuesto estaba vacía. Quedan dos llenas debajo del banco.',
    anotado: 17,
    resuelto: 15,
  },
  {
    titulo: 'Llevar la ropa de invierno a la tintorería',
    comentario:
      'Los dos abrigos y la manta de lana del sofá. El resguardo está en el corcho de la cocina.',
    anotado: 20,
    resuelto: 11,
  },
  {
    titulo: 'Pagar el recibo de la comunidad',
    comentario:
      'La derrama del portal iba aparte este trimestre. Pagado por transferencia, el justificante está en el correo.',
    anotado: 22,
    resuelto: 19,
  },
  {
    titulo: 'Podar el ciruelo del patio',
    comentario:
      'Se hizo antes de que brotara. Las ramas cortadas se llevaron al punto limpio el mismo sábado.',
    anotado: 46,
    resuelto: 41,
  },
  {
    titulo: 'Renovar el seguro del hogar',
    comentario:
      'Subían 60 euros al renovar. Con la oferta de la competencia delante lo dejaron en el precio del año pasado.',
    anotado: 52,
    resuelto: 44,
  },
]

export type Semilla = {
  pendientes: Pendiente[]
}

export const semilla = (): Semilla => ({
  pendientes: FILAS.map((f, i) => ({
    id: 'p' + i,
    titulo: f.titulo,
    comentario: f.comentario,
    creado: hace(f.anotado),
    // Por la tarde, que es cuando se resuelven las cosas de casa.
    hecho: f.resuelto === null ? null : hace(f.resuelto, 19),
  })),
})
