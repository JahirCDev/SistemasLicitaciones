import apiClient from "../api/client";

export const productosService = {
  listar: () => apiClient.get("/productos"),

  obtener: (id) => apiClient.get(`/productos/${id}`),

  crear: (data) => apiClient.post("/productos", data),

  actualizar: (id, data) => apiClient.put(`/productos/${id}`, data),

  obtenerHistorial: (id) => apiClient.get(`/productos/${id}/historial`),

  // borrar: (id) => apiClient.delete(`/productos/${id}`),
};
