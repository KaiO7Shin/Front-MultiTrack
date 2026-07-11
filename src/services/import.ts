import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";

export async function importParticipantsCsv(
  file: File,
  separator: string
): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append("csvFile", file);

  const response = await api.post(
    `${API.importParticipants}?separator=${encodeURIComponent(separator)}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return {
    message: response.data?.message ?? "Import terminé avec succès.",
  };
}
