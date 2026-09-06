import { useParams, useNavigate } from "react-router-dom";
import UsuarioDetailView from "../components/views/UsuarioDetailView";
import "../styles/pages/DetailPage.css";

export default function UsuarioDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="detail-page">
      <UsuarioDetailView
        usuarioId={parseInt(id)}
        onClose={() => navigate(-1)}
      />
    </div>
  );
}
