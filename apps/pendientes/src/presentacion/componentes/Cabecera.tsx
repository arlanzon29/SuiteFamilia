import { useApp } from '../estado/AppProvider'
import { tienePila } from '../estado/rutas'
import { IconoAtras, IconoClaro, IconoEditar, IconoOscuro } from '../iconos'

/**
 * Cabecera con kicker + título, flecha atrás cuando hay pila y conmutador de
 * tema. Es la misma que la de la compra, con un botón más: editar, que solo
 * sale en la ficha porque es la única pantalla que tiene algo que editar.
 */
export const Cabecera = ({
  kicker,
  titulo,
  onEditar,
}: {
  kicker: string
  titulo: string
  onEditar?: () => void
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
      {onEditar && (
        <button
          className="btn btn-secondary"
          style={{ width: 44, height: 44, padding: 0, flex: 'none' }}
          onClick={onEditar}
          aria-label="Editar"
        >
          <IconoEditar size={20} />
        </button>
      )}
      <button
        className="btn btn-secondary"
        style={{ width: 44, height: 44, padding: 0, flex: 'none' }}
        onClick={tema.alterna}
        aria-label="Cambiar tema"
      >
        {tema.tema === 'dark' ? <IconoOscuro size={19} /> : <IconoClaro size={19} />}
      </button>
    </div>
  )
}
