import { Field } from "../../components/form";
import { TSHIRT_SIZES } from "../../types";
import { needsPartnerTShirt, partnerTShirtLabel } from "../../lib/duoCourses";

export function TshirtSizeFields({
  tshirtSize,
  tshirtSizeBinome,
  race,
  busy = false,
  onTshirtSizeChange,
  onTshirtSizeBinomeChange,
}: {
  tshirtSize: string;
  tshirtSizeBinome: string;
  race: string;
  busy?: boolean;
  onTshirtSizeChange: (value: string) => void;
  onTshirtSizeBinomeChange: (value: string) => void;
}) {
  const showPartner = needsPartnerTShirt(race);

  return (
    <div className="two-columns">
      <Field label="Taille de t-shirt finisher *">
        <select
          name="tshirtSize"
          value={tshirtSize}
          onChange={(event) => onTshirtSizeChange(event.target.value)}
          required
          disabled={busy}
        >
          <option value="" disabled>Choisir une taille</option>
          {TSHIRT_SIZES.map((size) => (
            <option key={size.id} value={size.alias}>{size.alias}</option>
          ))}
        </select>
      </Field>
      {showPartner && (
        <Field label={`${partnerTShirtLabel(race)} *`}>
          <select
            name="tshirtSizeBinome"
            value={tshirtSizeBinome}
            onChange={(event) => onTshirtSizeBinomeChange(event.target.value)}
            required
            disabled={busy}
          >
            <option value="" disabled>Choisir une taille</option>
            {TSHIRT_SIZES.map((size) => (
              <option key={size.id} value={size.alias}>{size.alias}</option>
            ))}
          </select>
        </Field>
      )}
    </div>
  );
}
