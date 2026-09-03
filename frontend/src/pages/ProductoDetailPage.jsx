import { useParams, useNavigate } from "react-router-dom";
import ProductDetailView from "../components/views/ProductoDetailView";
import "../styles/pages/DetailPage.css";

export default function ProductoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    const lastTab = localStorage.getItem("activeTab") || "licitaciones";
    navigate(`/?tab=${lastTab}`);
  };

  return (
    <div className="detail-page">
      <ProductDetailView productoId={parseInt(id)} onClose={handleClose} />
    </div>
  );
}
