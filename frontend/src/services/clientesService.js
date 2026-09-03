import apiClient from "../api/client";

export const clientesService = {
  listar: () => apiClient.get("/clientes"),

  obtener: (id) => apiClient.get(`/clientes/${id}`),

  crear: (data) => apiClient.post("/clientes", data),

  actualizar: (id, data) => apiClient.put(`/clientes/${id}`, data),

  obtenerHistorial: (id) => apiClient.get(`/clientes/${id}/historial`),

  // borrar: (id) => apiClient.delete(`/clientes/${id}`),
};
