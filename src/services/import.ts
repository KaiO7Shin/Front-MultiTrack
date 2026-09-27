// API désactivée : données statiques du back-office.
// import api from "@/lib/api";
// import { API } from "@/lib/apiEndpoints";
import { staticStore } from "@/data/staticStore";

export async function importParticipantsCsv(
  file: File,
  separator: string
): Promise<{ message: string }> {
  // const formData = new FormData();
  // formData.append("csvFile", file);
  // const response = await api.post(
  //   `${API.importParticipants}?separator=${encodeURIComponent(separator)}`,
  //   formData,
  //   { headers: { "Content-Type": "multipart/form-data" } }
  // );
  // return { message: response.data?.message ?? "Import terminé avec succès." };
  const text = await file.text();
  return staticStore.importParticipantsCsv(text, separator);
}
