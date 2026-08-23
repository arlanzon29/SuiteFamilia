import { useApp } from '../estado/AppProvider'
import { IconoClaro, IconoOscuro } from '../iconos'

/**
 * Cabecera con kicker + título y conmutador de tema. Es la misma que la de
 * compra y pendientes, sin la flecha de atrás ni el botón de editar: la
 * portada no tiene pila —sus dos rutas son las dos pestañas— ni nada que
 * editar en el sitio.
 */
export const Cabecera = ({ kicker, titulo }: { kicker: string; titulo: string }) => {
  const { tema } = useApp()

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
    </div>
  )
}
