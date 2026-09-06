import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import ClienteDetailPage from "./pages/ClienteDetailPage";
import ProductoDetailPage from "./pages/ProductoDetailPage";
import LicitacionDetailPage from "./pages/LicitacionDetailPage";
import UsuarioDetailPage from "./pages/UsuarioDetailPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/clientes/:id",
    element: <ClienteDetailPage />,
  },
  {
    path: "/productos/:id",
    element: <ProductoDetailPage />,
  },
  {
    path: "/licitaciones/:id",
    element: <LicitacionDetailPage />,
  },

  {
    path: "/usuarios/:id",
    element: <UsuarioDetailPage />,
  },
]);
