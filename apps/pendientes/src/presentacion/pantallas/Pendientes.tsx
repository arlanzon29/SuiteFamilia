import { useState } from 'react'
import { useApp } from '../estado/AppProvider'
import { listaMasAdelante, listaPorHacer } from '../estado/consultas'
import { Aviso } from '../componentes/Aviso'
import { FilaPorHacer } from '../componentes/FilaPendiente'
import { IconoHoja, IconoLista, IconoMas } from '../iconos'
import { plural } from '../formato'

/**
 * La lista de lo que queda por hacer, que es la pantalla principal.
 *
 * Va de lo más antiguo a lo más reciente, y ese orden es la única jerarquía que
 * tiene la aplicación: no hay prioridades ni etiquetas, así que lo que sube
 * arriba es lo que lleva más tiempo esperando. Es también la razón de que la
 * fila cuente cuándo se anotó y no otra cosa.
 *
 * Incluye el estado vacío —la pantalla 04 del boceto— porque es la misma
 * pantalla en otro momento, no otra: separarla obligaría a que algo de fuera
 * decidiera cuál pintar, y esa decisión es de aquí.
 */
export const Pendientes = () => {
  const { casos, datos, cargando, error, nav, setDlg } = useApp()
  const hoy = casos.hoy()
  const filas = listaPorHacer(datos, hoy)
  const masAdelante = listaMasAdelante(datos, hoy)
  const [abierto, setAbierto] = useState(false)

  if (filas.length === 0 && !cargando) {
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
        <IconoHoja size={44} color="var(--color-accent)" />
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 26 }}>
          La casa está al día
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            color: 'var(--color-neutral-600)',
            maxWidth: 250,
          }}
        >
          No hay nada apuntado. Cuando algo se quede a medias, escríbelo aquí antes de que
          se olvide.
        </p>
        <button
          className="btn btn-primary btn-tinte"
          style={{ width: '100%', minHeight: 52, fontSize: 16, marginTop: 4 }}
          onClick={() => setDlg({ tipo: 'nuevo' })}
        >
          <IconoMas size={18} />
          Apuntar el primero
        </button>
      </div>
    )
  }

  return (
    <div
      style={{ padding: '14px 14px 26px', display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      {error && <Aviso>{error}</Aviso>}

      {filas.map((p) => (
        <FilaPorHacer
          key={p.id}
          p={p}
          hoy={hoy}
          abrir={() => nav.ir({ n: 'ficha', id: p.id })}
        />
      ))}

      <button
        className="btn btn-primary btn-tinte"
        style={{ minHeight: 52, fontSize: 16, marginTop: 4 }}
        onClick={() => setDlg({ tipo: 'nuevo' })}
      >
        <IconoMas size={18} />
        Pendiente nuevo
      </button>

      {/*
        Lo apuntado para más adelante, en voz baja y plegado.

        Existe porque si no, no habría forma de llegar a ello: un pendiente
        apuntado en marzo para noviembre no saldría en ninguna pantalla hasta
        noviembre, y una fecha mal escrita no se podría corregir. Va cerrado y
        con la cuenta a la vista, que es lo justo para saber que están ahí sin
        que estorben a lo de esta semana, que es de lo que va la lista.
      */}
      {masAdelante.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/*
            Un botón y no un `<details>`: el triángulo de `summary` solo se
            quita con CSS —y en WebKit con un pseudoelemento—, y `tokens.css`
            está copiado byte a byte de la compra. Antes que ensuciar la hoja
            compartida por un icono, se abre a mano.
          */}
          <button
            className="cifra"
            onClick={() => setAbierto(!abierto)}
            aria-expanded={abierto}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              fontSize: 12,
              color: 'var(--color-neutral-600)',
              padding: '10px 2px',
              minHeight: 44,
            }}
          >
            <IconoLista size={16} />
            {plural(masAdelante.length, 'apuntado', 'apuntados')} para más adelante
          </button>
          {abierto &&
            masAdelante.map((p) => (
              <FilaPorHacer
                key={p.id}
                p={p}
                hoy={hoy}
                abrir={() => nav.ir({ n: 'ficha', id: p.id })}
              />
            ))}
        </div>
      )}
    </div>
  )
}
