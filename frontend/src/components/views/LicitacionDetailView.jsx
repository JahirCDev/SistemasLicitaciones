import { useState, useEffect, useRef } from "react";
import {
  licitacionesService,
  productosService,
  clientesService,
  usersService,
} from "../../services/index";
import HistorialViewer from "./HistorialViewer";
import ConfirmationModal from "../common/ConfirmationModal";
import LoadingSpinner from "../common/LoadingSpinner";
import { formatLocalDateTime } from "../../utils/dateUtils";
import "../../styles/views/DetailView.css";
import "../../styles/forms/FormModals.css";

export default function LicitacionDetailView({ licitacionId, onClose }) {
  const [licitacion, setLicitacion] = useState(null);
  const [productos, setProductos] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [confirmModal, setConfirmModal] = useState(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [productQuantity, setProductQuantity] = useState(1);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingProductQuantity, setEditingProductQuantity] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const documentInputRef = useRef(null);

  // Helper: Obtener nombre del usuario
  const obtenerNombreUsuario = (usuarioId) => {
    const usuario = usuarios.find((u) => Number(u.id) === Number(usuarioId));
    if (!usuario) {
      return usuarioId ? `Usuario #${usuarioId}` : "Sistema";
    }
    const nombreCompleto =
      `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim();
    return nombreCompleto || usuario.email || `Usuario #${usuario.id}`;
  };

  // Helper: Obtener nombre del cliente
  const obtenerNombreCliente = (clienteId) => {
    const cliente = clientes.find((c) => Number(c.id) === Number(clienteId));
    if (!cliente) return `Cliente #${clienteId}`;
    return `${cliente.nombre} ${cliente.apellido}`.trim();
  };

  // Helper: Obtener nombre del producto
  const obtenerNombreProducto = (productoId) => {
    const producto = productosDisponibles.find(
      (p) => Number(p.id) === Number(productoId)
    );
    if (!producto) return `Producto #${productoId}`;
    return producto.nombre;
  };

  const formatearFechaParaInput = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [
          resLicitacion,
          resHistorial,
          resProductos,
          resClientes,
          resUsuarios,
        ] = await Promise.all([
          licitacionesService.obtener(licitacionId),
          licitacionesService.obtenerHistorial(licitacionId),
          productosService.listar(),
          clientesService.listar(),
          usersService.listar(),
        ]);

        setLicitacion(resLicitacion.data);
        setHistorial(resHistorial.data);
        setProductosDisponibles(resProductos.data);
        setClientes(resClientes.data);
        setUsuarios(resUsuarios.data);

        try {
          const resProds =
            await licitacionesService.obtenerDetalle(licitacionId);
          setProductos(resProds.data.productos || []);
        } catch {
          setProductos([]);
        }
      } catch (err) {
        console.error("Error cargando licitación:", err);
        setError(err.response?.data?.detail || "Error cargando datos");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [licitacionId]);

  const handleEditField = (field) => {
    setEditingField(field);
    setEditValues({
      ...editValues,
      [field]:
        field === "fecha_limite"
          ? formatearFechaParaInput(licitacion[field])
          : licitacion[field],
    });
  };

  const handleSaveField = async (field) => {
    const newValue = editValues[field];
    if (newValue === licitacion[field]) {
      setEditingField(null);
      return;
    }

    const displayValue =
      field === "cliente_id" ? obtenerNombreCliente(newValue) : newValue;
    const displayOld =
      field === "cliente_id"
        ? obtenerNombreCliente(licitacion[field])
        : licitacion[field];

    setConfirmModal({
      title: "Confirmar cambio",
      message: `¿Deseas cambiar ${field} de "${displayOld}" a "${displayValue}"?`,
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
      const valorNormalizado =
        field === "presupuesto_maximo"
          ? parseFloat(newValue)
          : field === "cliente_id"
            ? parseInt(newValue, 10)
            : newValue;
      const response = await licitacionesService.actualizar(licitacionId, {
        [field]: valorNormalizado,
      });
      setLicitacion(response.data);
      setEditingField(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const recargarDatos = async () => {
    try {
      const [resLicitacion, resHistorial, resProds] = await Promise.all([
        licitacionesService.obtener(licitacionId),
        licitacionesService.obtenerHistorial(licitacionId),
        licitacionesService.obtenerDetalle(licitacionId),
      ]);
      setLicitacion(resLicitacion.data);
      setHistorial(resHistorial.data);
      setProductos(resProds.data.productos || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Error recargando datos");
    }
  };

  const handleAgregarProducto = async () => {
    if (!selectedProduct || cantidadSeleccionada < 1 || excedePresupuesto)
      return;

    setIsSaving(true);
    try {
      await licitacionesService.agregarProducto(
        licitacionId,
        parseInt(selectedProduct),
        cantidadSeleccionada
      );
      await recargarDatos();
      setShowAddProductModal(false);
      setSelectedProduct("");
      setProductQuantity(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al agregar producto");
    } finally {
      setIsSaving(false);
    }
  };

  const iniciarEdicionCantidad = (producto) => {
    setEditingProductId(producto.producto_id);
    setEditingProductQuantity(producto.cantidad);
  };

  const cancelarEdicionCantidad = () => {
    setEditingProductId(null);
    setEditingProductQuantity(1);
  };

  const guardarCantidad = async (producto) => {
    const cantidad = parseInt(editingProductQuantity, 10);
    if (!cantidad || cantidad < 1) return;

    const totalSinProducto =
      totalProductos - producto.cantidad * producto.precio;
    const totalNuevo = totalSinProducto + cantidad * producto.precio;
    if (totalNuevo > licitacion.presupuesto_maximo) {
      setError(
        `El total de productos ($${totalNuevo.toFixed(2)}) no puede exceder ` +
          `el presupuesto máximo ($${licitacion.presupuesto_maximo.toFixed(2)}).`
      );
      return;
    }

    setIsSaving(true);
    try {
      await licitacionesService.actualizarCantidadProducto(
        licitacionId,
        producto.producto_id,
        cantidad
      );
      await recargarDatos();
      cancelarEdicionCantidad();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al actualizar cantidad");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuitarProducto = (productoId) => {
    setConfirmModal({
      title: "Quitar producto",
      message: "¿Deseas quitar este producto de la licitación?",
      onConfirm: async () => {
        await quitarProducto(productoId);
        setConfirmModal(null);
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  const quitarProducto = async (productoId) => {
    setIsSaving(true);
    try {
      await licitacionesService.removerProducto(licitacionId, productoId);
      await recargarDatos();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al quitar producto");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubirDocumento = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingDocument(true);
    try {
      await licitacionesService.subirDocumento(licitacionId, file);
      await recargarDatos();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al subir documento");
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const reenviarCorreo = async () => {
    setIsSaving(true);
    try {
      await licitacionesService.reenviarCorreo(licitacionId);
      setError("");
      setSuccessMessage("Correo reenviado correctamente al cliente.");
    } catch (err) {
      setSuccessMessage("");
      setError(err.response?.data?.detail || "Error al reenviar el correo");
    } finally {
      setIsSaving(false);
    }
  };

  const descargarDocumento = () => {
    if (licitacion?.documento_url) {
      window.open(licitacion.documento_url, "_blank");
    }
  };

  const obtenerNombreDocumento = (url) => {
    try {
      const nombre = new URL(url).pathname.split("/").pop();
      return decodeURIComponent(nombre) || "Documento";
    } catch {
      return "Documento";
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

  const isEditable = ["borrador", "activa"].includes(licitacion.estado);
  const isDraftEditable = licitacion.estado === "borrador";
  const isProductEditable = ["borrador", "activa"].includes(licitacion.estado);
  const totalProductos = productos.reduce(
    (sum, p) => sum + p.cantidad * p.precio,
    0
  );
  const productoSeleccionado = productosDisponibles.find(
    (producto) => Number(producto.id) === Number(selectedProduct)
  );
  const cantidadSeleccionada = parseInt(productQuantity, 10) || 0;
  const subtotalSeleccionado = productoSeleccionado
    ? productoSeleccionado.precio * cantidadSeleccionada
    : 0;
  const totalConProducto = totalProductos + subtotalSeleccionado;
  const excedePresupuesto =
    productoSeleccionado &&
    cantidadSeleccionada > 0 &&
    totalConProducto > licitacion.presupuesto_maximo;
  const totalConCantidadEditada = (producto) =>
    totalProductos -
    producto.cantidad * producto.precio +
    (parseInt(editingProductQuantity, 10) || 0) * producto.precio;
  const excedePresupuestoCantidad = (producto) =>
    editingProductId === producto.producto_id &&
    totalConCantidadEditada(producto) > licitacion.presupuesto_maximo;
  const productosDisponiblesParaAgregar = productosDisponibles.filter(
    (producto) =>
      !productos.some(
        (productoAgregado) =>
          Number(productoAgregado.producto_id) === Number(producto.id)
      )
  );

  return (
    <div className="detail-view">
      <div className="detail-header">
        <button onClick={onClose} className="btn-back">
          Volver
        </button>
        <h2>Detalle de Licitación #{licitacion.id}</h2>
        {licitacion.estado === "activa" && licitacion.documento_url && (
          <div className="detail-header-actions">
            <button
              onClick={() =>
                setConfirmModal({
                  title: "Reenviar correo",
                  message: "¿Deseas reenviar la licitación al cliente?",
                  onConfirm: async () => {
                    await reenviarCorreo();
                    setConfirmModal(null);
                  },
                  onCancel: () => setConfirmModal(null),
                })
              }
              className="btn-email"
              disabled={isSaving}
            >
              Reenviar correo
            </button>
            <button type="button" className="btn-status-decorative" disabled>
              Marcar Finalizada
            </button>
            <button type="button" className="btn-status-decorative" disabled>
              Marcar Perdida
            </button>
          </div>
        )}
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
          <h3>Información General {isEditable && "(Editable)"}</h3>
          <div className="detail-fields">
            <div className="detail-field">
              <label>Cliente</label>
              {editingField === "cliente_id" && isEditable ? (
                <div className="edit-field">
                  <select
                    value={editValues.cliente_id}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        cliente_id: parseInt(e.target.value),
                      })
                    }
                  >
                    <option value="">Selecciona cliente</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.apellido}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleSaveField("cliente_id")}
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
                  className={isEditable ? "editable" : ""}
                  onDoubleClick={() =>
                    isEditable && handleEditField("cliente_id")
                  }
                  title={isEditable ? "Doble click para editar" : ""}
                >
                  {obtenerNombreCliente(licitacion.cliente_id)}
                </span>
              )}
            </div>

            <div className="detail-field">
              <label>Estado</label>
              <span className={`badge ${getEstadoBadge(licitacion.estado)}`}>
                {licitacion.estado}
              </span>
            </div>

            <div className="detail-field">
              <label>Presupuesto Máximo</label>
              {editingField === "presupuesto_maximo" && isEditable ? (
                <div className="edit-field">
                  <input
                    type="number"
                    step="0.01"
                    value={editValues.presupuesto_maximo}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        presupuesto_maximo: e.target.value,
                      })
                    }
                  />
                  <button
                    onClick={() => handleSaveField("presupuesto_maximo")}
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
                  className={`price ${isEditable ? "editable" : ""}`}
                  onDoubleClick={() =>
                    isEditable && handleEditField("presupuesto_maximo")
                  }
                  title={isEditable ? "Doble click para editar" : ""}
                >
                  ${licitacion.presupuesto_maximo.toFixed(2)}
                </span>
              )}
            </div>

            <div className="detail-field">
              <label>Fecha Límite</label>
              {editingField === "fecha_limite" && isEditable ? (
                <div className="edit-field">
                  <input
                    type="datetime-local"
                    value={editValues.fecha_limite}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        fecha_limite: e.target.value,
                      })
                    }
                  />
                  <button
                    onClick={() => handleSaveField("fecha_limite")}
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
                  className={isEditable ? "editable" : ""}
                  onDoubleClick={() =>
                    isEditable && handleEditField("fecha_limite")
                  }
                  title={isEditable ? "Doble click para editar" : ""}
                >
                  {new Date(licitacion.fecha_limite).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* PRODUCTOS - CON ESTILO DATA-VIEW-CONTAINER */}
        <section className="detail-section products-section">
          <div className="products-header">
            <div className="products-title">
              <h3>Productos</h3>
              <p>
                {productos.length} producto(s) - Total: $
                {totalProductos.toFixed(2)}
              </p>
            </div>
            {isProductEditable && (
              <button
                onClick={() => setShowAddProductModal(true)}
                className="btn-add-product"
              >
                + Agregar Producto
              </button>
            )}
          </div>

          {productos.length === 0 ? (
            <div className="products-empty">
              <p>No hay productos agregados</p>
            </div>
          ) : (
            <div className="products-table">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Subtotal</th>
                    {isProductEditable && <th>Acción</th>}
                  </tr>
                </thead>
                <tbody>
                  {productos.map((prod) => (
                    <tr key={prod.producto_id}>
                      <td className="product-name">
                        {obtenerNombreProducto(prod.producto_id)}
                      </td>
                      <td className="qty-cell">
                        {editingProductId === prod.producto_id ? (
                          <div className="quantity-edit">
                            <input
                              type="number"
                              min="1"
                              value={editingProductQuantity}
                              onChange={(e) =>
                                setEditingProductQuantity(e.target.value)
                              }
                              disabled={isSaving}
                            />
                            <button
                              type="button"
                              className="btn-save btn-icon"
                              onClick={() => guardarCantidad(prod)}
                              disabled={
                                isSaving || excedePresupuestoCantidad(prod)
                              }
                              title="Guardar cantidad"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              className="btn-cancel btn-icon"
                              onClick={cancelarEdicionCantidad}
                              disabled={isSaving}
                              title="Cancelar edición"
                            >
                              ✕
                            </button>
                            {excedePresupuestoCantidad(prod) && (
                              <span className="quantity-budget-warning">
                                Excede el presupuesto
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={
                              isProductEditable
                                ? "quantity-value editable"
                                : "quantity-value"
                            }
                            onClick={() =>
                              isProductEditable && iniciarEdicionCantidad(prod)
                            }
                            disabled={!isProductEditable}
                            title={isProductEditable ? "Editar cantidad" : ""}
                          >
                            {prod.cantidad}
                          </button>
                        )}
                      </td>
                      <td className="price-cell">${prod.precio.toFixed(2)}</td>
                      <td className="price-cell">
                        ${(prod.cantidad * prod.precio).toFixed(2)}
                      </td>
                      {isProductEditable && (
                        <td className="action-cell">
                          <button
                            onClick={() =>
                              handleQuitarProducto(prod.producto_id)
                            }
                            className="btn-remove-small"
                          >
                            Quitar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr className="totals-row">
                    <td
                      colSpan={isProductEditable ? "4" : "3"}
                      className="totals-label"
                    >
                      Total:
                    </td>
                    <td className="totals-value">
                      ${totalProductos.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Modal para agregar producto */}
          {showAddProductModal && (
            <div
              className="modal-overlay"
              onClick={() => setShowAddProductModal(false)}
            >
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h4>Agregar Producto</h4>
                  <button
                    onClick={() => setShowAddProductModal(false)}
                    className="modal-close"
                  >
                    ✕
                  </button>
                </div>

                <div className="modal-body">
                  <div className="form-group">
                    <label>Producto</label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                    >
                      <option value="">Selecciona un producto</option>
                      {productosDisponiblesParaAgregar.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} - ${p.precio.toFixed(2)}
                        </option>
                      ))}
                    </select>
                    {productosDisponiblesParaAgregar.length === 0 && (
                      <span className="product-budget-message available">
                        Todos los productos disponibles ya fueron agregados.
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={productQuantity}
                      onChange={(e) => setProductQuantity(e.target.value)}
                    />
                  </div>

                  {productoSeleccionado && cantidadSeleccionada > 0 && (
                    <div
                      className={`product-budget-message ${
                        excedePresupuesto ? "exceeds" : "available"
                      }`}
                    >
                      {excedePresupuesto
                        ? `El total de productos sería $${totalConProducto.toFixed(
                            2
                          )} y excede el presupuesto máximo de $${licitacion.presupuesto_maximo.toFixed(
                            2
                          )}.`
                        : `Disponible: $${(
                            licitacion.presupuesto_maximo - totalConProducto
                          ).toFixed(2)} del presupuesto.`}
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button
                    onClick={() => setShowAddProductModal(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAgregarProducto}
                    className="btn-primary"
                    disabled={!selectedProduct || isSaving || excedePresupuesto}
                  >
                    {isSaving ? "Agregando..." : "Agregar"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* DOCUMENTO */}
        <section className="detail-section document-section">
          <h3>Documento de Propuesta</h3>
          {licitacion.documento_url ? (
            <div className="document-box document-attached">
              <div className="document-info">
                <div className="document-icon" aria-hidden="true">
                  PDF
                </div>
                <div className="document-copy">
                  <strong>
                    {obtenerNombreDocumento(licitacion.documento_url)}
                  </strong>
                  <span>Propuesta comercial</span>
                </div>
              </div>
              <div className="document-actions">
                <button onClick={descargarDocumento} className="btn-download">
                  Descargar documento
                </button>
                {(isEditable || licitacion.estado === "activa") && (
                  <button
                    onClick={() =>
                      setConfirmModal({
                        title: "Quitar documento",
                        message: "¿Deseas eliminar el documento actual?",
                        onConfirm: async () => {
                          await licitacionesService.eliminarDocumento(
                            licitacionId
                          );
                          await recargarDatos();
                          setConfirmModal(null);
                        },
                        onCancel: () => setConfirmModal(null),
                      })
                    }
                    className="btn-remove"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="document-empty">
              <div
                className="document-empty-icon"
                role="button"
                tabIndex={0}
                onClick={() => documentInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    documentInputRef.current?.click();
                  }
                }}
                title="Adjuntar documento"
                aria-label="Adjuntar documento"
              >
                +
              </div>
              <div>
                <strong>No hay documento adjunto</strong>
                <p>
                  Añade la propuesta comercial para completar la licitación.
                </p>
              </div>
            </div>
          )}

          {isDraftEditable && !licitacion.documento_url && (
            <input
              ref={documentInputRef}
              className="document-file-input"
              type="file"
              onChange={handleSubirDocumento}
              accept=".pdf,.doc,.docx"
              disabled={isUploadingDocument}
            />
          )}
        </section>

        {/* HISTORIAL */}
        <section className="detail-section">
          <h3>Historial de Cambios y Auditoría</h3>
          <div className="audit-info">
            <div className="audit-field">
              <span className="label">Creado:</span>
              <span className="value">
                {formatLocalDateTime(licitacion.created_at)}
              </span>
            </div>
            <div className="audit-field">
              <span className="label">Creado por:</span>
              <span className="value">
                {obtenerNombreUsuario(licitacion.created_by)}
              </span>
            </div>
            {licitacion.updated_at && (
              <>
                <div className="audit-field">
                  <span className="label">Última modificación:</span>
                  <span className="value">
                    {formatLocalDateTime(licitacion.updated_at)}
                  </span>
                </div>
                <div className="audit-field">
                  <span className="label">Última modificación por:</span>
                  <span className="value">
                    {obtenerNombreUsuario(licitacion.updated_by)}
                  </span>
                </div>
              </>
            )}
          </div>
          {historial && historial.length > 0 ? (
            <HistorialViewer
              historial={historial}
              usuarios={usuarios}
              fieldLabels={{
                cliente_id: "Cliente",
                presupuesto_maximo: "Presupuesto máximo",
                fecha_limite: "Fecha límite",
              }}
              formatValue={(campo, valor) =>
                campo === "cliente_id" && valor
                  ? obtenerNombreCliente(valor)
                  : valor
              }
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

      {/* Confirmation Modal */}
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
