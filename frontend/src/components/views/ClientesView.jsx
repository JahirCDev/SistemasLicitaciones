import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClientes } from "../../hooks/useClientes";
import NewClientModal from "../forms/NewClienteModal";
import DataViewContainer from "../common/DataViewContainer";
import LoadingSpinner from "../common/LoadingSpinner";
import "../../styles/views/ClientesView.css";

export default function ClientesView() {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const { clientes, loading, error } = useClientes(refreshTrigger);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const clientesFiltrados = clientes.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSuccess = () => {
    setShowModal(false);
    setRefreshTrigger(!refreshTrigger);
  };

  if (loading) return <LoadingSpinner message="Cargando clientes..." />;

  return (
    <>
      <DataViewContainer
        title="Clientes"
        count={clientesFiltrados.length}
        onCreateClick={() => setShowModal(true)}
        searchValue={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        searchPlaceholder="Buscar por nombre, apellido o email..."
        error={error}
        isEmpty={clientesFiltrados.length === 0}
        emptyMessage="No hay clientes registrados"
      >
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Email</th>
                <th>Última Modificación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id}>
                  <td className="id-cell">#{cliente.id}</td>
                  <td>{cliente.nombre}</td>
                  <td>{cliente.apellido || ""}</td>
                  <td className="email-cell">{cliente.email}</td>
                  <td className="date-cell">
                    {cliente.updated_at
                      ? new Date(cliente.updated_at).toLocaleDateString()
                      : new Date(cliente.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="action-btn"
                      onClick={() => navigate(`/clientes/${cliente.id}`)}
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
      <NewClientModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
