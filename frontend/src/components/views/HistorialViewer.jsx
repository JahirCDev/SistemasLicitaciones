import "../../styles/views/HistorialViewer.css";
import { formatLocalDateTime } from "../../utils/dateUtils";

export default function HistorialViewer({
  historial,
  usuarios = [],
  loading,
  error,
  fieldLabels = {},
  formatValue = (_campo, valor) => valor,
}) {
  const obtenerNombreUsuario = (usuarioId) => {
    const usuario = usuarios.find((u) => Number(u.id) === Number(usuarioId));
    if (!usuario) {
      return usuarioId ? `Usuario #${usuarioId}` : "Sistema";
    }

    const nombreCompleto =
      `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim();
    return nombreCompleto || usuario.email || `Usuario #${usuario.id}`;
  };

  if (loading) {
    return <div className="historial-loading">Cargando historial...</div>;
  }

  if (error) {
    return <div className="historial-error">{error}</div>;
  }

  if (!historial || historial.length === 0) {
    return <div className="historial-empty">No hay cambios registrados</div>;
  }

  return (
    <div className="historial-container">
      <div className="historial-timeline">
        {historial.map((item, index) => (
          <div
            key={item.id}
            className={`historial-item item-tone-${index % 3}`}
          >
            <div className="historial-content">
              <div className="historial-header">
                <div className="historial-main">
                  <span className="historial-dot" aria-hidden="true" />
                  <span className="historial-campo">
                    {fieldLabels[item.campo_modificado] ||
                      item.campo_modificado}
                  </span>
                </div>
                <span className="historial-fecha">
                  {formatLocalDateTime(item.created_at)}
                </span>
              </div>

              <div className="historial-meta">
                <span className="meta-label">Autor:</span>
                <span className="meta-value">
                  {obtenerNombreUsuario(item.usuario_id)}
                </span>
              </div>

              <div className="historial-values">
                <div className="value-change">
                  <span className="old-value">
                    {formatValue(item.campo_modificado, item.valor_anterior) ||
                      "-"}
                  </span>
                </div>
                <div className="value-change">
                  <span className="new-value">
                    {formatValue(item.campo_modificado, item.valor_nuevo)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
