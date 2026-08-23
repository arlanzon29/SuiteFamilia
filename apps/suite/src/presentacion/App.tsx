import { useApp } from './estado/AppProvider'
import type { Ruta } from './estado/rutas'
import { Cabecera } from './componentes/Cabecera'
import { BarraPestanas } from './componentes/BarraPestanas'
import { Login } from './pantallas/Login'
import { Inicio } from './pantallas/Inicio'
import { Ajustes } from './pantallas/Ajustes'

/**
 * Marco de la aplicación: el móvil de 440 px centrado, con cabecera fija,
 * contenido con scroll propio y la barra de pestañas abajo.
 *
 * Es el mismo marco que el de compra y pendientes, y conviene que lo sea: las
 * tres se instalan en el mismo teléfono y se abren desde el mismo origen. Sin
 * `DialogoApp`: la portada no tiene nada que editar, solo enlaza.
 */
export const App = () => {
  const { sesion, comprobandoSesion, nav } = useApp()

  return (
    <div
      className="marco-fondo"
      style={{
        display: 'flex',
        justifyContent: 'center',
        background: 'var(--color-neutral-300)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div
        className="marco-app"
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          borderInline: '1px solid var(--color-divider)',
        }}
      >
        {comprobandoSesion ? null : !sesion ? (
          <Login />
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Cabecera {...tituloDe(nav.ruta)} />
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Pantalla ruta={nav.ruta} />
            </div>
            <BarraPestanas />
          </div>
        )}
      </div>
    </div>
  )
}

const Pantalla = ({ ruta }: { ruta: Ruta }) => {
  switch (ruta.n) {
    case 'inicio':
      return <Inicio />
    case 'ajustes':
      return <Ajustes />
  }
}

const tituloDe = (ruta: Ruta): { kicker: string; titulo: string } => {
  switch (ruta.n) {
    case 'inicio':
      return { kicker: 'SuiteFamilia', titulo: 'Suite Familia' }
    case 'ajustes':
      return { kicker: 'SuiteFamilia', titulo: 'Ajustes' }
  }
}
