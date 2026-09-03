import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { clientesService, productosService, licitacionesService} from "../../services";
import apiClient from "../../api/client";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/pages/NewLicitacionPage.css";

export default function NewBiddingPage({ onSuccess }) {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    cliente_id: "",
    presupuesto_maximo: "",
    fecha_limite: null,
  });

  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [documentoFile, setDocumentoFile] = useState(null);
  const [productoSearch, setProductoSearch] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resClientes, resProductos] = await Promise.all([
          clientesService.listar(),
          productosService.listar(),
        ]);
        setClientes(resClientes.data);
        setProductos(resProductos.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Error cargando datos");
      }
    };
    cargarDatos();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFechaLimiteChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      fecha_limite: date,
    }));
  };

  const productosFiltrados = productos.filter((prod) =>
    prod.nombre.toLowerCase().includes(productoSearch.toLowerCase())
  );

  const agregarProducto = (productoId) => {
    const producto = productos.find((p) => p.id === parseInt(productoId));
    if (producto && !productosSeleccionados.find((p) => p.id === producto.id)) {
      setProductosSeleccionados((prev) => [
        ...prev,
        { ...producto, cantidad: 1 },
      ]);
    }
    setProductoSearch("");
  };

  const actualizarCantidad = (index, cantidad) => {
    const nuevos = [...productosSeleccionados];
    nuevos[index].cantidad = Math.max(1, parseInt(cantidad) || 1);
    setProductosSeleccionados(nuevos);
  };

  const removerProducto = (index) => {
    setProductosSeleccionados((prev) => prev.filter((_, i) => i !== index));
  };

  const calcularTotal = () =>
    productosSeleccionados.reduce((sum, p) => sum + p.precio * p.cantidad, 0);

  const excedePrespuesto = () =>
    calcularTotal() > parseFloat(formData.presupuesto_maximo || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.cliente_id ||
      !formData.presupuesto_maximo ||
      !formData.fecha_limite
    ) {
      setError("Completa todos los campos obligatorios");
      return;
    }

    if (productosSeleccionados.length === 0) {
      setError("Debes seleccionar al menos un producto");
      return;
    }

    if (excedePrespuesto()) {
      setError("El total de los productos excede el presupuesto máximo");
      return;
    }

    setLoading(true);

    try {
      const response = await licitacionesService.crear({
        cliente_id: parseInt(formData.cliente_id),
        presupuesto_maximo: parseFloat(formData.presupuesto_maximo),
        fecha_limite: formData.fecha_limite.toISOString(),
      });

      const licitacionId = response.data.id;

      for (const prod of productosSeleccionados) {
        await apiClient.post(
          `/licitaciones/${licitacionId}/productos/${prod.id}?cantidad=${prod.cantidad}`
        );
      }

      if (documentoFile) {
        await licitacionesService.subirDocumento(licitacionId, documentoFile);
      }

      await licitacionesService.enviar(licitacionId);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al crear la licitación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-bidding-page">
      <div className="page-header">
        <h2>Nueva Licitación</h2>
      </div>

      <form onSubmit={handleSubmit} className="form-section">
        <div className="form-grid">
          <div className="form-group full-width">
            <label>Cliente</label>
            <select
              name="cliente_id"
              value={formData.cliente_id}
              onChange={handleInputChange}
              required
            >
              <option value="">Selecciona un cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.apellido}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Presupuesto Máximo</label>
            <input
              type="text"
              name="presupuesto_maximo"
              value={formData.presupuesto_maximo}
              onChange={handleInputChange}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group">
            <label>Fecha Límite</label>
            <DatePicker
              selected={formData.fecha_limite}
              onChange={handleFechaLimiteChange}
              showTimeSelect
              timeIntervals={15}
              dateFormat="dd/MM/yyyy HH:mm"
              placeholderText="Selecciona fecha y hora"
              minDate={new Date()}
              required
              className="date-picker-input"
            />
          </div>
        </div>

        <div className="section-header" style={{ marginTop: "40px" }}>
          <h3>Productos</h3>
          <p>Agrega los productos que formarán parte de la licitación</p>
        </div>

        <div className="products-section">
          <div className="product-search-container">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={productoSearch}
              onChange={(e) => setProductoSearch(e.target.value)}
              className="product-search"
            />
            {productoSearch && (
              <div className="products-dropdown">
                {productosFiltrados.length === 0 ? (
                  <div className="no-results">No hay productos</div>
                ) : (
                  productosFiltrados.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      className="product-option"
                      onClick={() => agregarProducto(prod.id)}
                    >
                      <span>{prod.nombre}</span>
                      <span className="price">${prod.precio.toFixed(2)}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {productosSeleccionados.length > 0 && (
            <div className="selected-products-container">
              <h4>Productos Seleccionados</h4>
              {productosSeleccionados.map((prod, idx) => (
                <div key={idx} className="selected-product-row">
                  <div className="product-info">
                    <span className="product-name">{prod.nombre}</span>
                    <div className="quantity-input">
                      <label>Cantidad:</label>
                      <input
                        type="number"
                        min="1"
                        value={prod.cantidad}
                        onChange={(e) =>
                          actualizarCantidad(idx, e.target.value)
                        }
                      />
                    </div>
                    <span className="product-price">
                      ${(prod.precio * prod.cantidad).toFixed(2)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removerProducto(idx)}
                  >
                    Remover
                  </button>
                </div>
              ))}

              <div className="totals-box">
                <div className="total-row">
                  <span>Total Productos:</span>
                  <span className={excedePrespuesto() ? "error" : ""}>
                    ${calcularTotal().toFixed(2)}
                  </span>
                </div>
                <div className="total-row">
                  <span>Presupuesto:</span>
                  <span>
                    ${(parseFloat(formData.presupuesto_maximo) || 0).toFixed(2)}
                  </span>
                </div>
                {excedePrespuesto() && (
                  <div className="error-message">
                    El total excede el presupuesto máximo
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="section-header" style={{ marginTop: "40px" }}>
          <h3>Documento de Propuesta</h3>
        </div>

        <div className="file-upload-container">
          <div className="file-upload">
            <input
              type="file"
              id="documento"
              onChange={(e) => setDocumentoFile(e.target.files[0])}
              accept=".pdf,.doc,.docx,.xls,.xlsx"
            />
            <label htmlFor="documento">
              <div className="upload-icon">📄</div>
              <div className="upload-text">
                {documentoFile ? (
                  <>
                    <strong>Archivo seleccionado:</strong>
                    <p>{documentoFile.name}</p>
                  </>
                ) : (
                  <>
                    <strong>Haz clic para seleccionar un archivo</strong>
                    <p>o arrastra el archivo aquí</p>
                  </>
                )}
              </div>
            </label>
          </div>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={
              loading ||
              !formData.cliente_id ||
              !formData.presupuesto_maximo ||
              !formData.fecha_limite ||
              productosSeleccionados.length === 0 ||
              excedePrespuesto()
            }
          >
            {loading ? "Enviando licitación..." : "Guardar y enviar licitación"}
          </button>
        </div>
      </form>
    </div>
  );
}
