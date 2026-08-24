import { Aviso } from '../componentes/Aviso'
import { useRipple } from '../componentes/Ripple'
import { useApp } from '../estado/AppProvider'
import { nombreDe, saludo } from '../formato'

/**
 * Pantalla de arranque: un vistazo a cuánto hay apuntado y lo último que se
 * añadió. Se alimenta de `resumen` —los últimos tres conocimientos y el
 * total, en dos consultas baratas— y no de un catálogo entero cargado en el
 * cliente.
 */
export const Inicio = () => {
  const { resumen, cargandoResumen, errorResumen, datos, nav, sesion } = useApp()
  const nombre = sesion?.nombre ?? nombreDe(sesion?.email ?? '')
  const rippleIrASaber = useRipple()

  return (
    <div
      style={{
        padding: '14px 14px 26px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <Saludo nombre={nombre} />

      {errorResumen && <Aviso>{errorResumen}</Aviso>}

      {!resumen ? (
        cargandoResumen && <Esqueleto />
      ) : resumen.total === 0 ? (
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
            Todavía no hay nada apuntado
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-neutral-700)' }}>
            Apunta el primer conocimiento de la casa: una receta, un truco, un enlace que
            merezca la pena recordar.
          </p>
          <button
            className="btn btn-secondary"
            onPointerDown={rippleIrASaber.onPointerDown}
            style={{ minHeight: 48, position: 'relative', overflow: 'hidden' }}
            onClick={() => nav.pestana('conocimientos')}
          >
            {rippleIrASaber.nodo}
            Ir a Saber
          </button>
        </div>
      ) : (
        <>
          {resumen.ultimos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="kicker-neutral">Lo último</div>
              {resumen.ultimos.map((c) => (
                <TarjetaUltimo
                  key={c.id}
                  tema={c.tema}
                  titulo={c.titulo}
                  onClick={() => nav.irDesde({ n: 'ficha', id: c.id }, [{ n: 'inicio' }])}
                />
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <Cifra valor={resumen.total} etiqueta="conocimientos" />
            <Cifra valor={datos.temas.length} etiqueta="temas" />
          </div>
        </>
      )}

      <Version />
    </div>
  )
}

const Saludo = ({ nombre }: { nombre: string }) => (
  <div
    style={{
      fontFamily: 'var(--font-heading)',
      fontWeight: 600,
      fontSize: 22,
      lineHeight: 1.15,
    }}
  >
    {saludo()}
    {nombre ? `, ${nombre}` : ''}
  </div>
)

const TarjetaUltimo = ({ tema, titulo, onClick }: { tema: string; titulo: string; onClick: () => void }) => {
  const ripple = useRipple()

  return (
    <button
      onClick={onClick}
      onPointerDown={ripple.onPointerDown}
      style={{
        width: '100%',
        textAlign: 'left',
        border: '1px solid var(--color-divider)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {ripple.nodo}
      <span className="tag tag-accent" style={{ alignSelf: 'flex-start' }}>
        {tema}
      </span>
      <span className="elipsis" style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600 }}>
        {titulo}
      </span>
    </button>
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

/** El sello de la compilación, igual que en la compra y en Pendientes. */
export const Version = () => (
  <div
    style={{
      marginTop: 4,
      textAlign: 'center',
      fontSize: 10,
      color: 'var(--color-neutral-500)',
      fontFamily: 'var(--font-body)',
    }}
  >
    <span className="cifra">{__VERSION__}</span>
    {' · '}
    {__COMPILADA__}
    {__ENTORNO__ === 'dev' && ' · dev'}
  </div>
)

/** Los mismos huecos que ocupará el contenido, para que nada salte al llegar. */
const Esqueleto = () => (
  <div
    style={{
      border: '1px solid var(--color-divider)',
      borderRadius: 'var(--radius-md)',
      height: 168,
      background: 'var(--color-neutral-200)',
    }}
  />
)
