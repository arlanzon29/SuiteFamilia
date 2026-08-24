/**
 * Los iconos de la interfaz, en un solo sitio.
 *
 * Geometría **Lucide** en la rejilla de 24, copiada y no instalada — mismo
 * motivo que en compra y pendientes: `lucide-react` da problemas de tipos en
 * esta máquina, Lucide es ISC y así la aplicación no arrastra más
 * dependencias que React. Los que ya existen en las otras dos apps se copian
 * de allí tal cual, para que el mismo dibujo signifique lo mismo en toda la
 * suite. `IconoCompra` es el único nuevo: ni compra ni pendientes necesitan
 * un carrito para sí mismas, pero la portada sí para señalar la tarjeta.
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

// ─── Las dos pestañas ───

/** `house` */
export const IconoInicio = (p: Props) => (
  <Svg {...p}>
    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
    <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Svg>
)

/** `settings-2`, no la rueda dentada: a 22 px sus dientes se emborronan. */
export const IconoAjustes = (p: Props) => (
  <Svg {...p}>
    <path d="M20 7h-9" />
    <path d="M14 17H5" />
    <circle cx="17" cy="17" r="3" />
    <circle cx="7" cy="7" r="3" />
  </Svg>
)

// ─── Las dos tarjetas del Inicio ───

/** `shopping-cart`. La tarjeta que enlaza con la compra. */
export const IconoCompra = (p: Props) => (
  <Svg {...p}>
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </Svg>
)

/** `list-checks`. La tarjeta que enlaza con Pendientes. */
export const IconoPendientes = (p: Props) => (
  <Svg {...p}>
    <path d="m3 6 2 2 3.5-3.5" />
    <path d="m3 15 2 2 3.5-3.5" />
    <path d="M13 7h8" />
    <path d="M13 16h8" />
  </Svg>
)

/** `graduation-cap`. La tarjeta que enlaza con Saber. */
export const IconoSaber = (p: Props) => (
  <Svg {...p}>
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M22 10v6" />
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
  </Svg>
)

// ─── Navegación y acciones ───

/** `chevron-right`. «Esto lleva a otro sitio», al final de una tarjeta. */
export const IconoAvanzar = (p: Props) => (
  <Svg {...p}>
    <path d="m9 18 6-6-6-6" />
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

/** `x`. Cerrar la app, junto al conmutador de tema. */
export const IconoCerrar = (p: Props) => (
  <Svg {...p}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Svg>
)
