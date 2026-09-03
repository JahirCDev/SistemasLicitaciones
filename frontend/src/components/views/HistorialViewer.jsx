import "../../styles/views/HistorialViewer.css";

export default function HistorialViewer({
  historial,
  usuarios = [],
  loading,
  error,
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
                    {item.campo_modificado}
                  </span>
                </div>
                <span className="historial-fecha">
                  {new Date(item.created_at).toLocaleDateString()}{" "}
                  {new Date(item.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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
                    {item.valor_anterior || "-"}
                  </span>
                </div>
                <div className="value-change">
                  <span className="new-value">{item.valor_nuevo}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
