import { useApp } from '../estado/AppProvider'
import { pestanaDe, type Pestana } from '../estado/rutas'
import { IconoAjustes, IconoHecho, IconoInicio, IconoPendientes } from '../iconos'

const PESTANAS: Array<{
  id: Pestana
  etiqueta: string
  Icono: React.ComponentType<{ size?: number }>
}> = [
  { id: 'inicio', etiqueta: 'Inicio', Icono: IconoInicio },
  { id: 'pendientes', etiqueta: 'Pendientes', Icono: IconoPendientes },
  { id: 'hechos', etiqueta: 'Hechos', Icono: IconoHecho },
  { id: 'ajustes', etiqueta: 'Ajustes', Icono: IconoAjustes },
]

/**
 * Barra inferior de cuatro pestañas. La activa va en acento sobre tinte.
 *
 * `barra-segura` es lo que el boceto no tenía: en un marco de 812 px no se ve
 * el fallo, pero en un móvil de verdad la barra de gestos se come la fila de
 * abajo. La clase le reserva `env(safe-area-inset-bottom)`.
 */
export const BarraPestanas = () => {
  const { nav } = useApp()
  const activa = pestanaDe(nav.ruta, nav.pila)

  return (
    <div
      className="barra-segura"
      style={{
        flex: 'none',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        borderTop: '1px solid var(--color-divider)',
        background: 'var(--color-bg)',
      }}
    >
      {PESTANAS.map((t) => {
        const esActiva = activa === t.id
        return (
          <button
            key={t.id}
            onClick={() => nav.pestana(t.id)}
            aria-current={esActiva ? 'page' : undefined}
            style={{
              minHeight: 62,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              color: esActiva ? 'var(--color-accent)' : 'var(--color-neutral-600)',
              background: esActiva ? 'var(--color-accent-100)' : 'transparent',
            }}
          >
            <t.Icono size={22} />
            <span style={{ fontSize: 11, letterSpacing: '.02em' }}>{t.etiqueta}</span>
          </button>
        )
      })}
    </div>
  )
}
