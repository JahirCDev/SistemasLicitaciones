import { useLicitaciones } from "../../hooks/useLicitaciones";
import LoadingSpinner from "../common/LoadingSpinner";
import "../../styles/views/LicitacionesExpiringSoon.css";

export default function BiddingsExpiringSoon({ refreshTrigger }) {
  const {
    licitaciones: todasLicitaciones,
    loading,
    error,
  } = useLicitaciones(refreshTrigger);

  const licitaciones = todasLicitaciones
    .filter((lic) => {
      if (lic.estado !== "activa") return false;
      const ahora = new Date();
      const proximasDias = new Date(ahora.getTime() + 48 * 60 * 60 * 1000);
      const fechaLimite = new Date(lic.fecha_limite);
      return fechaLimite > ahora && fechaLimite <= proximasDias;
    })
    .sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite));

  const diasRestantes = (fechaLimite) => {
    const ahora = new Date();
    const fecha = new Date(fechaLimite);
    const diferencia = fecha - ahora;
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(horas / 24);
    const horasRestantes = horas % 24;

    if (dias > 0) return `${dias}d ${horasRestantes}h`;
    return `${horasRestantes}h`;
  };

  if (loading)
    return (
      <LoadingSpinner message="Cargando licitaciones próximas a vencer..." />
    );

  return (
    <div className="expiring-section">
      <div className="expiring-header">
        <h2>Licitaciones Próximas a Vencer</h2>
        <span className="expiring-badge">{licitaciones.length}</span>
      </div>

      {error && <div className="expiring-error">{error}</div>}

      {licitaciones.length === 0 ? (
        <div className="expiring-empty">
          <p>No hay licitaciones próximas a vencer en los próximos 2 días</p>
        </div>
      ) : (
        <div className="expiring-grid">
          {licitaciones.map((lic) => (
            <div key={lic.id} className="expiring-card">
              <div className="card-header">
                <h3>Licitación #{lic.id}</h3>
                <span className="urgency-badge">Urgente</span>
              </div>

              <div className="card-content">
                <div className="info-row">
                  <span className="label">Cliente:</span>
                  <span className="value">ID {lic.cliente_id}</span>
                </div>

                <div className="info-row">
                  <span className="label">Presupuesto:</span>
                  <span className="value">
                    ${lic.presupuesto_maximo.toFixed(2)}
                  </span>
                </div>

                <div className="info-row">
                  <span className="label">Vence en:</span>
                  <span className="value urgency">
                    {diasRestantes(lic.fecha_limite)}
                  </span>
                </div>

                <div className="progress-bar">
                  <div className="progress-fill urgency-high"></div>
                </div>
              </div>

              <div className="card-footer">
                <button className="action-btn">Ver Detalles</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
