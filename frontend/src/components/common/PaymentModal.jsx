import { useState } from "react";
import ConfirmationModal from "./ConfirmationModal";
import "../../styles/common/PaymentModal.css";

export default function PaymentModal({
  isOpen,
  onClose,
  totalFacturado,
  totalPagado,
  saldoPendiente,
  onRegistrarPago,
  isSaving,
}) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [confirmModal, setConfirmModal] = useState(null);

  const handleRegistrar = () => {
    const monto = parseFloat(paymentAmount);
    if (!monto || monto <= 0) {
      alert("Ingresa un monto válido");
      return;
    }

    setConfirmModal({
      title: "Registrar pago",
      message: `¿Registrar pago de $${monto.toFixed(2)}?`,
      onConfirm: async () => {
        await onRegistrarPago(monto);
        setPaymentAmount("");
        setConfirmModal(null);
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h4>Registrar Pago</h4>
            <button onClick={onClose} className="modal-close">
              ✕
            </button>
          </div>

          <div className="modal-body">
            <div className="payment-info">
              <div className="info-row">
                <span>Total Facturado:</span>
                <strong>${totalFacturado.toFixed(2)}</strong>
              </div>
              <div className="info-row">
                <span>Total Pagado:</span>
                <strong>${totalPagado.toFixed(2)}</strong>
              </div>
              <div className="info-row highlight">
                <span>Saldo Pendiente:</span>
                <strong>${saldoPendiente.toFixed(2)}</strong>
              </div>
            </div>

            <div className="form-group">
              <label>Monto a Pagar</label>
              <div className="payment-input-group">
                <span className="currency">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={saldoPendiente}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={isSaving}
                />
              </div>
              {paymentAmount && (
                <div
                  className={`payment-validation ${
                    parseFloat(paymentAmount) > saldoPendiente
                      ? "error"
                      : "success"
                  }`}
                >
                  {parseFloat(paymentAmount) > saldoPendiente
                    ? `El monto no puede exceder $${saldoPendiente.toFixed(2)}`
                    : `Saldo después del pago: $${(
                        saldoPendiente - parseFloat(paymentAmount)
                      ).toFixed(2)}`}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleRegistrar}
              className="btn-primary"
              disabled={
                !paymentAmount ||
                parseFloat(paymentAmount) <= 0 ||
                parseFloat(paymentAmount) > saldoPendiente ||
                isSaving
              }
            >
              {isSaving ? "Registrando..." : "Registrar Pago"}
            </button>
          </div>
        </div>
      </div>

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
    </>
  );
}
