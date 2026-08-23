/**
 * Mensaje de error de una acción, con la voz del sistema visual: filete de oro
 * y fondo de acento claro, nunca rojo de alarma.
 */
export const Aviso = ({ children }: { children: string }) => (
  <div
    role="alert"
    style={{
      fontSize: 13,
      padding: '10px 12px',
      border: '1px solid var(--color-accent)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--color-accent-100)',
      color: 'var(--color-accent-800)',
    }}
  >
    {children}
  </div>
)

/**
 * El texto de un fallo, sea lo que sea lo que se haya lanzado.
 *
 * Contra memoria casi nada falla, pero el hueco tiene que estar hecho: cuando
 * entre Supabase, la petición puede no llegar a salir y entonces el error lo
 * lanza el navegador, en inglés y con nombre de clase —«TypeError: Failed to
 * fetch»—. Eso no se enseña.
 */
export const textoError = (e: unknown): string => {
  if (!(e instanceof Error)) return 'No se ha podido completar la operación.'
  if (/failed to fetch|networkerror|load failed/i.test(e.message)) {
    return 'Sin conexión con el servidor. Inténtalo otra vez.'
  }
  return e.message
}
