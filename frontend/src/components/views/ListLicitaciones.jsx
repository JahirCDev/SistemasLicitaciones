import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLicitaciones } from "../../hooks/useLicitaciones";
import { useClientes } from "../../hooks/useClientes";
import DataViewContainer from "../common/DataViewContainer";
import LoadingSpinner from "../common/LoadingSpinner";
import "../../styles/views/ListLicitaciones.css";
import { formatLocalDate } from "../../utils/dateUtils";

export default function ListarLicitaciones({ refreshTrigger, onNewBidding }) {
  const navigate = useNavigate();
  const { licitaciones, loading, error } = useLicitaciones(refreshTrigger);
  const {
    clientes,
    loading: clientesLoading,
    error: clientesError,
  } = useClientes(refreshTrigger);
  const [filterEstado, setFilterEstado] = useState("todas");
  const [searchTerm, setSearchTerm] = useState("");

  const clientePorId = useMemo(
    () =>
      Object.fromEntries(
        clientes.map((cliente) => [
          cliente.id,
          `${cliente.nombre || ""} ${cliente.apellido || ""}`.trim(),
        ])
      ),
    [clientes]
  );

  const getClienteNombre = useCallback(
    (clienteId) => {
      if (!clienteId) return "Sin cliente";
      return clientePorId[clienteId] || `Cliente #${clienteId}`;
    },
    [clientePorId]
  );

  const estados = [
    { valor: "todas", etiqueta: "Todas" },
    { valor: "borrador", etiqueta: "Borrador" },
    { valor: "activa", etiqueta: "Activas" },
    { valor: "finalizada", etiqueta: "Finalizadas" },
    { valor: "por_cobrar", etiqueta: "Por Cobrar" },
    { valor: "cobrada", etiqueta: "Cobradas" },
    { valor: "perdida", etiqueta: "Perdidas" },
  ];

  const filtradas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let resultado = licitaciones;

    if (filterEstado !== "todas") {
      resultado = resultado.filter((lic) => lic.estado === filterEstado);
    }

    if (term) {
      resultado = resultado.filter((lic) => {
        const nombreCliente = getClienteNombre(lic.cliente_id).toLowerCase();
        return (
          lic.id.toString().includes(term) ||
          lic.cliente_id.toString().includes(term) ||
          nombreCliente.includes(term)
        );
      });
    }

    return [...resultado].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }, [licitaciones, filterEstado, searchTerm, getClienteNombre]);

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

  if (loading || clientesLoading)
    return <LoadingSpinner message="Cargando licitaciones..." />;

  return (
    <DataViewContainer
      title="Todas las Licitaciones"
      count={filtradas.length}
      createLabel="Nueva Licitación"
      onCreateClick={onNewBidding}
      searchValue={searchTerm}
      onSearchChange={(e) => setSearchTerm(e.target.value)}
      searchPlaceholder="Buscar por ID o Cliente..."
      error={error || clientesError}
      isEmpty={filtradas.length === 0}
      emptyMessage="No hay licitaciones que coincidan con los filtros"
    >
      <div className="filters-wrapper">
        <div className="filter-buttons">
          {estados.map((estado) => (
            <button
              key={estado.valor}
              className={`filter-btn ${
                filterEstado === estado.valor ? "active" : ""
              }`}
              onClick={() => setFilterEstado(estado.valor)}
            >
              {estado.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Presupuesto</th>
              <th>Fecha Límite</th>
              <th>Creada</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((lic) => (
              <tr key={lic.id}>
                <td className="id-cell">#{lic.id}</td>
                <td>{getClienteNombre(lic.cliente_id)}</td>
                <td>
                  <span className={`badge ${getEstadoBadge(lic.estado)}`}>
                    {lic.estado}
                  </span>
                </td>
                <td>${lic.presupuesto_maximo.toFixed(2)}</td>
                <td>{new Date(lic.fecha_limite).toLocaleDateString()}</td>
                <td>{formatLocalDate(lic.created_at)}</td>
                <td className="actions-cell">
                  <button
                    className="action-btn action-btn-primary"
                    onClick={() => navigate(`/licitaciones/${lic.id}`)}
                  >
                    Editar
                  </button>
                  <button className="action-btn action-btn-secondary">
                    Pago
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DataViewContainer>
  );
}
