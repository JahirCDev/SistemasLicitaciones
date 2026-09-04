import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProductos } from "../../hooks/useProductos";
import NewProductModal from "../forms/NewProductoModal";
import DataViewContainer from "../common/DataViewContainer";
import LoadingSpinner from "../common/LoadingSpinner";
import "../../styles/views/ProductosView.css";
import { formatLocalDate } from "../../utils/dateUtils";

export default function ProductosView() {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const { productos, loading, error } = useProductos(refreshTrigger);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const productosFiltrados = productos.filter((producto) =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSuccess = () => {
    setShowModal(false);
    setRefreshTrigger(!refreshTrigger);
  };

  if (loading) return <LoadingSpinner message="Cargando productos..." />;

  return (
    <>
      <DataViewContainer
        title="Productos"
        count={productosFiltrados.length}
        onCreateClick={() => setShowModal(true)}
        searchValue={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        searchPlaceholder="Buscar por nombre..."
        error={error}
        isEmpty={productosFiltrados.length === 0}
        emptyMessage="No hay productos registrados"
      >
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th className="date-header">Última Modificación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((producto) => (
                <tr key={producto.id}>
                  <td className="id-cell">#{producto.id}</td>
                  <td>{producto.nombre}</td>
                  <td className="price-cell"> {producto.precio}</td>
                  <td className="date-cell">
                    {formatLocalDate(
                      producto.updated_at || producto.created_at
                    )}
                  </td>
                  <td>
                    <button
                      className="action-btn"
                      onClick={() => navigate(`/productos/${producto.id}`)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataViewContainer>

      <NewProductModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
