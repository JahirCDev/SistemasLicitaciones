import { useState } from "react";
import { productosService } from "../../services/productosService";
import "../../styles/forms/FormModals.css";

export default function NewProductModal({ isOpen, onClose, onSuccess }) {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePrecioChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
      setPrecio(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await productosService.crear({
        nombre,
        precio: parseFloat(precio),
      });
      resetForm();
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al crear producto");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNombre("");
    setPrecio("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nuevo Producto</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Nombre del Producto</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Consultoría Empresarial"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Precio Unitario</label>
            <input
              type="text"
              value={precio}
              onChange={handlePrecioChange}
              placeholder="0.00"
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
              {loading ? "Creando..." : "Crear Producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
