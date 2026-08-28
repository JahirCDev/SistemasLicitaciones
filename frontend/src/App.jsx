import { useEffect, useState } from "react";
import apiClient from "./api/client";
import { supabase } from "./services/supabase";

function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testSupabase = async () => {
      const { data, error} = await supabase
      .from("clientes")
      .select("*")
      .limit(1);
      console.log ("Supabase:", {data, error});
    };
    testSupabase();
    apiClient
      .get("/health")
      .then((res) => setHealth(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Sistema de Licitaciones</h1>
      {loading ? <p>Cargando...</p> : <p>Backend: {health?.status}</p>}
    </div>
  );
}

export default App;
