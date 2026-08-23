import type { Conocimiento, Tema } from '../../dominio/modelo'
import { ID_LOCAL } from './autenticacion'

/**
 * Datos de ejemplo: conocimiento real de una casa, repartido en unos pocos
 * temas, con enlaces en algunos y sin ellos en otros para ver los dos casos.
 *
 * **Las fechas son relativas al día en que se arranca**, igual que en
 * Pendientes: media interfaz habla de tiempo («hace 3 días»), y con fechas
 * fijas la semilla envejece.
 */

const hace = (dias: number, hora = 20): string => {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  d.setHours(hora, 15, 0, 0)
  return d.toISOString()
}

const TEMAS = ['Recetas', 'Bricolaje', 'Salud', 'Jardín', 'Tecnología']

type Fila = {
  titulo: string
  descripcion: string
  tema: string
  enlace?: string
  /** Días desde que se apuntó. */
  hace: number
}

const FILAS: Fila[] = [
  {
    titulo: 'Lentejas estofadas de la abuela',
    descripcion:
      'Un sofrito lento de cebolla, pimiento y zanahoria, con un par de patatas cascadas al final para que espese. La clave está en no removerlas mucho para que no se deshagan.',
    tema: 'Recetas',
    hace: 2,
  },
  {
    titulo: 'Pan casero sin amasado',
    descripcion:
      'Receta de fermentación larga, doce horas en el frigorífico y horneado en olla de hierro con tapa. Sale con una corteza que no se consigue de otra forma en un horno normal.',
    tema: 'Recetas',
    enlace: 'https://www.youtube.com/watch?v=1Z1zM7v2Qm0',
    hace: 9,
  },
  {
    titulo: 'Arroz caldoso de marisco',
    descripcion: 'El fumet se hace el día antes con las cabezas de las gambas y se congela en tarros.',
    tema: 'Recetas',
    hace: 30,
  },
  {
    titulo: 'Purgar los radiadores',
    descripcion:
      'Con la llave cuadrada, empezando por el radiador más bajo de la casa. Se cierra en cuanto deja de salir aire y empieza a salir agua sin burbujas.',
    tema: 'Bricolaje',
    hace: 15,
  },
  {
    titulo: 'Reparar la persiana enrollable',
    descripcion:
      'Si sube torcida, casi siempre es la cinta deshilachada, no el motor. Se cambia sin desmontar el cajón entero.',
    tema: 'Bricolaje',
    enlace: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    hace: 60,
  },
  {
    titulo: 'Estiramientos para la ciática',
    descripcion:
      'La rutina de cinco minutos que recomendó el fisio: rodilla al pecho, torsión tumbada y el estiramiento del piriforme. Mejor por la mañana, con el cuerpo templado.',
    tema: 'Salud',
    hace: 4,
  },
  {
    titulo: 'Cuándo tocan las revisiones del pediatra',
    descripcion: 'Calendario oficial de la Comunidad: 15 días, 2, 4, 6, 9, 12, 15 y 18 meses.',
    tema: 'Salud',
    hace: 40,
  },
  {
    titulo: 'Poda del rosal en invierno',
    descripcion:
      'Se corta por encima de una yema mirando hacia fuera, dejando la planta en forma de copa abierta. Mejor con las primeras heladas ya pasadas.',
    tema: 'Jardín',
    hace: 22,
  },
  {
    titulo: 'Riego por goteo del huerto',
    descripcion: 'Programador a las siete de la mañana, quince minutos, en días alternos en verano.',
    tema: 'Jardín',
    enlace: 'https://www.youtube.com/watch?v=kXYiU_JCYtU',
    hace: 70,
  },
  {
    titulo: 'Configurar la copia de seguridad del NAS',
    descripcion:
      'Copia incremental cada noche a las 3, y una copia completa mensual que se sube fuera de casa. Las contraseñas del cifrado están en el gestor, no en ningún papel.',
    tema: 'Tecnología',
    hace: 6,
  },
  {
    titulo: 'Enseñar a los críos a usar el buscador',
    descripcion: 'Vídeo corto que vimos juntos sobre cómo distinguir una fuente fiable de un bulo.',
    tema: 'Tecnología',
    enlace: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    hace: 12,
  },
]

export type Semilla = {
  temas: Tema[]
  conocimientos: Conocimiento[]
}

const LA_OTRA = 'la-otra-persona'

export const semilla = (): Semilla => {
  const temas: Tema[] = TEMAS.map((nombre) => ({ id: nombre, nombre }))
  const conocimientos: Conocimiento[] = FILAS.map((f, i) => ({
    id: 'c' + i,
    titulo: f.titulo,
    descripcion: f.descripcion,
    tema: f.tema,
    enlace: f.enlace ?? null,
    creado: hace(f.hace),
    // Alternando, para que se vea lo apuntado por cada una de las dos personas.
    creadoPor: i % 2 === 0 ? ID_LOCAL : LA_OTRA,
  }))
  return { temas, conocimientos }
}
