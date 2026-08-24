import { useEffect, useState } from 'react'
import {
  animate,
  motion,
  useMotionValue,
  type MotionValue,
  type PanInfo,
} from 'framer-motion'
import type { Articulo } from '../../dominio/modelo'
import type { Precio } from '../../dominio/modelo'
import { useApp } from '../estado/AppProvider'
import { buscaArticulos, cuentaFavoritos, mejor } from '../estado/consultas'
import { eur } from '../formato'
import { Miniatura } from '../componentes/Miniatura'
import { FiltroFavoritos } from '../componentes/Favorito'
import { IconoFavorito, IconoLapiz, IconoMas } from '../iconos'

/**
 * El catálogo: artículos genéricos y el mejor precio conocido. Desde aquí se
 * entra a la ficha (comparativa) y a la entrada masiva de precios, que es
 * como se rellena una tienda entera en una visita.
 *
 * La unidad no se enseña en la fila: ya no cabía sin recortar el nombre, y
 * quien la necesita la ve en la ficha o al apuntar un precio. Lo mismo con el
 * favorito: no es una columna, es una estrellita junto al nombre —marcarlo se
 * hace desde «Editar», no desde la fila.
 *
 * Editar es deslizar la fila hacia la izquierda: revela un lápiz, mismo
 * gesto que «Eliminar» en el detalle de lista (ver
 * `docs/gestos-lista-swipe.md` para el porqué de cada pieza —el
 * `useMotionValue` propio, el `animate()` incondicional, el `position:
 * relative` para que el botón de detrás quede tapado—). Antes era una
 * columna fija de 48px con el texto «Ed»; con el swipe, esos 48px vuelven a
 * la fila y el botón solo aparece cuando se busca.
 */
export const Catalogo = ({ estiramiento }: { estiramiento: MotionValue<number> }) => {
  const { datos, nav, q, setQ, soloFav, setDlg, setVisor, imagenes } = useApp()

  const favoritos = cuentaFavoritos(datos)
  const filtrados = buscaArticulos(datos, q, soloFav)
  // Buscando, el hueco ofrece crear el artículo. Con el filtro de favoritos
  // puesto no: lo que falta no es el artículo, es la estrella.
  const sinResultados = q.trim().length > 0 && filtrados.length === 0 && !soloFav
  const sinFavoritos = soloFav && filtrados.length === 0

  // Qué fila tiene el lápiz revelado. Solo una a la vez: abrir otra cierra
  // la anterior, como en el detalle de lista.
  const [abierto, setAbierto] = useState<string | null>(null)

  return (
    <div>
      {/*
        El estiramiento va en un `motion.div` que envuelve TODO menos el
        botón flotante de abajo: si el botón quedara dentro, el `transform`
        de este `div` se convertiría en su «containing block» (es
        `position: absolute`) y se movería con el estiramiento en vez de
        quedarse fijo. Ver `docs/gestos-lista-swipe.md` §8.
      */}
      <motion.div style={{ y: estiramiento }}>
      <div
        style={{
          padding: '12px 14px',
          position: 'sticky',
          top: 0,
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-divider)',
          zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="input"
            style={{ minHeight: 48, fontSize: 16 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar en el catálogo…"
          />
          <FiltroFavoritos cuantos={favoritos} />
        </div>
      </div>

      {sinFavoritos && (
        <div
          style={{
            padding: '34px 20px',
            textAlign: 'center',
            color: 'var(--color-neutral-600)',
            fontSize: 15,
          }}
        >
          {q.trim()
            ? `Ningún favorito con «${q.trim()}».`
            : 'Todavía no hay ningún favorito. Se marcan al editar el artículo.'}
        </div>
      )}

      {sinResultados && (
        <div
          style={{
            padding: '34px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20 }}>
            Ningún artículo con «{q.trim()}»
          </div>
          <button
            className="btn btn-primary"
            style={{ minHeight: 48 }}
            onClick={() => setDlg({ tipo: 'nuevoArt', valor: q.trim() })}
          >
            Crear «{q.trim()}»
          </button>
        </div>
      )}

      {filtrados.map((a) => (
        <FilaCatalogo
          key={a.id}
          a={a}
          m={mejor(datos, a.id)}
          foto={imagenes.foto(a.id)}
          abierta={abierto === a.id}
          onAbrir={(id) => setAbierto(id)}
          onVerFoto={() => setVisor({ artId: a.id })}
          onVerFicha={() => nav.ir({ n: 'ficha', id: a.id })}
          onEditar={() => {
            setAbierto(null)
            setDlg({ tipo: 'editArt', id: a.id })
          }}
        />
      ))}

      {/* Hueco al pie: sin él, la última fila queda pegada a la barra de
          pestañas. */}
      <div style={{ height: 16 }} />
      </motion.div>

      {/*
        El botón de crear vivía al pie de la lista, y la lista solo crece: con
        cien artículos hay que desplazarse entero para llegar a él. Flotando
        sobre el contenido siempre está a un toque, sea cual sea el largo de
        la lista —el mismo sitio que ocupa en la app de Contactos de Android.

        Va `position: absolute` y no `fixed`: el marco de la app
        (`.marco-app` en App.tsx) es el ancestro con posición más cercano, así
        que el botón queda anclado a ese recuadro de 440px y no a la ventana
        entera. El contenedor con scroll que hay entre medias no tiene
        posición propia, así que no lo arrastra al desplazarse.

        El `bottom: 62` coincide con el alto de la barra de pestañas
        (`BarraPestanas`), para no taparla.
      */}
      <button
        className="btn-tinte"
        aria-label="Artículo nuevo"
        onClick={() => setDlg({ tipo: 'nuevoArt' })}
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

/** Mismo muelle que el swipe del detalle de lista: mismo tacto en toda la app. */
const MUELLE = { type: 'spring', stiffness: 500, damping: 40 } as const

const FilaCatalogo = ({
  a,
  m,
  foto,
  abierta,
  onAbrir,
  onVerFoto,
  onVerFicha,
  onEditar,
}: {
  a: Articulo
  m: Precio | null
  foto: string | undefined
  abierta: boolean
  onAbrir: (id: string | null) => void
  onVerFoto: () => void
  onVerFicha: () => void
  onEditar: () => void
}) => {
  const x = useMotionValue(0)

  // Otra fila se ha abierto: si esta ya no es la abierta, vuelve a su sitio.
  useEffect(() => {
    if (!abierta) animate(x, 0, MUELLE)
  }, [abierta, x])

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    // Umbral a mitad del botón (48px de ancho), o gesto rápido aunque corto.
    const abrir = info.offset.x < -24 || info.velocity.x < -400
    animate(x, abrir ? -48 : 0, MUELLE)
    onAbrir(abrir ? a.id : null)
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <button
        onClick={onEditar}
        aria-label={`Editar ${a.nombre}`}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-accent)',
          color: '#fff',
        }}
      >
        <IconoLapiz size={18} />
      </button>
      <motion.div
        drag="x"
        dragConstraints={{ left: -48, right: 0 }}
        dragElastic={0.06}
        dragMomentum={false}
        onDragEnd={onDragEnd}
        style={{
          x,
          // Mismo motivo que en el detalle de lista: `position: relative`
          // (sin z-index) mete la fila en la misma capa de apilamiento que
          // el botón de abajo, así pinta después de él y lo tapa mientras
          // está cerrada.
          position: 'relative',
          touchAction: 'pan-y',
          background: 'var(--color-bg)',
          display: 'flex',
          alignItems: 'stretch',
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        {/*
          La foto sale del botón de la fila y va en uno propio.

          No es capricho de maquetación: un botón dentro de otro no es HTML
          válido, y la fila entera **es** el botón que lleva a la ficha. Para
          que tocar la foto haga otra cosa —ampliarla— tiene que ser hermana
          suya, no hija.

          Solo cuando hay foto. El recuadro con la inicial no se amplía
          —no hay nada que leer en una letra—, así que ese se queda dentro
          de la fila y sigue llevando a la ficha como hasta ahora.
        */}
        {foto && (
          <button
            onClick={onVerFoto}
            aria-label={`Ver la foto de ${a.nombre}`}
            style={{
              flex: 'none',
              display: 'flex',
              alignItems: 'center',
              padding: '0 0 0 14px',
            }}
          >
            <Miniatura src={foto} nombre={a.nombre} tamano={40} />
          </button>
        )}
        <button
          onClick={onVerFicha}
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            // Con foto, el hueco de la izquierda ya lo pone su botón; sin
            // ella, este padding es el de siempre y la fila no se mueve.
            padding: foto ? '0 8px 0 10px' : '0 8px 0 14px',
            minHeight: 60,
            textAlign: 'left',
          }}
        >
          {!foto && <Miniatura nombre={a.nombre} tamano={40} />}
          {a.favorito && <IconoFavorito size={14} relleno color="var(--color-accent)" />}
          <span className="elipsis" style={{ flex: 1, fontSize: 17 }}>
            {a.nombre}
          </span>
          <span
            className="cifra"
            style={{
              fontSize: 12,
              color: 'var(--color-neutral-600)',
              width: 74,
              textAlign: 'right',
            }}
          >
            {m ? eur(m.importe) : 'sin precio'}
          </span>
        </button>
      </motion.div>
    </div>
  )
}
