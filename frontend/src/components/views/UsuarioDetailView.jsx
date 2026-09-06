import { useState, useEffect } from "react";
import { usersService } from "../../services/index";
import HistorialViewer from "./HistorialViewer";
import ConfirmationModal from "../common/ConfirmationModal";
import LoadingSpinner from "../common/LoadingSpinner";
import { formatLocalDateTime } from "../../utils/dateUtils";
import "../../styles/views/DetailView.css";

export default function UsuarioDetailView({ usuarioId, onClose }) {
  const [usuario, setUsuario] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [confirmModal, setConfirmModal] = useState(null);
  const [setIsSaving] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [resUsuario, resHistorial] = await Promise.all([
          usersService.obtener(usuarioId),
          usersService.obtenerHistorial(usuarioId),
        ]);

        setUsuario(resUsuario.data);
        setHistorial(resHistorial.data || []);
      } catch (err) {
        console.error("Error cargando usuario:", err);
        setError(err.response?.data?.detail || "Error cargando datos");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [usuarioId]);

  const handleEditField = (field) => {
    setEditingField(field);
    setEditValues({ ...editValues, [field]: usuario[field] });
  };

  const handleSaveField = async (field) => {
    const newValue = editValues[field];
    if (newValue === usuario[field]) {
      setEditingField(null);
      return;
    }

    setConfirmModal({
      title: "Confirmar cambio",
      message: `¿Deseas cambiar ${field} de "${usuario[field]}" a "${newValue}"?`,
      onConfirm: async () => {
        await guardarCambio(field, newValue);
        setConfirmModal(null);
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  const guardarCambio = async (field, newValue) => {
    setIsSaving(true);
    try {
      const response = await usersService.actualizar(usuarioId, {
        [field]: newValue,
      });
      setUsuario(response.data);
      setEditingField(null);
      setSuccessMessage(`${field} actualizado correctamente`);
      setTimeout(() => setSuccessMessage(""), 3000);

      try {
        const resHistorial = await usersService.obtenerHistorial(usuarioId);
        setHistorial(resHistorial.data || []);
      } catch {
        setHistorial([]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Cargando usuario..." />;

  if (!usuario) {
    return (
      <div className="detail-error">
        <p>{error || "Usuario no encontrado"}</p>
        <button onClick={onClose} className="btn-back">
          Volver
        </button>
      </div>
    );
  }

  const getRolBadge = (rol) => {
    const badges = {
      admin: "badge-red",
      usuario: "badge-blue",
    };
    return badges[rol] || "badge-gray";
  };

  return (
    <div className="detail-view">
      <div className="detail-header">
        <button onClick={onClose} className="btn-back">
          ← Volver
        </button>
        <h2>Detalle del Usuario #{usuario.id}</h2>
      </div>

      {error && (
        <div className="form-error" role="alert">
          <span className="form-error-icon" aria-hidden="true">
            X
          </span>
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="form-success" role="status">
          <span className="form-success-icon" aria-hidden="true">
            ✓
          </span>
          <span>{successMessage}</span>
        </div>
      )}

      <div className="detail-container">
        {/* INFORMACIÓN PRINCIPAL */}
        <section className="detail-section">
          <h3>Información General (Editable)</h3>
          <div className="detail-fields">
            <div className="detail-field">
              <label>Nombre</label>
              {editingField === "nombre" ? (
                <div className="edit-field">
                  <input
                    type="text"
                    value={editValues.nombre}
                    onChange={(e) =>
                      setEditValues({ ...editValues, nombre: e.target.value })
                    }
                  />
                  <button
                    onClick={() => handleSaveField("nombre")}
                    className="btn-save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    className="btn-cancel"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <span
                  className="editable"
                  onDoubleClick={() => handleEditField("nombre")}
                  title="Doble click para editar"
                >
                  {usuario.nombre}
                </span>
              )}
            </div>

            <div className="detail-field">
              <label>Apellido</label>
              {editingField === "apellido" ? (
                <div className="edit-field">
                  <input
                    type="text"
                    value={editValues.apellido}
                    onChange={(e) =>
                      setEditValues({ ...editValues, apellido: e.target.value })
                    }
                  />
                  <button
                    onClick={() => handleSaveField("apellido")}
                    className="btn-save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    className="btn-cancel"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <span
                  className="editable"
                  onDoubleClick={() => handleEditField("apellido")}
                  title="Doble click para editar"
                >
                  {usuario.apellido}
                </span>
              )}
            </div>

            <div className="detail-field full">
              <label>Email</label>
              <span>{usuario.email}</span>
            </div>

            <div className="detail-field">
              <label>Rol</label>
              {editingField === "rol" ? (
                <div className="edit-field">
                  <select
                    value={editValues.rol}
                    onChange={(e) =>
                      setEditValues({ ...editValues, rol: e.target.value })
                    }
                  >
                    <option value="usuario">Usuario</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => handleSaveField("rol")}
                    className="btn-save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    className="btn-cancel"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <span
                  className="editable"
                  onDoubleClick={() => handleEditField("rol")}
                  title="Doble click para editar"
                >
                  <span className={`badge ${getRolBadge(usuario.rol)}`}>
                    {usuario.rol}
                  </span>
                </span>
              )}
            </div>
          </div>
        </section>

        {/* HISTORIAL */}
        <section className="detail-section">
          <h3>Historial de Cambios y Auditoría</h3>
          <div className="audit-info">
            <div className="audit-field">
              <span className="label">Creado:</span>
              <span className="value">
                {formatLocalDateTime(usuario.created_at)}
              </span>
            </div>
            {usuario.updated_at && (
              <div className="audit-field">
                <span className="label">Última modificación:</span>
                <span className="value">
                  {formatLocalDateTime(usuario.updated_at)}
                </span>
              </div>
            )}
          </div>
          {historial && historial.length > 0 ? (
            <HistorialViewer
              historial={historial}
              usuarios={[usuario]}
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

      {confirmModal && (
        <ConfirmationModal
          isOpen={!!confirmModal}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={confirmModal.onCancel}
          confirmText="Confirmar"
          cancelText="Cancelar"
        />
      )}
    </div>
  );
}
