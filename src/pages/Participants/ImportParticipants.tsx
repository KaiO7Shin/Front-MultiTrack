import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { importParticipantsCsv } from "@/services/import";
import { Alert, Spinner } from "@/components/ui/feedback";
import { FormField, selectClassName } from "@/components/ui/form-field";

export const ImportParticipants = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [separator, setSeparator] = useState(",");
  const [fileName, setFileName] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const openFileDialog = () => fileInputRef.current?.click();

  const uploadFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Le fichier doit être au format .csv");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { message } = await importParticipantsCsv(file, separator);
      setMessage(message);
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.message || "Erreur serveur lors de l'import.");
      } else {
        setError("Impossible de contacter le serveur.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setFileName(file.name);
    uploadFile(file);
  };

  return (
    <section className="page-section">
      <Breadcrumb
        items={[
          { label: "Participants", to: "/participants" },
          { label: "Import CSV" },
        ]}
      />
      <div>
        <h1 className="page-title">Import CSV – Participants</h1>
        <p className="page-subtitle">
          Importez une liste de participants depuis un fichier CSV.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-6">
        <FormField label="Séparateur CSV" htmlFor="csv-separator">
          <select
            id="csv-separator"
            value={separator}
            onChange={(e) => setSeparator(e.target.value)}
            className={`${selectClassName} w-full sm:w-40`}
          >
            <option value=",">, Virgule</option>
            <option value=";">; Point-virgule</option>
            <option value="|">| Pipe</option>
          </select>
        </FormField>

        <div
          role="button"
          tabIndex={0}
          aria-label="Zone de dépôt de fichier CSV"
          onClick={openFileDialog}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openFileDialog();
            }
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 sm:p-10 text-center cursor-pointer transition outline-none focus-visible:ring-2 focus-visible:ring-brand/40
            ${isDragging ? "border-brand bg-brand-muted" : "border-slate-300 hover:border-brand/60 hover:bg-brand-muted/50"}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setFileName(file.name);
              uploadFile(file);
            }}
          />

          <Upload className="h-8 w-8 mx-auto mb-3 text-slate-400" aria-hidden />

          {!fileName ? (
            <>
              <p className="text-slate-600 font-medium">
                Glissez votre fichier CSV ici ou cliquez pour parcourir
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Uniquement fichiers .csv
              </p>
            </>
          ) : (
            <p className="text-slate-700 font-medium">{fileName}</p>
          )}
        </div>

        <div aria-live="polite" aria-atomic="true" className="space-y-3">
          {loading && (
            <div className="flex items-center gap-2 text-brand-dark text-sm">
              <Spinner className="text-brand" />
              Import en cours…
            </div>
          )}

          {error && <Alert variant="error" role="alert">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}
        </div>

        <p className="text-xs text-slate-500">
          Colonnes requises :
          <br />
          <span className="font-mono">
            nom, prenom, date_naissance, genre, num_dossard, course_choisie_id, d_categorie_id
          </span>
        </p>
      </div>
    </section>
  );
};
