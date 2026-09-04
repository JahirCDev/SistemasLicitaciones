import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import LoginForm from "./components/forms/LoginForm";
import Sidebar from "./components/common/Sidebar";
import BiddingsExpiringSoon from "./components/views/LicitacionesExpiringSoon";
import ListBiddings from "./components/views/ListLicitaciones";
import NewBiddingPage from "./components/forms/NewLicitacionPage";
import ClientsView from "./components/views/ClientesView";
import ProductsView from "./components/views/ProductosView";
import { useAuthStore } from "./store/authStore";
import { usersService } from "./services/usersService";
import "./styles/Colors.css";
import "./App.css";

function App() {
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.userId);
  const logout = useAuthStore((state) => state.logout);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) return tabParam;
    return localStorage.getItem("activeTab") || "licitaciones";
  });
  const [refreshLicitaciones, setRefreshLicitaciones] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  // Limpiar el parámetro tab de la URL
  useEffect(() => {
    if (searchParams.has("tab")) {
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (token && userId) {
      const cargarUsuarioActual = async () => {
        const usuario = await usersService.obtenerActual(parseInt(userId));
        setUsuarioActual(usuario);
      };
      cargarUsuarioActual();
    }
  }, [token, userId]);

  if (!token) {
    return <LoginForm />;
  }

  const nombreUsuario = usuarioActual
    ? `${usuarioActual.nombre} ${usuarioActual.apellido}`
    : "Usuario";
    
  return (
    <div>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      <main
        className={`app-main ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      >
        <div className="main-content">
          {/* MENSAJE DE BIENVENIDA */}
          <div className="welcome-banner">
            <div className="welcome-content">
              <h2>¡Bienvenido {nombreUsuario}!</h2>
            </div>
            <button onClick={logout} className="logout-button-banner">
              Cerrar Sesión
            </button>
          </div>

          {/* CONTENIDO */}
          <div className="content-wrapper">
            {activeTab === "licitaciones" && (
              <div className="dashboard">
                <div className="dashboard-header">
                  <h2>Licitaciones</h2>
                </div>

                <BiddingsExpiringSoon refreshTrigger={refreshLicitaciones} />
                <ListBiddings
                  refreshTrigger={refreshLicitaciones}
                  onNewBidding={() => setActiveTab("nueva")}
                />
              </div>
            )}

            {activeTab === "nueva" && (
              <NewBiddingPage
                onSuccess={() => {
                  setRefreshLicitaciones(!refreshLicitaciones);
                  setActiveTab("licitaciones");
                }}
                onCancel={() => setActiveTab("licitaciones")}
              />
            )}

            {activeTab === "clientes" && <ClientsView />}

            {activeTab === "productos" && <ProductsView />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
