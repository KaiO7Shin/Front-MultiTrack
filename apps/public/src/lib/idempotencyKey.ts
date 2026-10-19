/** Format accepté par `java.util.UUID` / Spring (`8-4-4-4-12` hex). */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isIdempotencyKey(value: string | undefined | null): boolean {
  return Boolean(value && UUID_PATTERN.test(value.trim()));
}

/** UUID v4 : `crypto.randomUUID` si possible, sinon `getRandomValues` (vieux WebViews). */
export function createIdempotencyKey(): string {
  try {
    const key = globalThis.crypto?.randomUUID?.();
    if (isIdempotencyKey(key)) return key;
  } catch {
    // HTTP ou WebView sans randomUUID
  }
  const bytes = new Uint8Array(16);
  if (globalThis.crypto) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

let sessionFallbackKey = "";

export function ensureIdempotencyKey(value: string | undefined | null): string {
  const trimmed = value?.trim() ?? "";
  if (isIdempotencyKey(trimmed)) {
    sessionFallbackKey = trimmed;
    return trimmed;
  }
  if (!isIdempotencyKey(sessionFallbackKey)) {
    sessionFallbackKey = createIdempotencyKey();
  }
  return sessionFallbackKey;
}

export function resetIdempotencyKey(): void {
  sessionFallbackKey = "";
}
