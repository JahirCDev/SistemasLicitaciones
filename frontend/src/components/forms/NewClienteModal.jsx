import { useState } from "react";
import { clientesService } from "../../services/clientesService";
import "../../styles/forms/FormModals.css";

export default function NewClientModal({ isOpen, onClose, onSuccess }) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await clientesService.crear({ nombre, apellido, email });
      resetForm();
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al crear cliente");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNombre("");
    setApellido("");
    setEmail("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nuevo Cliente</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Juan"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Apellido</label>
            <input
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              placeholder="Pérez"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Email Corporativo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@empresa.com"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-alert">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creando..." : "Crear Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
