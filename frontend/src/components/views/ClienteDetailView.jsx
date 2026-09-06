import { useState, useEffect } from "react";
import { clientesService, usersService } from "../../services";
import HistorialViewer from "./HistorialViewer";
import LoadingSpinner from "../common/LoadingSpinner";
import ConfirmationModal from "../common/ConfirmationModal";
import InlineEditCell from "../common/InlineEditCell";
import { formatLocalDateTime } from "../../utils/dateUtils";
import "../../styles/views/DetailView.css";

export default function ClienteDetailView({ clienteId, onClose }) {
  const [cliente, setCliente] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmData, setConfirmData] = useState(null);
  const [saving, setSaving] = useState(false);

  const obtenerNombreUsuario = (usuarioId) => {
    const usuario = usuarios.find((u) => Number(u.id) === Number(usuarioId));

    if (!usuario) {
      return usuarioId ? `Usuario #${usuarioId}` : "Sistema";
    }

    const nombreCompleto =
      `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim();

    return nombreCompleto || usuario.email || `Usuario #${usuario.id}`;
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError("");

        const [resCliente, resUsuarios] = await Promise.all([
          clientesService.obtener(clienteId),
          usersService.listar(),
        ]);

        setCliente(resCliente.data);
        setUsuarios(resUsuarios.data || []);

        try {
          const resHistorial =
            await clientesService.obtenerHistorial(clienteId);

          setHistorial(
            Array.isArray(resHistorial.data) ? resHistorial.data : []
          );
        } catch (errHist) {
          console.error("Error cargando historial:", errHist);
          setHistorial([]);
        }
      } catch (err) {
        console.error("Error cargando cliente:", err);

        setError(err.response?.data?.detail || "Error cargando datos");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [clienteId]);

  /*
   * Se ejecuta cuando el usuario termina la edición
   * mediante Enter o el botón ✓.
   */
  const handleInlineEdit = (campo, nuevoValor) => {
    if (!cliente) return;

    const valorAnterior = cliente[campo];

    if (String(nuevoValor) === String(valorAnterior ?? "")) {
      return;
    }

    setConfirmData({
      entidadId: cliente.id,
      campo,
      valorAnterior: valorAnterior ?? "",
      valorNuevo: nuevoValor,
    });
  };

  const handleConfirmEdit = async () => {
    if (!confirmData || saving) return;

    try {
      setSaving(true);

      await clientesService.actualizar(confirmData.entidadId, {
        [confirmData.campo]: confirmData.valorNuevo,
      });

      /*
       * Actualizamos inmediatamente la información
       * mostrada en pantalla.
       */
      setCliente((prev) => ({
        ...prev,
        [confirmData.campo]: confirmData.valorNuevo,
      }));

      /*
       * Volvemos a cargar el historial para que el nuevo
       * cambio aparezca inmediatamente.
       */
      try {
        const resHistorial = await clientesService.obtenerHistorial(clienteId);

        setHistorial(Array.isArray(resHistorial.data) ? resHistorial.data : []);
      } catch (errHist) {
        console.error("Error actualizando historial:", errHist);
      }

      setConfirmData(null);
    } catch (err) {
      alert("Error al guardar: " + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Cargando cliente..." />;
  }

  if (!cliente) {
    return (
      <div className="detail-error">
        <p>{error || "Cliente no encontrado"}</p>

        <button onClick={onClose} className="btn-back">
          Volver
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="detail-view">
        <div className="detail-header">
          <button onClick={onClose} className="btn-back">
            Volver
          </button>

          <h2>Detalle del Cliente #{cliente.id}</h2>
        </div>

        <div className="detail-container">
          <section className="detail-section">
            <h3>Información General (Editable)</h3>
            <div className="detail-fields">
              <div className="detail-field">
                <label>Nombre</label>

                <InlineEditCell
                  value={cliente.nombre}
                  onSave={(valor) => handleInlineEdit("nombre", valor)}
                  editable={true}
                />
              </div>

              <div className="detail-field">
                <label>Apellido</label>

                <InlineEditCell
                  value={cliente.apellido || ""}
                  onSave={(valor) => handleInlineEdit("apellido", valor)}
                  editable={true}
                />
              </div>

              <div className="detail-field full">
                <label>Email</label>

                <InlineEditCell
                  value={cliente.email}
                  onSave={(valor) => handleInlineEdit("email", valor)}
                  editable={true}
                />
              </div>
            </div>
          </section>

          <section className="detail-section">
            <h3>Historial de Cambios y Auditoría</h3>

            <div className="audit-info">
              <div className="audit-field">
                <span className="label">Creado:</span>

                <span className="value">
                  {formatLocalDateTime(cliente.created_at)}
                </span>
              </div>

              <div className="audit-field">
                <span className="label">Creado por:</span>

                <span className="value">
                  {obtenerNombreUsuario(cliente.created_by)}
                </span>
              </div>

              {cliente.updated_at && (
                <div className="audit-field">
                  <span className="label">Última modificación:</span>

                  <span className="value">
                    {formatLocalDateTime(cliente.updated_at)}
                  </span>
                </div>
              )}

              <div className="audit-field">
                <span className="label">Última modificación por:</span>

                <span className="value">
                  {obtenerNombreUsuario(cliente.updated_by)}
                </span>
              </div>
            </div>

            {historial && historial.length > 0 ? (
              <HistorialViewer
                historial={historial}
                usuarios={usuarios}
                loading={false}
                error=""
              />
            ) : (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#999",
                  fontSize: "13px",
                }}
              >
                No hay cambios registrados
              </div>
            )}
          </section>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!confirmData}
        title="Confirmar cambio"
        message={
          `¿Deseas cambiar ${confirmData?.campo} ` +
          `de "${confirmData?.valorAnterior}" ` +
          `a "${confirmData?.valorNuevo}"?`
        }
        onConfirm={handleConfirmEdit}
        onCancel={() => {
          if (!saving) {
            setConfirmData(null);
          }
        }}
        confirmText={saving ? "Guardando..." : "Guardar cambio"}
        cancelText="Cancelar"
      />
    </>
  );
}
