export function formatAmount(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} Ar`;
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
