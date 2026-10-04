import { FormField, selectClassName } from "@/components/ui/form-field";
import {
  needsPartnerTShirt,
  partnerTShirtLabel,
} from "@/lib/duoCourses";
import type { TailleTShirtOption } from "@/services/taillesTShirt";

export function TshirtSizeFields({
  tailleTShirt,
  tailleTShirtBinome,
  courseLibelle,
  tailles,
  onTailleTShirtChange,
  onTailleTShirtBinomeChange,
}: {
  tailleTShirt: string;
  tailleTShirtBinome: string;
  courseLibelle: string;
  tailles: TailleTShirtOption[];
  onTailleTShirtChange: (value: string) => void;
  onTailleTShirtBinomeChange: (value: string) => void;
}) {
  const showPartner = needsPartnerTShirt(courseLibelle);

  return (
    <>
      <FormField label="Taille t-shirt" htmlFor="participant-tshirt" required>
        <select
          id="participant-tshirt"
          className={selectClassName}
          value={tailleTShirt}
          onChange={(e) => onTailleTShirtChange(e.target.value)}
          required
        >
          <option value="" disabled>
            Sélectionne une taille…
          </option>
          {tailles.map((size) => (
            <option key={size.id} value={size.alias}>
              {size.alias}
            </option>
          ))}
        </select>
      </FormField>
      {showPartner && (
        <FormField
          label={partnerTShirtLabel(courseLibelle)}
          htmlFor="participant-tshirt-binome"
          required
        >
          <select
            id="participant-tshirt-binome"
            className={selectClassName}
            value={tailleTShirtBinome}
            onChange={(e) => onTailleTShirtBinomeChange(e.target.value)}
            required
          >
            <option value="" disabled>
              Sélectionne une taille…
            </option>
            {tailles.map((size) => (
              <option key={size.id} value={size.alias}>
                {size.alias}
              </option>
            ))}
          </select>
        </FormField>
      )}
    </>
  );
}
