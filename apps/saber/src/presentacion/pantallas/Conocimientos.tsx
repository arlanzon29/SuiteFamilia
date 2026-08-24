import { useEffect, useState } from 'react'
import { useApp } from '../estado/AppProvider'
import { textoError } from '../componentes/Aviso'
import { Aviso } from '../componentes/Aviso'
import type { Conocimiento } from '../../dominio/modelo'
import { cuandoSeCreo } from '../formato'
import { IconoAvanzar, IconoEnlace, IconoMas } from '../iconos'

/** Cuánto se espera tras la última tecla antes de preguntar al servidor. */
const ESPERA_BUSQUEDA_MS = 300

/**
 * El catálogo de conocimientos: buscador, filtro por tema y «solo lo mío».
 *
 * El listado **no** sale de una instantánea ya cargada: cada cambio de
 * filtro relanza `casos.buscarConocimientos`, que contra Supabase es una
 * consulta con `.eq()` / `.ilike()` — el servidor devuelve solo lo que hace
 * falta pintar, no el catálogo entero. El texto lleva una pequeña espera para
 * no lanzar una consulta por cada letra.
 */
export const Conocimientos = () => {
  const {
    casos,
    datos,
    sesion,
    nav,
    q,
    setQ,
    temaFiltro,
    setTemaFiltro,
    soloMio,
    setSoloMio,
    setDlg,
    versionConocimientos,
  } = useApp()
  const hoy = casos.hoy()

  const [filtrados, setFiltrados] = useState<Conocimiento[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    setCargando(true)
    const espera = setTimeout(() => {
      casos
        .buscarConocimientos({
          tema: temaFiltro,
          soloDe: soloMio ? (sesion?.id ?? null) : null,
          q,
        })
        .then((r) => {
          if (vivo) {
            setFiltrados(r)
            setError(null)
          }
        })
        .catch((e) => vivo && setError(textoError(e)))
        .finally(() => vivo && setCargando(false))
    }, ESPERA_BUSQUEDA_MS)
    return () => {
      vivo = false
      clearTimeout(espera)
    }
  }, [casos, q, temaFiltro, soloMio, sesion, versionConocimientos])

  const sinResultados = !cargando && filtrados.length === 0 && (q.trim() || temaFiltro || soloMio)

  return (
    <div>
      <div
        style={{
          padding: '12px 14px',
          position: 'sticky',
          top: 0,
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-divider)',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <input
          className="input"
          style={{ minHeight: 48, fontSize: 16 }}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar en lo que sabemos…"
        />
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          <Chip activo={temaFiltro === null} onClick={() => setTemaFiltro(null)}>
            Todos
          </Chip>
          {datos.temas.map((t) => (
            <Chip
              key={t.id}
              activo={temaFiltro === t.nombre}
              onClick={() => setTemaFiltro(temaFiltro === t.nombre ? null : t.nombre)}
            >
              {t.nombre}
            </Chip>
          ))}
          <Chip activo={soloMio} onClick={() => setSoloMio(!soloMio)}>
            Lo mío
          </Chip>
        </div>
      </div>

      {error && (
        <div style={{ padding: '14px' }}>
          <Aviso>{error}</Aviso>
        </div>
      )}

      {sinResultados && (
        <div
          style={{
            padding: '34px 20px',
            textAlign: 'center',
            color: 'var(--color-neutral-600)',
            fontSize: 15,
          }}
        >
          Nada que enseñar con ese filtro.
        </div>
      )}

      {filtrados.map((c) => (
        <button
          key={c.id}
          onClick={() => nav.ir({ n: 'ficha', id: c.id })}
          style={{
            width: '100%',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            minHeight: 64,
            borderBottom: '1px solid var(--color-divider)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="tag tag-accent">{c.tema}</span>
              {c.enlace && <IconoEnlace size={13} color="var(--color-neutral-600)" />}
            </div>
            <div className="elipsis" style={{ fontSize: 17, marginTop: 2 }}>
              {c.titulo}
            </div>
          </div>
          <span
            className="cifra"
            style={{ fontSize: 11, color: 'var(--color-neutral-600)', flex: 'none' }}
          >
            {cuandoSeCreo(c.creado, hoy)}
          </span>
          <IconoAvanzar size={16} color="var(--color-neutral-500)" />
        </button>
      ))}

      {/* Hueco al pie para que la última fila no quede bajo el botón flotante. */}
      <div style={{ height: 86 }} />

      {/*
        El botón de apuntar vivía al pie de la lista, y con la búsqueda a lo
        mejor abierta, llegar a él pedía desplazarse hasta el final. Flotando
        sobre el contenido siempre está a un toque, sea cual sea el largo del
        listado —igual que en el Catálogo y el detalle de lista de la app de
        compra, y en la de Pendientes.

        Va `position: absolute` y no `fixed`: el marco de la app
        (`.marco-app` en App.tsx) es el ancestro con posición más cercano, así
        que el botón queda anclado a ese recuadro y no a la ventana entera. El
        contenedor con scroll que hay entre medias no tiene posición propia,
        así que no lo arrastra al desplazarse.

        El `bottom: 78` deja sitio a la barra de pestañas (62px) más un
        margen, igual que en las otras apps.
      */}
      <button
        className="btn-tinte"
        aria-label="Conocimiento nuevo"
        onClick={() => setDlg({ tipo: 'nuevoConocimiento' })}
        style={{
          position: 'absolute',
          right: 16,
          bottom: 78,
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-md)',
          zIndex: 5,
        }}
      >
        <IconoMas size={26} />
      </button>
    </div>
  )
}

const Chip = ({
  activo,
  onClick,
  children,
}: {
  activo: boolean
  onClick: () => void
  children: React.ReactNode
}) => (
  <button
    onClick={onClick}
    aria-pressed={activo}
    style={{
      flex: 'none',
      height: 36,
      padding: '0 14px',
      borderRadius: 999,
      border: `1px solid ${activo ? 'var(--color-accent)' : 'var(--color-divider)'}`,
      background: activo ? 'var(--color-accent-100)' : 'transparent',
      color: activo ? 'var(--color-accent-800)' : 'var(--color-neutral-700)',
      fontSize: 13,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </button>
)
