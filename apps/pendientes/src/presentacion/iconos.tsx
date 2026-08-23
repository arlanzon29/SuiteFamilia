/**
 * Los iconos de la interfaz, en un solo sitio.
 *
 * Geometría **Lucide** en la rejilla de 24, copiada y no instalada: el paquete
 * `lucide-react` da problemas de tipos en esta máquina y está contado en
 * `apps/compra/src/presentacion/iconos.tsx`. Son doce iconos de una o dos
 * líneas cada uno, Lucide es ISC —se puede— y así la aplicación no arrastra
 * más dependencias que React.
 *
 * Los que ya existen en la compra se copian de allí tal cual, aunque el boceto
 * dibujara otra cosa: la casa de la barra de pestañas tiene que ser la misma
 * casa en las dos aplicaciones.
 *
 * El `aria-hidden` va puesto a propósito: **el icono nunca es la etiqueta**.
 * Todos los botones llevan ya texto visible o `aria-label`.
 */

type Props = {
  /** Lado en píxeles. */
  size?: number
  /** Por defecto hereda el color del texto. */
  color?: string
}

/**
 * El marco común. `strokeWidth` 1.75 y no el 2 de Lucide: con una tipografía
 * serif al lado, el 2 se ve tosco.
 */
const Svg = ({
  size = 20,
  color = 'currentColor',
  children,
}: Props & { children: React.ReactNode }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    focusable={false}
    style={{ flex: 'none' }}
  >
    {children}
  </svg>
)

// ─── Las cuatro pestañas ───

/** `house` */
export const IconoInicio = (p: Props) => (
  <Svg {...p}>
    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
    <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Svg>
)

/** `list-checks` */
export const IconoPendientes = (p: Props) => (
  <Svg {...p}>
    <path d="m3 6 2 2 3.5-3.5" />
    <path d="m3 15 2 2 3.5-3.5" />
    <path d="M13 7h8" />
    <path d="M13 16h8" />
  </Svg>
)

/**
 * `list`. Lo apuntado para más adelante, en la lista de Pendientes.
 *
 * Es una lista lisa y no la de marcas de la pestaña: aquello es «lo que hay
 * que hacer», esto es «lo que hay guardado». Y no puede ser el mismo dibujo
 * que el de la pestaña, que está a dos dedos en la misma pantalla.
 */
export const IconoLista = (p: Props) => (
  <Svg {...p}>
    <path d="M8 6h13" />
    <path d="M8 12h13" />
    <path d="M8 18h13" />
    <path d="M3 6h.01" />
    <path d="M3 12h.01" />
    <path d="M3 18h.01" />
  </Svg>
)

/** `check`. La pestaña de lo resuelto, y la marca de cada fila de Hechos. */
export const IconoHecho = (p: Props) => (
  <Svg {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
)

/**
 * `settings-2`, no la rueda dentada. A 22 px los dientes de `settings` se
 * convierten en un borrón; estos dos mandos se leen igual de bien.
 */
export const IconoAjustes = (p: Props) => (
  <Svg {...p}>
    <path d="M20 7h-9" />
    <path d="M14 17H5" />
    <circle cx="17" cy="17" r="3" />
    <circle cx="7" cy="7" r="3" />
  </Svg>
)

// ─── Navegación ───

/** `chevron-left`. Atrás, en la cabecera. */
export const IconoAtras = (p: Props) => (
  <Svg {...p}>
    <path d="m15 18-6-6 6-6" />
  </Svg>
)

/** `chevron-right`. «Esto lleva a otro sitio», al final de una fila que se toca. */
export const IconoAvanzar = (p: Props) => (
  <Svg {...p}>
    <path d="m9 18 6-6-6-6" />
  </Svg>
)

// ─── Acciones ───

/** `plus` */
export const IconoMas = (p: Props) => (
  <Svg {...p}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </Svg>
)

/** `square-pen`. Editar el pendiente, desde su ficha. */
export const IconoEditar = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
  </Svg>
)

/**
 * `rotate-ccw`. Deshacer un «hecho»: la fecha de realización vuelve a nula.
 *
 * No es una `×` ni un `check` tachado a propósito: lo que se hace no es
 * cancelar ni desmarcar una casilla, es devolver el pendiente al estado
 * anterior. La flecha que gira hacia atrás es el gesto que ya significa eso en
 * cualquier teléfono.
 */
export const IconoDeshacer = (p: Props) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </Svg>
)

/**
 * `trash-2`. Borrar de verdad, con su diálogo de confirmación detrás.
 *
 * Solo aparece dentro de la ficha, nunca en una fila de la lista: es la única
 * acción de la aplicación que no se puede deshacer.
 */
export const IconoBorrar = (p: Props) => (
  <Svg {...p}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </Svg>
)

/** `log-out`. Desconectar, al final de Ajustes. */
export const IconoDesconectar = (p: Props) => (
  <Svg {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </Svg>
)

/** `file-text`. El dibujo de la pantalla vacía y de la entrada. */
export const IconoHoja = (p: Props) => (
  <Svg {...p}>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
    <path d="M14 2v5h5" />
    <path d="M8 13h8" />
    <path d="M8 17h5" />
  </Svg>
)

/**
 * `circle-alert`. La marca de «importante»: la admiración de siempre, dentro
 * de un círculo para que se lea igual de bien suelta en una fila que al lado
 * del título en la ficha.
 */
export const IconoImportante = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </Svg>
)

// ─── Tema ───

/** `sun` */
export const IconoClaro = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </Svg>
)

/** `moon` */
export const IconoOscuro = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </Svg>
)
