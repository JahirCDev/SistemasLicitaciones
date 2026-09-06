import "../../styles/common/LoadingSpinner.css";

export default function LoadingSpinner({ message = "Cargando..." }) {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
}
