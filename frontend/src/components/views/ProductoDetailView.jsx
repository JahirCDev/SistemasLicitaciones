import { useState, useEffect } from "react";
import { productosService, usersService } from "../../services";
import HistorialViewer from "./HistorialViewer";
import LoadingSpinner from "../common/LoadingSpinner";
import ConfirmationModal from "../common/ConfirmationModal";
import InlineEditCell from "../common/InlineEditCell";
import { formatLocalDateTime } from "../../utils/dateUtils";
import "../../styles/views/DetailView.css";

export default function ProductoDetailView({ productoId, onClose }) {
  const [producto, setProducto] = useState(null);
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

        const [resProducto, resUsuarios] = await Promise.all([
          productosService.obtener(productoId),
          usersService.listar(),
        ]);

        setProducto(resProducto.data);
        setUsuarios(resUsuarios.data || []);

        try {
          const resHistorial =
            await productosService.obtenerHistorial(productoId);
          setHistorial(resHistorial.data || []);
        } catch (errHist) {
          console.error("Error cargando historial:", errHist);
          setHistorial([]);
        }
      } catch (err) {
        console.error("Error cargando producto:", err);
        setError(err.response?.data?.detail || "Error cargando datos");
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [productoId]);

  const handleInlineEdit = (campo, nuevoValor) => {
    if (!producto) return;

    const valorAnterior = producto[campo];

    if (String(nuevoValor) === String(valorAnterior ?? "")) {
      return;
    }

    setConfirmData({
      entidadId: producto.id,
      campo,
      valorAnterior: valorAnterior ?? "",
      valorNuevo: nuevoValor,
    });
  };

  const handleConfirmEdit = async () => {
    if (!confirmData || saving) return;

    try {
      setSaving(true);

      const valor =
        confirmData.campo === "precio"
          ? parseFloat(confirmData.valorNuevo)
          : confirmData.valorNuevo;

      await productosService.actualizar(confirmData.entidadId, {
        [confirmData.campo]: valor,
      });

      setProducto((prev) => ({
        ...prev,
        [confirmData.campo]: valor,
      }));

      try {
        const resHistorial =
          await productosService.obtenerHistorial(productoId);

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

  if (loading) return <LoadingSpinner message="Cargando producto..." />;

  if (!producto) {
    return (
      <div className="detail-error">
        <p>{error || "Producto no encontrado"}</p>
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
          <h2>Detalle del Producto #{producto.id}</h2>
        </div>

        <div className="detail-container">
          {/* INFORMACIÓN PRINCIPAL */}
          <section className="detail-section">
            <h3>Información General (Editable)</h3>
            <div className="detail-fields">
              <div className="detail-field">
                <label>Nombre</label>
                <InlineEditCell
                  value={producto.nombre}
                  onSave={(valor) => handleInlineEdit("nombre", valor)}
                  editable={true}
                />
              </div>
              <div className="detail-field">
                <label>Precio</label>
                <InlineEditCell
                  value={producto.precio}
                  onSave={(valor) => handleInlineEdit("precio", valor)}
                  type="price"
                  editable={true}
                />
              </div>
            </div>
          </section>

          {/* HISTORIAL DE CAMBIOS CON AUDITORÍA */}
          <section className="detail-section">
            <h3>Historial de Cambios y Auditoría</h3>
            <div className="audit-info">
              <div className="audit-field">
                <span className="label">Creado:</span>
                <span className="value">
                  {formatLocalDateTime(producto.created_at)}
                </span>
              </div>
              <div className="audit-field">
                <span className="label">Creado por:</span>
                <span className="value">
                  {obtenerNombreUsuario(producto.created_by)}
                </span>
              </div>
              {producto.updated_at && (
                <div className="audit-field">
                  <span className="label">Última modificación:</span>
                  <span className="value">
                    {formatLocalDateTime(producto.updated_at)}
                  </span>
                </div>
              )}
              <div className="audit-field">
                <span className="label">Última modificación por:</span>
                <span className="value">
                  {obtenerNombreUsuario(producto.updated_by)}
                </span>
              </div>
            </div>
            <HistorialViewer
              historial={historial}
              usuarios={usuarios}
              loading={false}
              error={error}
            />
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
