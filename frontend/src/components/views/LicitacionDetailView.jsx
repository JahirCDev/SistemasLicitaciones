import { useState, useEffect } from "react";
import { licitacionesService } from "../../services/licitacionesService";
import HistorialViewer from "./HistorialViewer";
import LoadingSpinner from "../common/LoadingSpinner";
import "../../styles/views/DetailView.css";

export default function LicitacionDetailView({ licitacionId, onClose }) {
  const [licitacion, setLicitacion] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [resLicitacion, resHistorial] = await Promise.all([
          licitacionesService.obtener(licitacionId),
          licitacionesService.obtenerHistorial(licitacionId),
        ]);
        setLicitacion(resLicitacion.data);
        setHistorial(resHistorial.data);
      } catch (err) {
        console.error("Error cargando licitación:", err);
        setError(err.response?.data?.detail || "Error cargando datos");
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [licitacionId]);

  const descargarDocumento = () => {
    if (licitacion?.documento_url) {
      window.open(licitacion.documento_url, "_blank");
    }
  };

  if (loading) return <LoadingSpinner message="Cargando licitación..." />;

  if (!licitacion) {
    return (
      <div className="detail-error">
        <p>{error || "Licitación no encontrada"}</p>
        <button onClick={onClose} className="btn-back">
          Volver
        </button>
      </div>
    );
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      borrador: "badge-gray",
      activa: "badge-blue",
      finalizada: "badge-green",
      por_cobrar: "badge-yellow",
      cobrada: "badge-success",
      perdida: "badge-red",
    };
    return badges[estado] || "badge-gray";
  };

  return (
    <div className="detail-view">
      <div className="detail-header">
        <button onClick={onClose} className="btn-back">
          Volver
        </button>
        <h2>Detalle de Licitación #{licitacion.id}</h2>
      </div>

      <div className="detail-container">
        {/* INFORMACIÓN PRINCIPAL */}
        <section className="detail-section">
          <h3>Información General</h3>
          <div className="detail-fields">
            <div className="detail-field">
              <label>Cliente ID</label>
              <span>#{licitacion.cliente_id}</span>
            </div>
            <div className="detail-field">
              <label>Estado</label>
              <span className={`badge ${getEstadoBadge(licitacion.estado)}`}>
                {licitacion.estado}
              </span>
            </div>
            <div className="detail-field">
              <label>Presupuesto Máximo</label>
              <span className="price">
                ${licitacion.presupuesto_maximo.toFixed(2)}
              </span>
            </div>
            <div className="detail-field">
              <label>Fecha Límite</label>
              <span>
                {new Date(licitacion.fecha_limite).toLocaleDateString()}
              </span>
            </div>
          </div>
        </section>

        {/* DOCUMENTO ADJUNTO */}
        {licitacion.documento_url && (
          <section className="detail-section">
            <h3>Documento Adjunto</h3>
            <div className="document-box">
              <span>📄 Propuesta comercial</span>
              <button onClick={descargarDocumento} className="btn-download">
                Descargar
              </button>
            </div>
          </section>
        )}

        {/* HISTORIAL DE CAMBIOS CON AUDITORÍA */}
        <section className="detail-section">
          <h3>Historial de Cambios y Auditoría</h3>
          <div className="audit-info">
            <div className="audit-field">
              <span className="label">Creado:</span>
              <span className="value">
                {new Date(licitacion.created_at).toLocaleDateString()}{" "}
                {new Date(licitacion.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {licitacion.updated_at && (
              <div className="audit-field">
                <span className="label">Última modificación:</span>
                <span className="value">
                  {new Date(licitacion.updated_at).toLocaleDateString()}{" "}
                  {new Date(licitacion.updated_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </div>
          <HistorialViewer
            historial={historial}
            loading={false}
            error={error}
          />
        </section>
      </div>
    </div>
  );
}
