import apiClient from "../api/client";

export const licitacionesService = {
  listar: () => apiClient.get("/licitaciones"),

  obtener: (id) => apiClient.get(`/licitaciones/${id}`),

  obtenerDetalle: (id) => apiClient.get(`/licitaciones/${id}/detalle`),

  crear: (data) => apiClient.post("/licitaciones", data),

  agregarProducto: (licId, prodId, cantidad) =>
    apiClient.post(
      `/licitaciones/${licId}/productos/${prodId}?cantidad=${cantidad}`
    ),

  removerProducto: (licId, prodId) =>
    apiClient.delete(`/licitaciones/${licId}/productos/${prodId}`),

  subirDocumento: (licId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post(`/licitaciones/${licId}/documento`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  enviar: (licId) => apiClient.post(`/licitaciones/${licId}/enviar`),

  marcarFinalizada: (licId) =>
    apiClient.post(`/licitaciones/${licId}/marcar-finalizada`),

  marcarPerdida: (licId) =>
    apiClient.post(`/licitaciones/${licId}/marcar-perdida`),

  marcarPorCobrar: (licId) =>
    apiClient.post(`/licitaciones/${licId}/marcar-por-cobrar`),

  registrarPago: (licId, monto) =>
    apiClient.post(`/licitaciones/${licId}/registrar-pago?monto=${monto}`),

  obtenerHistorial: (licId) =>
    apiClient.get(`/licitaciones/${licId}/historial-cambios`),

  obtenerHistorialTransiciones: (licId) =>
    apiClient.get(`/licitaciones/${licId}/historial`),
};
