import { useState, useEffect } from "react";
import { clientesService } from "../services/clientesService";

export const useClientes = (refreshTrigger) => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarClientes = async () => {
      try {
        setLoading(true);
        const response = await clientesService.listar();
        setClientes(response.data || []);
        setError("");
      } catch (err) {
        console.error("Error cargando clientes:", err);
        setError(err.response?.data?.detail || "Error cargando clientes");
      } finally {
        setLoading(false);
      }
    };

    cargarClientes();
  }, [refreshTrigger]);

  return { clientes, loading, error };
};
