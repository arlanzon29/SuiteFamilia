import { useApp } from '../estado/AppProvider'
import { listaPorHacer, listaTodoPorHacer } from '../estado/consultas'
import { Aviso } from '../componentes/Aviso'
import { diaCompleto, hace, nombreDe, plural, saludo } from '../formato'
import { IconoAvanzar } from '../iconos'

/** Cuántos de los más antiguos se enseñan. Más de cinco ya es la otra pestaña. */
const CUANTOS = 5

/**
 * Pantalla de arranque: el saludo, la fecha y lo que lleva más tiempo sin
 * hacerse.
 *
 * Aquí Inicio no resume cuentas hechas en el servidor como en la compra —esto
 * es una tabla de una casa, no un histórico de precios—, así que lo que ofrece
 * es lo que de verdad hace falta al abrir la aplicación: **qué llevamos más
 * tiempo dejando para luego**. Por eso las líneas dicen «hace 18 días» y no la
 * fecha: la fecha obligaría a echar la cuenta a mano, que es justo lo que esta
 * pantalla viene a evitar.
 */
export const Inicio = () => {
  const { casos, datos, sesion, cargando, error, nav } = useApp()
  const hoy = casos.hoy()
  const nombre = nombreDe(sesion?.email ?? '')
  const todoPendiente = listaTodoPorHacer(datos)
  const totalImportantes = todoPendiente.filter((p) => p.importante).length
  const todos = listaPorHacer(datos, hoy)
  const importantes = todos.filter((p) => p.importante)
  const antiguos = importantes.slice(0, CUANTOS)

  return (
    <div
      style={{
        minHeight: '100%',
        padding: '26px 14px 26px',
        display: 'flex',
        flexDirection: 'column',
        gap: 26,
      }}
    >
      {error && <Aviso>{error}</Aviso>}

      <div>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 27,
            lineHeight: 1.15,
            marginBottom: 5,
          }}
        >
          {saludo()}
          {nombre ? `, ${nombre}` : ''}
        </div>
        <div className="cifra" style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>
          {diaCompleto(hoy)}
        </div>
      </div>

      {todoPendiente.length > 0 && (
        <div style={{ display: 'flex', gap: 10 }}>
          <Cifra valor={todoPendiente.length} etiqueta={plural(todoPendiente.length, 'pendiente', 'pendientes')} />
          <Cifra valor={totalImportantes} etiqueta={plural(totalImportantes, 'importante', 'importantes')} />
        </div>
      )}

      {todos.length === 0 ? (
        <div
          style={{
            border: '1px dashed var(--color-divider)',
            borderRadius: 'var(--radius-md)',
            padding: '22px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22 }}>
            {cargando ? 'Cargando…' : 'La casa está al día'}
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-neutral-700)' }}>
            No queda nada apuntado sin hacer.
          </p>
          <button
            className="btn btn-secondary"
            style={{ minHeight: 48 }}
            onClick={() => nav.pestana('pendientes')}
          >
            Apuntar algo
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 5 }}>
            <span className="kicker-neutral">Lo más antiguo importante sin hacer</span>
            <span style={{ flex: 1, height: 1, background: 'var(--color-divider)' }} />
          </div>
          {antiguos.length === 0 && (
            <p style={{ margin: '4px 2px 0', fontSize: 13, color: 'var(--color-neutral-600)' }}>
              Nada marcado como importante de lo que ya toca.
            </p>
          )}
          {antiguos.map((p) => (
            <button
              key={p.id}
              onClick={() => nav.ir({ n: 'ficha', id: p.id })}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 12,
                textAlign: 'left',
                minHeight: 48,
                padding: '10px 2px',
                borderBottom: '1px solid var(--color-divider)',
              }}
            >
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  fontSize: 16,
                  lineHeight: 1.2,
                }}
              >
                {p.titulo}
              </span>
              <span
                className="cifra"
                style={{ flex: 'none', fontSize: 12, color: 'var(--color-neutral-600)' }}
              >
                {hace(p.creado, hoy)}
              </span>
            </button>
          ))}
          {importantes.length > antiguos.length && (
            <button
              onClick={() => nav.pestana('pendientes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                minHeight: 46,
                fontSize: 13,
                color: 'var(--color-accent-700)',
                paddingTop: 6,
              }}
            >
              Ver los {plural(importantes.length, 'pendiente', 'pendientes')}
              <IconoAvanzar size={15} />
            </button>
          )}
        </div>
      )}

      <Version />
    </div>
  )
}

const Cifra = ({ valor, etiqueta }: { valor: number; etiqueta: string }) => (
  <div
    style={{
      flex: 1,
      border: '1px solid var(--color-divider)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      alignItems: 'flex-start',
    }}
  >
    <span
      className="cifra"
      style={{ fontFamily: 'var(--font-heading)', fontSize: 26, lineHeight: 1 }}
    >
      {valor}
    </span>
    <span style={{ fontSize: 11, color: 'var(--color-neutral-600)', lineHeight: 1.25 }}>
      {etiqueta}
    </span>
  </div>
)

/**
 * El sello de la compilación, abajo del todo y en voz baja.
 *
 * Responde a una sola pregunta: **¿el móvil tiene lo último?** Entre GitHub
 * Pages, el caché del navegador y la aplicación instalada hay capas de sobra
 * para que el teléfono siga enseñando la compilación de ayer sin avisar.
 *
 * El «+» detrás del commit significa que se compiló con cambios sin guardar en
 * git, así que ese sello no identifica nada reproducible.
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
