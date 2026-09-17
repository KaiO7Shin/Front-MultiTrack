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

/** Délai fictif pour les écrans pas encore branchés au back-end. */
export const MOCK_REQUEST_DELAY_MS = 4_000;

export function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
