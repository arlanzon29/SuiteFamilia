/**
 * La caja de diálogo/hoja de la aplicación: fondo oscurecido + tarjeta con
 * título, texto opcional y contenido libre. La usa `DialogoApp` para sus
 * formularios y confirmaciones, y `Cabecera` para el menú de acciones de la
 * lista — mismo componente, para que una hoja se vea igual venga de donde
 * venga.
 */
export const Caja = ({
  titulo,
  texto,
  cerrar,
  children,
}: {
  titulo: string
  texto?: string | null
  cerrar: () => void
  children: React.ReactNode
}) => (
  <div
    className="dialog-backdrop"
    role="presentation"
    onClick={(e) => {
      if (e.target === e.currentTarget) cerrar()
    }}
  >
    <div className="dialog" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="dialog-title">{titulo}</div>
      {texto && <div className="dialog-body">{texto}</div>}
      {children}
    </div>
  </div>
)
