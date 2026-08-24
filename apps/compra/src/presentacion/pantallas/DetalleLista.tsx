import { useEffect, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, type PanInfo } from 'framer-motion'
import { ordenDeCompra, pendientes } from '../../dominio/modelo'
import type { Articulo, ItemLista, Precio, Supermercado } from '../../dominio/modelo'
import { useApp } from '../estado/AppProvider'
import { articulo, lista, mejor, supermercado } from '../estado/consultas'
import { MOSTRAR_TOTAL_LISTA } from '../config'
import { eur } from '../formato'
import { Miniatura } from '../componentes/Miniatura'
import { Aviso, textoError } from '../componentes/Aviso'
import { IconoAvanzar, IconoBorrar, IconoMas } from '../iconos'

/**
 * La pantalla que se usa en la tienda.
 *
 * Toda la fila marca el artículo como cogido al tocarla: es el gesto más
 * frecuente en el pasillo y merece el objetivo táctil grande. Los cogidos
 * bajan al final. El botón de precio de la derecha es el acceso a la
 * comparativa; no se apuntan precios desde aquí.
 *
 * Quitar un artículo es deslizar la fila hacia la izquierda: revela un
 * «Eliminar» que antes vivía repartido en los +/− de cantidad (bajar a 0
 * quitaba el artículo, pero costaba un toque por unidad). El detalle de cómo
 * está hecho el gesto —el muelle, el porqué del `position: relative`, el
 * `overscroll-behavior`, el estiramiento en los bordes— está documentado en
 * [`../../../docs/gestos-lista-swipe.md`](../../../docs/gestos-lista-swipe.md),
 * pensado para poder replicarlo en otra lista sin tener que releer este
 * archivo entero.
 *
 * Los errores salen **pegados al control que ha fallado**, no arriba del todo:
 * en una lista de veinte artículos, un aviso en la cabecera no lo ve quien está
 * tocando la última fila. Hasta que las listas fueron de Supabase esto no hacía
 * falta, porque en memoria nada fallaba nunca.
 */
export const DetalleLista = ({ listaId }: { listaId: string }) => {
  const { datos, acciones, nav, sim, setSim, imagenes, setVisor, setQ, setPanelAnadir } =
    useApp()
  const actual = lista(datos, listaId)

  // Un solo fallo a la vez, con la clave de a quién pertenece: el `artId` de la
  // fila, o 'lista' para lo que afecta a la lista entera.
  const [fallo, setFallo] = useState<{ clave: string; texto: string } | null>(null)

  // Qué fila tiene el «Eliminar» revelado. Solo una a la vez: abrir otra
  // cierra la anterior, como en las apps de correo.
  const [abierto, setAbierto] = useState<string | null>(null)

  const intenta = (clave: string, accion: () => Promise<unknown>) => {
    setFallo(null)
    void accion().catch((e: unknown) => setFallo({ clave, texto: textoError(e) }))
  }

  if (sim === 'loading') return <Esqueletos />
  if (sim === 'error') return <ErrorSincronizacion onReintentar={() => setSim(null)} />
  if (!actual) return null

  const bloqueada = !!actual.cerrada
  const items = ordenDeCompra(actual.items)

  const estimado = pendientes(actual).reduce((suma, it) => {
    const m = mejor(datos, it.artId)
    return m ? suma + m.importe * it.cant : suma
  }, 0)

  return (
    <div>
      {bloqueada && (
        <div
          style={{
            margin: '12px 14px 0',
            padding: '12px 14px',
            border: '1px solid var(--color-accent)',
            background: 'var(--color-accent-100)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--color-accent-800)' }}>
              Lista cerrada. Solo consulta.
            </span>
            <button
              className="btn btn-secondary"
              style={{ minHeight: 44, fontSize: 13 }}
              onClick={() => intenta('lista', () => acciones.reabrirLista(actual.id))}
            >
              Reabrir
            </button>
          </div>
          {fallo?.clave === 'lista' && <Aviso>{fallo.texto}</Aviso>}
        </div>
      )}

      {items.length === 0 && !bloqueada && (
        <div
          style={{
            padding: '44px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              border: '1px solid var(--color-divider)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent)',
            }}
          >
            <IconoMas size={24} />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22 }}>Lista vacía</div>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: 'var(--color-neutral-700)',
              maxWidth: '26ch',
            }}
          >
            Añade artículos uno a uno con el botón de abajo, o dicta la lista entera de golpe.
          </p>
          <button
            className="btn btn-secondary"
            style={{ minHeight: 48 }}
            onClick={() => nav.ir({ n: 'dictar', id: actual.id })}
          >
            Dictar o pegar lista
          </button>
        </div>
      )}

      {items.length > 0 && (
        <>
          <div style={{ padding: '6px 0 12px' }}>
            <AnimatePresence>
              {items.map((it, indice) => {
                const a = articulo(datos, it.artId)
                if (!a) return null
                const m = mejor(datos, it.artId)
                const tienda = m ? supermercado(datos, m.superId) : undefined

                return (
                  <FilaArticulo
                    key={it.artId}
                    indice={indice}
                    it={it}
                    a={a}
                    m={m}
                    tienda={tienda}
                    bloqueada={bloqueada}
                    foto={imagenes.foto(a.id)}
                    abierta={abierto === it.artId}
                    onAbrir={(id) => setAbierto(id)}
                    onVerFoto={() => setVisor({ artId: a.id })}
                    onAlternar={() =>
                      intenta(it.artId, () =>
                        acciones.marcarComprado(actual.id, it.artId, !it.comprado),
                      )
                    }
                    onEliminar={() => {
                      setAbierto(null)
                      intenta(it.artId, () => acciones.cambiarCantidad(actual.id, it.artId, 0))
                    }}
                    onVerFicha={() => nav.ir({ n: 'ficha', id: it.artId })}
                    fallo={fallo?.clave === it.artId ? fallo.texto : undefined}
                  />
                )
              })}
            </AnimatePresence>
          </div>

          <div
            style={{
              padding: '4px 14px 26px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {MOSTRAR_TOTAL_LISTA && (
              <div
                className="cifra"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 14,
                  padding: '10px 0',
                  borderBottom: '1px solid var(--color-divider)',
                }}
              >
                <span style={{ color: 'var(--color-neutral-700)' }}>
                  Estimado (cada artículo en su tienda más barata)
                </span>
                <span>{eur(estimado)}</span>
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>
              Toca el precio de un artículo para verlo en cada supermercado.
            </div>
          </div>
        </>
      )}

      {/*
        La barra fija de «Añadir artículo del catálogo» competía con la
        navegación y tapaba las últimas filas en listas largas. En su lugar,
        un único botón flotante: es la acción que más se repite en la tienda
        —añadir uno más— y siempre está al alcance del pulgar, largo lo que
        largo sea el carro. «Dictar o pegar» y «Cerrar lista», al ser
        acciones de una sola vez por lista (se dictan al principio, se cierra
        al final), no merecen un FAB propio: viven en el menú de la
        cabecera (ver `Cabecera.tsx`), alcanzable sin bajar hasta el final de
        una lista larga.

        Se ancla al mismo `.marco-app` que el de Catálogo (ver ese comentario
        para el porqué de `absolute` y no `fixed`), y se oculta con la lista
        cerrada: sin edición, no hay nada que añadir.
      */}
      {!bloqueada && (
        <button
          className="btn-tinte"
          aria-label="Añadir artículo del catálogo"
          onClick={() => {
            setQ('')
            setPanelAnadir(true)
          }}
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
      )}
    </div>
  )
}

/** Muelle único para abrir/cerrar el swipe: mismo tacto en toda la lista. */
const MUELLE = { type: 'spring', stiffness: 500, damping: 40 } as const

/**
 * Una fila arrastrable, con su propio `useMotionValue`.
 *
 * La posición del swipe se controla con un `useMotionValue` propio de cada
 * fila, no con la prop `animate` de framer-motion atada al estado `abierto`:
 * atada al estado, si el gesto terminaba en el mismo lado en el que ya
 * estaba (p. ej. sueltas antes de cruzar el umbral y la fila ya estaba
 * cerrada), el estado no cambiaba, React no volvía a renderizar, y `animate`
 * nunca disparaba la animación de vuelta —la fila se quedaba exactamente
 * donde la soltaste, a medias. Con el valor propio y una llamada explícita a
 * `animate(x, …)` dentro de `onDragEnd`, el muelle se dispara siempre, sin
 * depender de que el estado cambie.
 */
const FilaArticulo = ({
  indice,
  it,
  a,
  m,
  tienda,
  bloqueada,
  foto,
  abierta,
  onAbrir,
  onVerFoto,
  onAlternar,
  onEliminar,
  onVerFicha,
  fallo,
}: {
  indice: number
  it: ItemLista
  a: Articulo
  m: Precio | null
  tienda: Supermercado | undefined
  bloqueada: boolean
  foto: string | undefined
  abierta: boolean
  onAbrir: (id: string | null) => void
  onVerFoto: () => void
  onAlternar: () => void
  onEliminar: () => void
  onVerFicha: () => void
  fallo?: string
}) => {
  const opac = it.comprado ? 0.5 : 1
  const x = useMotionValue(0)

  // Otra fila se ha abierto (o se ha cerrado desde fuera, p. ej. al borrar):
  // si esta ya no es la abierta, vuelve a su sitio con el mismo muelle.
  useEffect(() => {
    if (!abierta) animate(x, 0, MUELLE)
  }, [abierta, x])

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    // Se abre si se ha arrastrado más de la mitad del botón, o si el gesto
    // ha sido rápido aunque corto (fling): la velocidad cuenta tanto como
    // la distancia, que es justo el «gravedad» de Android.
    const abrir = info.offset.x < -40 || info.velocity.x < -400
    animate(x, abrir ? -80 : 0, MUELLE)
    onAbrir(abrir ? it.artId : null)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{
        opacity: 1,
        height: 'auto',
        transition: { delay: indice * 0.035, ...MUELLE },
      }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.18 } }}
      style={{ overflow: 'hidden' }}
    >
      {/*
        «Eliminar» vive debajo, a la derecha, tapado por la fila. La fila es
        la que se arrastra (`motion.div`); al soltar, `onDragEnd` decide si
        se queda abierta (revela el botón) o vuelve a su sitio, con un
        muelle en vez de una transición lineal.

        El contenedor de fuera también es `motion.div`: al montar la lista,
        cada fila aparece con un pequeño fundido + alto creciente, escalonada
        por `indice` (el «item animator» de RecyclerView). Al borrar, `exit`
        la encoge a alto 0 en vez de desaparecer de golpe; con `layout`, las
        filas de abajo se deslizan para cerrar el hueco en lugar de saltar.
      */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {!bloqueada && (
          <button
            onClick={onEliminar}
            aria-label={`Eliminar ${a.nombre} de la lista`}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#c0392b',
              color: '#fff',
            }}
          >
            <IconoBorrar size={20} />
          </button>
        )}
        <motion.div
          drag={bloqueada ? false : 'x'}
          dragConstraints={{ left: -80, right: 0 }}
          dragElastic={0.06}
          dragMomentum={false}
          onDragEnd={onDragEnd}
          style={{
            // `x` es el motion value propio de la fila: la posición durante
            // el arrastre y la del muelle al soltar viven en el mismo sitio,
            // sin una prop `animate` en paralelo peleándose por el control.
            x,
            // `position: relative` (sin más) mete esta fila en la misma capa
            // de apilamiento que el botón de abajo: así pinta después de él
            // y lo tapa mientras está cerrada. Sin esto, un elemento
            // `position: absolute` se pinta SIEMPRE por encima de uno sin
            // posicionar, sin importar el orden en el HTML.
            position: 'relative',
            touchAction: 'pan-y',
            background: 'var(--color-bg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              borderBottom: '1px solid var(--color-divider)',
            }}
          >
            {/*
              Fuera la casilla: marcar comprado es tocar el nombre.

              La casilla era 30px de ancho más su hueco, y lo que decía lo
              dicen ya el tachado del nombre y el 50% de opacidad de la fila
              entera —la foto incluida—. Lo que se gana con esos píxeles es
              la foto al doble: 76 en vez de 38, que es la diferencia entre
              reconocer lo que ya sabes y poder leer la etiqueta desde el
              carro.

              La fila NO crece: sigue midiendo los 80px que fijaba antes la
              columna del + y el −, y la foto los ocupa casi enteros.
            */}
            {foto && (
              <button
                onClick={onVerFoto}
                aria-label={`Ver la foto de ${a.nombre}`}
                style={{
                  flex: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px 0 2px 14px',
                }}
              >
                <Miniatura src={foto} nombre={a.nombre} tamano={76} opacidad={opac} />
              </button>
            )}

            <button
              onClick={() => {
                if (!bloqueada) onAlternar()
              }}
              aria-pressed={it.comprado}
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                /*
                  8 arriba y abajo, no 12. Con el nombre a 21px, dos lineas
                  mas la cantidad suman 79px de contenido: con los 12 de
                  antes la fila se iria a 87 y dejaria de medir los 80px de
                  alto de la fila.
                */
                padding: foto ? '8px 8px 8px 12px' : '8px 8px 8px 14px',
                textAlign: 'left',
                minHeight: 80,
              }}
            >
              {/*
                Sin foto, la inicial se queda dentro del botón del nombre: no
                hay nada que ampliar, y un hueco muerto de 76px en la fila
                que más se toca se paga en cada compra.
              */}
              {!foto && <Miniatura nombre={a.nombre} tamano={76} opacidad={opac} />}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    /*
                      21px, no 17. Esto se lee en el pasillo, con el carro en
                      la otra mano y el movil a la distancia del brazo: es el
                      unico texto de la fila que hay que reconocer de un
                      vistazo.

                      El interlineado va FIJO en 24. Sin fijarlo, el alto de
                      la fila depende de lo que el navegador decida para
                      `normal`, y lo que se esta ajustando al pixel son
                      justo esos 80px.
                    */
                    fontSize: 21,
                    lineHeight: '24px',
                    textDecoration: it.comprado ? 'line-through' : 'none',
                    opacity: opac,
                  }}
                >
                  {a.nombre}
                </span>
                <span
                  className="cifra"
                  style={{
                    display: 'block',
                    /*
                      Interlineado fijo aqui tambien: con el `normal` del
                      navegador esta linea gastaba 19px, y la fila con foto y
                      nombre de dos lineas se iba a 84 en vez de a los 81 de
                      §3 undecies.
                    */
                    fontSize: 12,
                    lineHeight: '16px',
                    color: 'var(--color-neutral-600)',
                  }}
                >
                  {it.cant} {a.unidad}
                </span>
              </span>
            </button>

            <button
              onClick={onVerFicha}
              aria-label="Ver precios por supermercado"
              style={{
                width: 96,
                flex: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '0 4px 0 8px',
                borderLeft: '1px solid var(--color-divider)',
                textAlign: 'right',
              }}
            >
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  className="cifra"
                  style={{
                    display: 'block',
                    /*
                      El importe se queda en 14. «sin precio» baja a 13 y va
                      sin partir: es la cadena mas larga que pasa por aqui y,
                      estrechada la columna, a 14 se partia en dos lineas. Es
                      ademas la que menos importa —lo que se lee es la
                      cifra—.
                    */
                    fontSize: m ? 14 : 13,
                    whiteSpace: 'nowrap',
                    color: 'var(--color-accent-700)',
                  }}
                >
                  {m ? eur(m.importe) : 'sin precio'}
                </span>
                <span
                  className="elipsis"
                  style={{
                    display: 'block',
                    fontSize: 11,
                    color: 'var(--color-neutral-600)',
                  }}
                >
                  {tienda ? tienda.nombre : 'ver precios'}
                </span>
              </span>
              <IconoAvanzar size={16} color="var(--color-accent)" />
            </button>
          </div>
        </motion.div>
      </div>
      {fallo && (
        <div style={{ padding: '10px 14px 12px' }}>
          <Aviso>{fallo}</Aviso>
        </div>
      )}
    </motion.div>
  )
}

const Esqueletos = () => (
  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        style={{
          height: 64,
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-neutral-200)',
          animation: 'pulse 1.4s ease-in-out infinite',
        }}
      />
    ))}
  </div>
)

const ErrorSincronizacion = ({ onReintentar }: { onReintentar: () => void }) => (
  <div
    style={{
      padding: '26px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      alignItems: 'flex-start',
    }}
  >
    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22 }}>
      No se ha podido sincronizar
    </div>
    <p style={{ margin: 0, fontSize: 14, color: 'var(--color-neutral-700)' }}>
      Los cambios que hagas se guardan en el móvil y se enviarán cuando vuelva la conexión.
    </p>
    <button className="btn btn-primary" style={{ minHeight: 48 }} onClick={onReintentar}>
      Reintentar
    </button>
  </div>
)
