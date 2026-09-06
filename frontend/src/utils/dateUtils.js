const LOCAL_TIMEZONE = "America/Bogota";

function parseApiDate(value) {
  if (!value) return null;
  const text = String(value);
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(text);
  return new Date(hasTimezone ? text : `${text}-05:00`);
}

export function formatLocalDate(value) {
  const date = parseApiDate(value);
  return date
    ? date.toLocaleDateString("es-CO", { timeZone: LOCAL_TIMEZONE })
    : "N/A";
}

export function formatLocalDateTime(value) {
  const date = parseApiDate(value);
  if (!date) return "N/A";

  return `${date.toLocaleDateString("es-CO", {
    timeZone: LOCAL_TIMEZONE,
  })} ${date.toLocaleTimeString("es-CO", {
    timeZone: LOCAL_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
