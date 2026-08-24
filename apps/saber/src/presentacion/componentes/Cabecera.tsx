import { useApp } from '../estado/AppProvider'
import { tienePila } from '../estado/rutas'
import { IconoAtras, IconoCerrar, IconoClaro, IconoOscuro } from '../iconos'

/**
 * Si la app corre instalada como PWA (`display: standalone`), tiene su
 * propia ventana y `window.close()` la cierra de verdad. En una pestaña
 * normal del navegador no hay ventana que cerrar, así que el botón ni se
 * muestra.
 *
 * iOS queda fuera aunque «añadir a inicio» también cuente como instalada:
 * ahí Safari ignora `window.close()` en silencio, así que el botón se vería
 * pero no haría nada.
 */
const appInstalada = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(display-mode: standalone)').matches &&
  !/iPad|iPhone|iPod/.test(window.navigator.userAgent)

/** Cabecera con kicker + título, flecha atrás cuando hay pila y conmutador de tema. */
export const Cabecera = ({
  kicker,
  titulo,
  elevada,
}: {
  kicker: string
  titulo: string
  /**
   * Sombra bajo la cabecera cuando el contenido se ha desplazado hacia
   * arriba, como el `AppBarLayout` de Android. La activa `App.tsx` según la
   * ruta. Mismo patrón que en la app de compra —ver
   * `../../compra/docs/gestos-lista-swipe.md` §5.
   */
  elevada?: boolean
}) => {
  const { nav, tema } = useApp()
  const hayAtras = tienePila(nav.ruta)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 14px 12px',
        borderBottom: '1px solid var(--color-divider)',
        flex: 'none',
        position: 'relative',
        zIndex: 1,
        boxShadow: elevada ? 'var(--shadow-sm)' : 'none',
        transition: 'box-shadow 0.15s ease-out',
      }}
    >
      {hayAtras && (
        <button
          className="btn btn-secondary"
          style={{ width: 44, height: 44, padding: 0, flex: 'none' }}
          onClick={nav.atras}
          aria-label="Atrás"
        >
          <IconoAtras size={22} />
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="kicker">{kicker}</div>
        <h2 className="elipsis" style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
          {titulo}
        </h2>
      </div>
      <button
        className="btn btn-secondary"
        style={{ width: 44, height: 44, padding: 0, flex: 'none' }}
        onClick={tema.alterna}
        aria-label="Cambiar tema"
      >
        {tema.tema === 'dark' ? <IconoOscuro size={19} /> : <IconoClaro size={19} />}
      </button>
      {appInstalada() && (
        <button
          className="btn btn-secondary"
          style={{ width: 44, height: 44, padding: 0, flex: 'none' }}
          onClick={() => window.close()}
          aria-label="Cerrar la app"
        >
          <IconoCerrar size={19} />
        </button>
      )}
    </div>
  )
}
