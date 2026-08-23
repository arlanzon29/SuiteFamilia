import { useState } from 'react'
import { useApp } from '../estado/AppProvider'
import type { Simulacion } from '../estado/rutas'
import { Aviso, textoError } from '../componentes/Aviso'
import { IconoAvanzar, IconoBorrar, IconoMas } from '../iconos'

export const Ajustes = () => {
  const { datos, sesion, salir, actualizarNombre, tema, sim, setSim, setDlg } = useApp()

  const [nombre, setNombre] = useState(sesion?.nombre ?? '')
  const [guardandoNombre, setGuardandoNombre] = useState(false)
  const [errorNombre, setErrorNombre] = useState<string | null>(null)

  const guardarNombre = async () => {
    setGuardandoNombre(true)
    setErrorNombre(null)
    try {
      await actualizarNombre(nombre)
    } catch (e) {
      setErrorNombre(textoError(e))
    } finally {
      setGuardandoNombre(false)
    }
  }

  return (
    <div
      style={{ padding: '14px 14px 30px', display: 'flex', flexDirection: 'column', gap: 22 }}
    >
      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="kicker-neutral">Temas</div>
        {datos.temas.map((t) => {
          return (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 0',
                borderBottom: '1px solid var(--color-divider)',
                minHeight: 52,
              }}
            >
              <span style={{ flex: 1, fontSize: 17 }}>{t.nombre}</span>
              <button
                onClick={() => setDlg({ tipo: 'renTema', id: t.id })}
                aria-label={`Renombrar ${t.nombre}`}
                style={{ width: 44, height: 44, color: 'var(--color-accent)', fontSize: 15 }}
              >
                Ed
              </button>
              <button
                onClick={() => setDlg({ tipo: 'borrarTema', id: t.id })}
                aria-label={`Borrar ${t.nombre}`}
                style={{
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-accent)',
                }}
              >
                <IconoBorrar size={18} />
              </button>
            </div>
          )
        })}
        <button
          className="btn btn-primary"
          style={{ minHeight: 48, display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={() => setDlg({ tipo: 'nuevoTema' })}
        >
          <IconoMas size={18} />
          Añadir tema
        </button>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="kicker-neutral">Apariencia</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 52 }}>
          <span style={{ flex: 1, fontSize: 16 }}>Tema</span>
          <div className="seg">
            <label className="seg-opt" style={{ minHeight: 44, paddingInline: 16 }}>
              <input
                type="radio"
                name="tema"
                checked={tema.tema === 'light'}
                onChange={() => tema.setTema('light')}
              />
              Claro
            </label>
            <label className="seg-opt" style={{ minHeight: 44, paddingInline: 16 }}>
              <input
                type="radio"
                name="tema"
                checked={tema.tema === 'dark'}
                onChange={() => tema.setTema('dark')}
              />
              Oscuro
            </label>
          </div>
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="kicker-neutral">Demostración de estados</div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-neutral-600)' }}>
          Fuerza el estado de la ficha para revisar el diseño.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(
            [
              [null, 'Normal'],
              ['loading', 'Cargando'],
              ['error', 'Error'],
            ] as Array<[Simulacion, string]>
          ).map(([valor, etiqueta]) => (
            <button
              key={etiqueta}
              className="btn btn-secondary"
              style={{
                minHeight: 46,
                borderColor: sim === valor ? 'var(--color-accent)' : undefined,
              }}
              onClick={() => setSim(valor)}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="kicker-neutral">Cuenta</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 48 }}>
          <span style={{ flex: 'none', fontSize: 16 }}>Nombre</span>
          <input
            className="input"
            style={{ flex: 1, minHeight: 44, fontSize: 16 }}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Cómo quieres que te llamemos"
            maxLength={40}
          />
          <button
            className="btn btn-secondary"
            style={{ minHeight: 44, flexShrink: 0 }}
            onClick={() => void guardarNombre()}
            disabled={guardandoNombre || nombre.trim() === (sesion?.nombre ?? '')}
          >
            {guardandoNombre ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
        {errorNombre && <Aviso>{errorNombre}</Aviso>}
        <div style={{ fontSize: 14, color: 'var(--color-neutral-700)' }}>
          {sesion?.email} · datos compartidos con 1 persona más
        </div>
        <button
          className="btn btn-secondary"
          style={{ minHeight: 48 }}
          onClick={() => void salir()}
        >
          Cerrar sesión
        </button>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <a
          href="/SuiteFamilia/suite/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minHeight: 48,
            fontSize: 16,
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          <span style={{ flex: 1 }}>Suite Familia</span>
          <IconoAvanzar size={18} color="var(--color-neutral-600)" />
        </a>
      </section>
    </div>
  )
}
