import { useState } from "react";
import { usersService } from "../../services/usersService";
import ConfirmationModal from "../common/ConfirmationModal";
import "../../styles/forms/FormModals.css";

export default function NewUsuarioModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    rol: "usuario",
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (
      !formData.nombre ||
      !formData.email ||
      !formData.password ||
      !formData.apellido
    ) {
      setError("Todos los campos son requeridos");
      return;
    }

    setConfirmModal(true);
  };

  const crearUsuario = async () => {
    setIsSaving(true);
    try {
      await usersService.crear(formData);
      setConfirmModal(false);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al crear usuario");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h4>Nuevo Usuario</h4>
            <button onClick={onClose} className="modal-close">
              ✕
            </button>
          </div>

          <div className="modal-body">
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            <div className="form-group">
              <label>Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ingresa nombre"
              />
            </div>

            <div className="form-group">
              <label>Apellido *</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                placeholder="Ingresa apellido"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Ingresa email"
              />
            </div>

            <div className="form-group">
              <label>Contraseña *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Ingresa contraseña"
              />
            </div>

            <div className="form-group">
              <label>Rol *</label>
              <select name="rol" value={formData.rol} onChange={handleChange}>
                <option value="usuario">Usuario</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button onClick={handleSubmit} className="btn-primary">
              Crear Usuario
            </button>
          </div>
        </div>
      </div>

      {confirmModal && (
        <ConfirmationModal
          isOpen={confirmModal}
          title="Crear usuario"
          message={`¿Crear usuario ${formData.nombre} ${formData.apellido} con rol ${formData.rol}?`}
          onConfirm={crearUsuario}
          onCancel={() => setConfirmModal(false)}
          confirmText={isSaving ? "Creando..." : "Crear"}
          cancelText="Cancelar"
        />
      )}
    </>
  );
}
