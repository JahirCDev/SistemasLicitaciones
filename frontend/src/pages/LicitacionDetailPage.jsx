import { useParams, useNavigate } from "react-router-dom";
import BiddingDetailView from "../components/views/LicitacionDetailView";
import "../styles/pages/DetailPage.css";

export default function LicitacionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    const lastTab = localStorage.getItem("activeTab") || "licitaciones";
    navigate(`/?tab=${lastTab}`);
  };

  return (
    <div className="detail-page">
      <BiddingDetailView licitacionId={parseInt(id)} onClose={handleClose} />
    </div>
  );
}
