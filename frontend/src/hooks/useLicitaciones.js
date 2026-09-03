import { useState, useEffect } from "react";
import apiClient from "../api/client";

export const useLicitaciones = (refreshTrigger) => {
  const [licitaciones, setLicitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarLicitaciones = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/licitaciones");
        setLicitaciones(response.data);
        setError("");
      } catch (err) {
        setError(err.response?.data?.detail || "Error cargando licitaciones");
      } finally {
        setLoading(false);
      }
    };

    cargarLicitaciones();
  }, [refreshTrigger]);

  return { licitaciones, loading, error };
};
