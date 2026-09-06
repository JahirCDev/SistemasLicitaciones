import { useParams, useNavigate } from "react-router-dom";
import ClientDetailView from "../components/views/ClienteDetailView"
import "../styles/pages/DetailPage.css";

export default function ClienteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    const lastTab = localStorage.getItem("activeTab") || "licitaciones";
    navigate(`/?tab=${lastTab}`);
  };

  return (
    <div className="detail-page">
      <ClientDetailView clienteId={parseInt(id)} onClose={handleClose} />
    </div>
  );
}
