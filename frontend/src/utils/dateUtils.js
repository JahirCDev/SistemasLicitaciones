const LOCAL_TIMEZONE = "America/Panama";
const LOCALE = "es-PA";

function parseApiDate(value) {
  if (!value) return null;

  const date = new Date(String(value).trim());

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatLocalDate(value) {
  const date = parseApiDate(value);

  if (!date) return "N/A";

  return date.toLocaleDateString(LOCALE, {
    timeZone: LOCAL_TIMEZONE,
  });
}

export function formatLocalDateTime(value) {
  const date = parseApiDate(value);

  if (!date) return "N/A";

  return date.toLocaleString(LOCALE, {
    timeZone: LOCAL_TIMEZONE,
    dateStyle: "short",
    timeStyle: "short",
  });
}
