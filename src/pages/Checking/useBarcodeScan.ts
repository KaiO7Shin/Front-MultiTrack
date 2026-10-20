import { useCallback, useEffect, useRef, useState } from "react";
import { BIB_LENGTH, INVALID_BIB } from "./checkingForm";

type UseBarcodeScanOptions = {
  enabled: boolean;
  onScan: (bib: string) => void;
  onInvalid: (message: string) => void;
};

/**
 * Tampon clavier pour un lecteur HID : chiffres uniquement, envoi au 4e chiffre.
 * Une Entrée sur un tampon vide est ignorée (suffixe CR après un scan déjà envoyé).
 */
export function useBarcodeScan({ enabled, onScan, onInvalid }: UseBarcodeScanOptions) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const bufferRef = useRef("");
  const enabledRef = useRef(enabled);
  const onScanRef = useRef(onScan);
  const onInvalidRef = useRef(onInvalid);

  enabledRef.current = enabled;
  onScanRef.current = onScan;
  onInvalidRef.current = onInvalid;

  const clear = useCallback(() => {
    bufferRef.current = "";
    setValue("");
  }, []);

  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    focus();
  }, [focus]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!enabledRef.current) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        if (bufferRef.current.length === 0) return;
        bufferRef.current = "";
        setValue("");
        onInvalidRef.current(INVALID_BIB);
        return;
      }

      if (event.key >= "0" && event.key <= "9") {
        event.preventDefault();
        event.stopPropagation();
        const next = bufferRef.current + event.key;
        bufferRef.current = next;
        setValue(next);
        if (next.length === BIB_LENGTH) {
          bufferRef.current = "";
          enabledRef.current = false;
          onScanRef.current(next);
        }
        return;
      }

      if (event.key.length === 1) {
        event.preventDefault();
        event.stopPropagation();
        bufferRef.current = "";
        setValue("");
        onInvalidRef.current(INVALID_BIB);
      }
    }

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  return { value, clear, focus, inputRef };
}
