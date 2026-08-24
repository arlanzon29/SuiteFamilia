/**
 * Aviso de versión nueva, arriba del todo del marco de la app.
 *
 * En flujo normal y no `position: absolute`: va antes de la cabecera —y
 * antes del formulario de entrar, si aún no hay sesión—, así que empuja el
 * contenido hacia abajo en vez de taparlo. Flotar encima habría cubierto el
 * título y los botones de tema/cerrar de la cabecera.
 *
 * Sin botón de actualizar: solo avisa. Quien lo ve arrastra el dedo para
 * refrescar o cierra y reabre la app.
 */
export const AvisoVersion = () => (
  <div
    role="status"
    style={{
      flex: 'none',
      display: 'flex',
      alignItems: 'center',
      margin: '10px 12px 0',
      padding: '10px 12px',
      border: '1px solid var(--color-accent)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--color-accent-100)',
      color: 'var(--color-accent-800)',
      boxShadow: 'var(--shadow-md)',
    }}
  >
    <span style={{ fontSize: 13 }}>Hay una versión nueva: arrastra hacia abajo para refrescar.</span>
  </div>
)
