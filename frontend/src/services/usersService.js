import apiClient from "../api/client";

export const usersService = {
  obtenerActual: async (userId) => {
    try {
      const response = await apiClient.get(`/usuarios`);
      const usuarios = response.data;
      const usuarioActual = usuarios.find((u) => u.id === userId);
      return usuarioActual;
    } catch (err) {
      console.error(
        err.response?.data?.detail || "Error obteniendo usuario actual"
      );
      return null;
    }
  },
  crear: (data) => apiClient.post("/usuarios", data),
  listar: () => apiClient.get("/usuarios"),
  login: (email, password) => apiClient.post("/usuarios/login", null, { params: { email, password } }),
  obtenerPerfil: () => apiClient.get("/usuarios/me"),
  obtenerHistorial: (usuarioId) => apiClient.get(`/usuarios/${usuarioId}/historial`),
  actualizar: (id, data) => apiClient.put(`/usuarios/${id}`, data),
};
