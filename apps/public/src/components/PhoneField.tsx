import {
  PhoneInput,
  buildCountryData,
  defaultCountries,
  parseCountry,
} from "react-international-phone";
import "react-international-phone/style.css";

const countries = defaultCountries.map((country) => {
  const parsed = parseCountry(country);
  if (parsed.iso2 !== "mg") return country;
  return buildCountryData({ ...parsed, format: ".. .. ... .." });
});

export function PhoneField({
  value,
  onChange,
  disabled,
  required = true,
  label = "Numéro de téléphone",
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
}) {
  return (
    <label className="field phone-field">
      <span>{label}</span>
      <PhoneInput
        defaultCountry="mg"
        countries={countries}
        value={value}
        onChange={onChange}
        disabled={disabled}
        inputProps={{
          name: "phone",
          required,
          autoComplete: "tel",
        }}
      />
    </label>
  );
}
