import { useState, useEffect } from "react";
import { usersService } from "../services/usersService";

export function useUsuarios(refreshTrigger) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const cargarUsuarios = async () => {
      try {
        setLoading(true);
        const response = await usersService.listar();
        if (isMounted) {
          setUsuarios(response.data || []);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.detail || "Error cargando usuarios");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    cargarUsuarios();

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  const refetch = async () => {
    try {
      setLoading(true);
      const response = await usersService.listar();
      setUsuarios(response.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  };

  return { usuarios, loading, error, refetch };
}
