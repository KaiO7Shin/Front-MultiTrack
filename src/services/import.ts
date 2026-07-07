import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import { apiWriteOrLocal } from "@/lib/apiFallback";

export async function importParticipantsCsv(
  file: File,
  separator: string
): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append("csvFile", file);

  return apiWriteOrLocal(
    async () => {
      const response = await api.post(
        `${API.importParticipants}?separator=${encodeURIComponent(separator)}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return {
        message: response.data?.message ?? "Import terminé avec succès.",
      };
    },
    () => {
      throw {
        response: {
          data: {
            message:
              "Import CSV indisponible en mode local. Utilisez l'ajout manuel ou déployez POST /import/participants.",
          },
        },
      };
    },
    `POST ${API.importParticipants}`
  );
}
