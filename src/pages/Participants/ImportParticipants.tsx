import { useRef, useState } from "react";
import api from "../../lib/api";

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

    const formData = new FormData();
    formData.append("csvFile", file);

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await api.post(
        `/import/participants?separator=${separator}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setMessage(response.data.message || "Import terminé avec succès.");
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
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Import CSV – Participants</h1>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">

        {/* Séparateur */}
        <div>
          <label className="text-sm font-medium text-slate-700">Séparateur CSV</label>
          <select
            value={separator}
            onChange={(e) => setSeparator(e.target.value)}
            className="mt-1 w-40 border border-slate-300 rounded-lg px-3 py-2 focus:ring focus:ring-blue-100"
          >
            <option value=",">, Virgule</option>
            <option value=";">; Point-virgule</option>
            <option value="|">| Pipe</option>
          </select>
        </div>

        {/* Zone Drag & Drop */}
        <div
          onClick={openFileDialog}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition
            ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-blue-400"}`}
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
            <p className="text-slate-700 font-medium">📄 {fileName}</p>
          )}
        </div>

        {/* Loader */}
        {loading && (
          <div className="flex items-center gap-2 text-blue-600 text-sm">
            <span className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></span>
            Import en cours...
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
            {message}
          </div>
        )}

        <p className="text-xs text-slate-500">
          Colonnes requises :
          <br />
          <span className="font-mono">
            nom, date_naissance, genre, num_dossard, course_choisie_id, d_categorie_id
          </span>
        </p>
      </div>
    </section>
  );
};
