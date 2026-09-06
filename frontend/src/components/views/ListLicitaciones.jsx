import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLicitaciones } from "../../hooks/useLicitaciones";
import { useClientes } from "../../hooks/useClientes";
import DataViewContainer from "../common/DataViewContainer";
import LoadingSpinner from "../common/LoadingSpinner";
import PaymentModal from "../common/PaymentModal";
import ConfirmationModal from "../common/ConfirmationModal";
import "../../styles/views/ListLicitaciones.css";
import { formatLocalDate } from "../../utils/dateUtils";
import { licitacionesService } from "../../services/licitacionesService";

export default function ListarLicitaciones({ refreshTrigger, onNewBidding }) {
  const navigate = useNavigate();
  const [confirmModal, setConfirmModal] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLicitation, setSelectedLicitation] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const { licitaciones, loading, error } = useLicitaciones(refreshTrigger);
  const {
    clientes,
    loading: clientesLoading,
    error: clientesError,
  } = useClientes(refreshTrigger);
  const [filterEstado, setFilterEstado] = useState("todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

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

  /* const ejecutarAccion = async (licitacionId, accion) => {
    setActionLoading(`${licitacionId}-${accion}`);
    try {
      await licitacionesService[accion](licitacionId);
      window.location.reload();
    } catch (err) {
      console.error("Error actualizando estado:", err);
    } finally {
      setActionLoading(null);
    }
  };
 */
  const handleAbrirModalPago = async (lic) => {
    try {
      const detalle = await licitacionesService.obtenerDetalle(lic.id);
      setSelectedLicitation({
        ...lic,
        totalFacturado: detalle.data.total_facturado,
        totalPagado: detalle.data.total_pagado,
        saldoPendiente: detalle.data.saldo_pendiente,
      });
      setShowPaymentModal(true);
    } catch (err) {
      alert(err, "Error cargando datos");
    }
  };

  const handleRegistrarPago = async (monto) => {
    setPaymentLoading(true);
    try {
      await licitacionesService.registrarPago(selectedLicitation.id, monto);
      setShowPaymentModal(false);
      setSelectedLicitation(null);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al registrar pago");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCambiarEstado = async (accion, licitacionId) => {
    setActionLoading(`${licitacionId}-${accion}`);
    try {
      await licitacionesService[accion](licitacionId);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al actualizar estado");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || clientesLoading)
    return <LoadingSpinner message="Cargando licitaciones..." />;

  return (
    <>
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
                    {lic.estado === "borrador" && (
                      <button
                        className="action-btn action-btn-primary"
                        onClick={() => navigate(`/licitaciones/${lic.id}`)}
                      >
                        Editar
                      </button>
                    )}
                    {lic.estado === "activa" && (
                      <>
                        <button
                          className="action-btn action-btn-primary"
                          onClick={() => navigate(`/licitaciones/${lic.id}`)}
                        >
                          Editar
                        </button>
                        <button
                          className="action-btn action-btn-secondary"
                          disabled={
                            actionLoading === `${lic.id}-marcarFinalizada`
                          }
                          onClick={() =>
                            setConfirmModal({
                              title: "Marcar como finalizada",
                              message:
                                "¿Deseas marcar esta licitación como ganada?",
                              licitacionId: lic.id,
                              accion: "marcarFinalizada",
                              onConfirm: () => {
                                handleCambiarEstado("marcarFinalizada", lic.id);
                                setConfirmModal(null);
                              },
                              onCancel: () => setConfirmModal(null),
                            })
                          }
                        >
                          {actionLoading === `${lic.id}-marcarFinalizada`
                            ? "Procesando..."
                            : "Marcar Finalizada"}
                        </button>
                        <button
                          className="action-btn action-btn-secondary-lost"
                          disabled={actionLoading === `${lic.id}-marcarPerdida`}
                          onClick={() =>
                            setConfirmModal({
                              title: "Marcar como perdida",
                              message:
                                "¿Deseas marcar esta licitación como perdida?",
                              licitacionId: lic.id,
                              accion: "marcarPerdida",
                              onConfirm: () => {
                                handleCambiarEstado("marcarPerdida", lic.id);
                                setConfirmModal(null);
                              },
                              onCancel: () => setConfirmModal(null),
                            })
                          }
                        >
                          {actionLoading === `${lic.id}-marcarPerdida`
                            ? "Procesando..."
                            : "Marcar Perdida"}
                        </button>
                      </>
                    )}
                    {lic.estado === "finalizada" && (
                      <>
                        <button
                          className="action-btn action-btn-primary"
                          onClick={() => navigate(`/licitaciones/${lic.id}`)}
                        >
                          Ver licitación
                        </button>
                        <button
                          className="action-btn action-btn-secondary"
                          disabled={
                            actionLoading === `${lic.id}-marcarPorCobrar`
                          }
                          onClick={() =>
                            setConfirmModal({
                              title: "Marcar por cobrar",
                              message:
                                "¿Deseas facturar esta licitación como?",
                              licitacionId: lic.id,
                              accion: "marcarPorCobrar",
                              onConfirm: () => {
                                handleCambiarEstado("marcarPorCobrar", lic.id);
                                setConfirmModal(null);
                              },
                              onCancel: () => setConfirmModal(null),
                            })
                          }
                        >
                          Facturar
                        </button>
                      </>
                    )}
                    {/* POR COBRAR */}
                    {lic.estado === "por_cobrar" && (
                      <>
                        <button
                          className="action-btn action-btn-primary"
                          onClick={() => navigate(`/licitaciones/${lic.id}`)}
                        >
                          Ver Licitación
                        </button>
                        <button
                          className="action-btn action-btn-secondary"
                          onClick={() => handleAbrirModalPago(lic)}
                        >
                          Registrar Pago
                        </button>
                      </>
                    )}
                    {lic.estado === "cobrada" && (
                      <button
                        className="action-btn action-btn-primary"
                        onClick={() => navigate(`/licitaciones/${lic.id}`)}
                      >
                        Ver Licitación
                      </button>
                    )}
                    {lic.estado === "perdida" && (
                      <button
                        className="action-btn action-btn-primary"
                        onClick={() => navigate(`/licitaciones/${lic.id}`)}
                      >
                        Ver licitación
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataViewContainer>
      {showPaymentModal && selectedLicitation && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedLicitation(null);
          }}
          totalFacturado={selectedLicitation.totalFacturado}
          totalPagado={selectedLicitation.totalPagado}
          saldoPendiente={selectedLicitation.saldoPendiente}
          onRegistrarPago={handleRegistrarPago}
          isSaving={paymentLoading}
        />
      )}
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

      {showPaymentModal && selectedLicitation && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedLicitation(null);
          }}
          totalFacturado={selectedLicitation.totalFacturado}
          totalPagado={selectedLicitation.totalPagado}
          saldoPendiente={selectedLicitation.saldoPendiente}
          onRegistrarPago={handleRegistrarPago}
          isSaving={paymentLoading}
        />
      )}
    </>
  );
}
