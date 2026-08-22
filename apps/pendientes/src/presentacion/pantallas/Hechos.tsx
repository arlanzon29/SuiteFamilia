import { useApp } from '../estado/AppProvider'
import { hechosPorMeses } from '../estado/consultas'
import { Aviso } from '../componentes/Aviso'
import { FilaHecha } from '../componentes/FilaPendiente'
import { nombreMes, plural } from '../formato'
import { IconoHecho } from '../iconos'

/**
 * Lo resuelto, agrupado por el mes en que se hizo y de lo más reciente a lo más
 * antiguo.
 *
 * Se agrupa por la fecha de realización, no por la de anotación: la pregunta
 * que contesta esta pantalla es «¿qué hemos resuelto?», y en segundo lugar
 * «¿cuándo hicimos aquello?» —cuándo se cambió la bombona, cuándo se llevó la
 * ropa a la tintorería—. Por eso cada fila cuenta las dos fechas.
 *
 * Las filas llevan a la ficha como las de Pendientes: es donde se deshace un
 * «hecho» apuntado por error.
 */
export const Hechos = () => {
  const { casos, datos, cargando, error, nav } = useApp()
  const hoy = casos.hoy()
  const grupos = hechosPorMeses(datos)
  // La cuenta del mes llega aparte y no sale de los grupos: lo cargado son
  // los ultimos resueltos, que pueden ser todos de meses anteriores.
  const resueltosEsteMes = datos.resueltosEsteMes

  if (grupos.length === 0 && !cargando) {
    return (
      <div
        style={{
          minHeight: '100%',
          padding: '36px 26px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 18,
        }}
      >
        {error && <Aviso>{error}</Aviso>}
        <IconoHecho size={44} color="var(--color-accent)" />
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 26 }}>
          Todavía nada resuelto
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            color: 'var(--color-neutral-600)',
            maxWidth: 250,
          }}
        >
          Lo que des por hecho se irá guardando aquí, por meses, para poder consultarlo
          después.
        </p>
      </div>
    )
  }

  return (
    <div
      style={{ padding: '14px 14px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}
    >
      {error && <Aviso>{error}</Aviso>}

      {grupos.map((g) => (
        <section key={g.mes} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="kicker-neutral cifra">{nombreMes(g.mes)}</span>
            <span style={{ flex: 1, height: 1, background: 'var(--color-divider)' }} />
          </div>
          {g.pendientes.map((p) => (
            <FilaHecha
              key={p.id}
              p={p}
              hoy={hoy}
              abrir={() => nav.ir({ n: 'ficha', id: p.id })}
            />
          ))}
        </section>
      ))}

      <div
        className="cifra"
        style={{
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--color-neutral-500)',
          paddingTop: 4,
        }}
      >
        {resueltosEsteMes
          ? `${plural(resueltosEsteMes, 'pendiente resuelto', 'pendientes resueltos')} este mes`
          : 'Ninguno resuelto este mes'}
      </div>
    </div>
  )
}
