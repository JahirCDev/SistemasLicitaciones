import { create } from "zustand";

export const useAuthStore = create((set) => ({
  token: localStorage.getItem("token") || null,
  userId: localStorage.getItem("userId") || null,
  usuario: JSON.parse(localStorage.getItem("usuario")) || null,

  login: (token, userId) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    set({ token, userId });
  },

  setUsuario: (usuario) => {
    localStorage.setItem("usuario", JSON.stringify(usuario));
    set({ usuario });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("usuario");
    set({ token: null, userId: null, usuario: null });
  },
}));
