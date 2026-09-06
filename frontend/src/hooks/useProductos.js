import { useState, useEffect } from "react";
import { productosService } from "../services/productosService";

export const useProductos = (refreshTrigger) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true);
        const response = await productosService.listar();
        setProductos(response.data);
        setError("");
      } catch (err) {
        setError(err.response?.data?.detail || "Error cargando productos");
      } finally {
        setLoading(false);
      }
    };

    cargarProductos();
  }, [refreshTrigger]);

  return { productos, loading, error };
};
