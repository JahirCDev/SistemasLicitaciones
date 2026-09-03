import { useState, useRef, useEffect } from "react";
import "../../styles/forms/InlineEditCell.css";

export default function InlineEditCell({
  value,
  onSave,
  type = "text",
  editable = true,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? "");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (!editable) return;

    setEditValue(value ?? "");
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }

    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value ?? "");
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <span
        className={`inline-edit-display ${editable ? "editable" : ""}`}
        onDoubleClick={handleDoubleClick}
        title={editable ? "Doble click para editar" : ""}
      >
        {type === "price"
          ? `$${parseFloat(value || 0).toFixed(2)}`
          : value || "-"}
      </span>
    );
  }

  return (
    <div className="inline-edit-container">
      <input
        ref={inputRef}
        type={type === "price" ? "number" : "text"}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        step={type === "price" ? "0.01" : undefined}
        className="inline-edit-input"
      />

      <button
        type="button"
        className="inline-edit-btn-save"
        onClick={handleSave}
        title="Guardar (Enter)"
      >
        ✓
      </button>

      <button
        type="button"
        className="inline-edit-btn-cancel"
        onClick={handleCancel}
        title="Cancelar (Esc)"
      >
        ✕
      </button>
    </div>
  );
}
