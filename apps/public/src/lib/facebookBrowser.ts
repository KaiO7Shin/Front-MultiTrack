const FACEBOOK_APP = /FB_IAB|FBAN|FBAV|FB4A|FBIOS/i;
const MOBILE = /Android|iPhone|iPad|iPod|Mobile/i;
const ANDROID = /Android/i;

const NOTICE_KEY = "mt-facebook-browser-notice";
export const FACEBOOK_BROWSER_NOTICE_EVENT = "mt-facebook-browser-notice";

const INTENT_FALLBACK_MS = 900;

/** Navigateur intégré de l’application Facebook sur téléphone ou tablette. */
export function isFacebookInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return FACEBOOK_APP.test(ua) && MOBILE.test(ua);
}

function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return ANDROID.test(navigator.userAgent || "");
}

export function absoluteHttpUrl(url: string): string {
  return new URL(url, window.location.origin).href;
}

/** Intention Android vers le navigateur par défaut, sans forcer Chrome. */
export function androidIntentUrl(url: string): string {
  const absolute = absoluteHttpUrl(url);
  const parsed = new URL(absolute);
  const scheme = parsed.protocol.replace(":", "");
  const path = `${parsed.host}${parsed.pathname}${parsed.search}`;
  const fallback = encodeURIComponent(absolute);
  return `intent://${path}#Intent;scheme=${scheme};action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=${fallback};end`;
}

export function requestFacebookBrowserNotice(): void {
  try {
    sessionStorage.setItem(NOTICE_KEY, "1");
  } catch {
    /* navigation privée */
  }
  window.dispatchEvent(new Event(FACEBOOK_BROWSER_NOTICE_EVENT));
}

export function facebookBrowserNoticeRequested(): boolean {
  if (!isFacebookInAppBrowser()) return false;
  try {
    return sessionStorage.getItem(NOTICE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Quitte le navigateur Facebook vers `externalUrl` sur Android.
 * Sur iPhone, ou si l’intention reste dans Facebook, appelle `onManualFallback`
 * pour préparer l’adresse cible et afficher la consigne.
 * Retourne true quand le clic a été pris en charge.
 */
export function handoffFacebookClick(
  event: { preventDefault(): void },
  externalUrl: string,
  onManualFallback: () => void,
): boolean {
  if (!isFacebookInAppBrowser()) return false;
  event.preventDefault();
  if (!isAndroidDevice()) {
    onManualFallback();
    return true;
  }

  let left = false;
  const markLeft = () => {
    left = true;
  };
  window.addEventListener("pagehide", markLeft, { once: true });
  const onVisibility = () => {
    if (document.visibilityState === "hidden") markLeft();
  };
  document.addEventListener("visibilitychange", onVisibility);

  window.location.assign(androidIntentUrl(externalUrl));
  window.setTimeout(() => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", markLeft);
    if (!left && document.visibilityState === "visible") onManualFallback();
  }, INTENT_FALLBACK_MS);
  return true;
}
