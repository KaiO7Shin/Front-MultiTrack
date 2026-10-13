import { useEffect, useState } from "react";
import { downloadBlob } from "@/lib/downloadBlob";

export function DossardPdfPreview({
  blob,
  filename,
}: {
  blob: Blob;
  filename: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  if (!url) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600 truncate">{filename}</p>
        <button
          type="button"
          className="btn-secondary px-4 py-2 text-sm shrink-0"
          onClick={() => downloadBlob(blob, filename)}
        >
          Télécharger
        </button>
      </div>
      <iframe
        title="Aperçu des dossards"
        src={url}
        className="w-full h-[70vh] rounded-xl border border-slate-200 bg-slate-100"
      />
    </div>
  );
}
