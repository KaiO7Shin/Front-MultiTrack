import type { PaymentMethod } from "../types";

/** Organizer contacts shown on the public site. */
export const ORGANIZER_CONTACTS = {
  email: "revynatioravelo@gmail.com",
  phone: "+261 34 88 935 36",
  phoneTel: "+261348893536",
} as const;

/**
 * Numéros MVola / Orange Money affichés à l’étape paiement.
 */
export const PAYMENT = {
  MVola: {
    number: "038 17 664 91",
    recipient: "Sylvio Kevin",
    logo: "/mvola.svg",
    alt: "MVola",
  },
  "Orange Money": {
    number: "037 79 161 59",
    recipient: "Syvio Kevin",
    logo: "/orange-money.svg",
    alt: "Orange Money",
  },
} as const satisfies Record<PaymentMethod, { number: string; recipient: string; logo: string; alt: string }>;

/** Official TBB rules PDF hosted on Google Drive. */
export const RULES_DOCUMENT = {
  title: "Règlement de l’événement",
  subtitle: "Document officiel · PDF",
  fileId: "1XaXEiNX9ufEf-Ot3p98wpdVcJRG_UUtV",
  viewUrl: "https://drive.google.com/file/d/1XaXEiNX9ufEf-Ot3p98wpdVcJRG_UUtV/view?usp=sharing",
  downloadUrl: "https://drive.google.com/uc?export=download&id=1XaXEiNX9ufEf-Ot3p98wpdVcJRG_UUtV",
} as const;

/** Modèle d’autorisation parentale (Google Docs, export PDF). */
export const PARENTAL_AUTHORIZATION_TEMPLATE = {
  title: "Modèle d’autorisation parentale",
  viewUrl: "https://docs.google.com/document/d/1qhRfnPScf7a9ZfqM2ZHS-t4G221JHEIW/edit?usp=drive_link",
  downloadUrl: "https://docs.google.com/document/d/1qhRfnPScf7a9ZfqM2ZHS-t4G221JHEIW/export?format=pdf",
} as const;

/** Transfer label to use when paying by MVola or Orange Money. */
export const PAYMENT_MOTIF = {
  pattern: "TBB-VotrePrénom",
  example: "TBB-<VotrePrénom>",
} as const;
