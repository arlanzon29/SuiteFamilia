import { useApp } from '../estado/AppProvider'
import { Aviso } from '../componentes/Aviso'
import { nombreDe, plural, saludo } from '../formato'
import { IconoAvanzar, IconoCompra, IconoPendientes, IconoSaber } from '../iconos'

/**
 * Pantalla de arranque de toda la suite: el saludo y una tarjeta por
 * aplicación, cada una con un enlace a la app real. La portada no tiene
 * pantallas de detalle propias — de aquí solo se sale hacia compra, hacia
 * pendientes o hacia saber.
 *
 * La tarjeta de Saber no lleva cifras, a diferencia de las otras dos: es
 * solo el enlace. Añadirle un resumen leído de Supabase —como tienen Compra
 * y Pendientes— es trabajo aparte si algún día hace falta.
 */
export const Inicio = () => {
  const {
    sesion,
    resumenCompra,
    cargandoCompra,
    errorCompra,
    resumenPendientes,
    cargandoPendientes,
    errorPendientes,
  } = useApp()
  const nombre = sesion?.nombre ?? nombreDe(sesion?.email ?? '')

  return (
    <div
      style={{
        minHeight: '100%',
        padding: '26px 14px 26px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 600,
          fontSize: 27,
          lineHeight: 1.15,
        }}
      >
        {saludo()}
        {nombre ? `, ${nombre}` : ''}
      </div>

      <Tarjeta
        href="/SuiteFamilia/compra/"
        Icono={IconoCompra}
        titulo="Compra"
        cargando={cargandoCompra}
        error={errorCompra}
        cantidadCifras={3}
        cifras={
          resumenCompra
            ? [
                { valor: resumenCompra.porComprar, etiqueta: 'por comprar' },
                { valor: resumenCompra.listasAbiertas, etiqueta: plural(resumenCompra.listasAbiertas, 'lista abierta', 'listas abiertas') },
                { valor: resumenCompra.sinPrecio, etiqueta: 'sin precio' },
              ]
            : []
        }
      />

      <Tarjeta
        href="/SuiteFamilia/pendientes/"
        Icono={IconoPendientes}
        titulo="Pendientes"
        cargando={cargandoPendientes}
        error={errorPendientes}
        cantidadCifras={2}
        cifras={
          resumenPendientes
            ? [
                { valor: resumenPendientes.total, etiqueta: plural(resumenPendientes.total, 'pendiente', 'pendientes') },
                { valor: resumenPendientes.importantes, etiqueta: plural(resumenPendientes.importantes, 'importante', 'importantes') },
              ]
            : []
        }
      />

      <Tarjeta
        href="/SuiteFamilia/saber/"
        Icono={IconoSaber}
        titulo="Saber"
        cargando={false}
        error={null}
        cantidadCifras={0}
        cifras={[]}
      />

      <Version />
    </div>
  )
}

const Tarjeta = ({
  href,
  Icono,
  titulo,
  cargando,
  error,
  cantidadCifras,
  cifras,
}: {
  href: string
  Icono: React.ComponentType<{ size?: number }>
  titulo: string
  cargando: boolean
  error: string | null
  /** Cuántos huecos pinta el esqueleto mientras no hay cifras todavía. */
  cantidadCifras: number
  cifras: { valor: number; etiqueta: string }[]
}) => (
  <a
    href={href}
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      border: '1px solid var(--color-divider)',
      borderRadius: 'var(--radius-md)',
      padding: 16,
      color: 'inherit',
      textDecoration: 'none',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icono size={22} />
      <span
        style={{
          flex: 1,
          fontFamily: 'var(--font-heading)',
          fontSize: 20,
          fontWeight: 600,
        }}
      >
        {titulo}
      </span>
      <IconoAvanzar size={18} color="var(--color-neutral-600)" />
    </div>

    {error ? (
      <Aviso>{error}</Aviso>
    ) : cargando && cifras.length === 0 ? (
      <div style={{ display: 'flex', gap: 10 }}>
        {Array.from({ length: cantidadCifras }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 58,
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-neutral-200)',
            }}
          />
        ))}
      </div>
    ) : (
      <div style={{ display: 'flex', gap: 10 }}>
        {cifras.map((c) => (
          <Cifra key={c.etiqueta} valor={c.valor} etiqueta={c.etiqueta} />
        ))}
      </div>
    )}
  </a>
)

const Cifra = ({ valor, etiqueta }: { valor: number; etiqueta: string }) => (
  <div
    style={{
      flex: 1,
      border: '1px solid var(--color-divider)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      alignItems: 'flex-start',
    }}
  >
    <span
      className="cifra"
      style={{ fontFamily: 'var(--font-heading)', fontSize: 22, lineHeight: 1 }}
    >
      {valor}
    </span>
    <span style={{ fontSize: 10, color: 'var(--color-neutral-600)', lineHeight: 1.2 }}>
      {etiqueta}
    </span>
  </div>
)

/**
 * El sello de la compilación, igual que en compra y pendientes: responde a
 * «¿el móvil tiene lo último?».
 */
export const Version = () => (
  <div
    style={{
      marginTop: 'auto',
      textAlign: 'center',
      fontSize: 10,
      color: 'var(--color-neutral-500)',
    }}
  >
    <span className="cifra">{__VERSION__}</span>
    {' · '}
    {__COMPILADA__}
    {__ENTORNO__ === 'dev' ? ' · dev' : ''}
  </div>
)
