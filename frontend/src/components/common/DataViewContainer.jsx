import "../../styles/common/DataViewContainer.css";

export default function DataViewContainer({
  title,
  count,
  createLabel = "Nuevo",
  onCreateClick,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  error,
  isEmpty,
  emptyMessage,
  children,
}) {
  return (
    <div className="data-view-wrapper">
      <div className="view-header">
        <div>
          <h2>{title}</h2>
          <p>{count} elemento(s)</p>
        </div>
        <button className="btn-create" onClick={onCreateClick}>
          {createLabel}
        </button>
      </div>

      <div className="view-controls">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={onSearchChange}
          className="search-input"
        />
      </div>

      {error && <div className="error-alert">{error}</div>}

      {isEmpty ? (
        <div className="view-empty">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="view-content">{children}</div>
      )}
    </div>
  );
}
