export function formatAmount(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} Ar`;
}

export function formatDistanceKm(distance: number | string | null | undefined) {
  const value = Number(distance);
  if (!Number.isFinite(value)) return "—";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value)} km`;
}

export function formatAgeBound(age: number | null | undefined, empty = "–") {
  if (age === null || age === undefined || Number.isNaN(Number(age))) {
    return empty;
  }
  return String(age);
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
}

export function isValidPhone(phone: string) {
  return /^\+\d{8,15}$/.test(phone.replace(/[\s()-]/g, ""));
}

export function isHttpUrl(value: string | null | undefined) {
  return Boolean(value && /^https?:\/\//i.test(value));
}

export function formatInscriptionDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR");
}

export function downloadTextFile(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function formValues(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries());
}

export function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
