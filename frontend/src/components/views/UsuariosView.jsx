import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUsuarios } from "../../hooks/useUsuarios";
import DataViewContainer from "../common/DataViewContainer";
import LoadingSpinner from "../common/LoadingSpinner";
import NewUsuarioModal from "../forms/NewUsuarioModal";
import "../../styles/views/UsuariosView.css";
import { formatLocalDate } from "../../utils/dateUtils";

export default function UsuariosView({ refreshTrigger }) {
  const navigate = useNavigate();
  const { usuarios, loading, error, refetch } = useUsuarios(refreshTrigger);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);

  const filtrados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return usuarios.filter((user) =>
      `${user.nombre} ${user.apellido} ${user.email}`
        .toLowerCase()
        .includes(term)
    );
  }, [usuarios, searchTerm]);

  const getRolBadge = (rol) => {
    const badges = {
      admin: "badge-red",
      usuario: "badge-blue",
    };
    return badges[rol] || "badge-gray";
  };

  const handleNewUsuario = async () => {
    setShowNewModal(false);
    await refetch();
  };

  if (loading) return <LoadingSpinner message="Cargando usuarios..." />;

  return (
    <>
      <DataViewContainer
        title="Usuarios del Sistema"
        count={filtrados.length}
        createLabel="Nuevo Usuario"
        onCreateClick={() => setShowNewModal(true)}
        searchValue={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        searchPlaceholder="Buscar por nombre o email..."
        error={error}
        isEmpty={filtrados.length === 0}
        emptyMessage="No hay usuarios que coincidan con la búsqueda"
      >
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((user) => (
                <tr key={user.id}>
                  <td className="name-cell">
                    {user.nombre} {user.apellido}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${getRolBadge(user.rol)}`}>
                      {user.rol}
                    </span>
                  </td>
                  <td>{formatLocalDate(user.created_at)}</td>
                  <td className="actions-cell">
                    <button
                      className="action-btn action-btn-primary"
                      onClick={() => navigate(`/usuarios/${user.id}`)}
                    >
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataViewContainer>

      {showNewModal && (
        <NewUsuarioModal
          onClose={() => setShowNewModal(false)}
          onSuccess={handleNewUsuario}
        />
      )}
    </>
  );
}
