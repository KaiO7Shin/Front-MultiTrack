import type { PaymentMethod } from "../types";

/** Organizer contacts shown on the public site. */
export const ORGANIZER_CONTACTS = {
  email: "revynatioravelo@gmail.com",
  phone: "+261 34 88 935 36",
  phoneTel: "+261348893536",
} as const;

/**
 * Demo Madagascar-style payment numbers for the prototype.
 * 034 = Telma / MVola (reused from the previous single PAYMENT_NUMBER).
 * 032 = Orange Money (distinct demo number).
 */
export const PAYMENT = {
  MVola: {
    number: "034 00 000 00",
    logo: "/mvola.svg",
    alt: "MVola",
  },
  "Orange Money": {
    number: "032 11 000 00",
    logo: "/orange-money.svg",
    alt: "Orange Money",
  },
} as const satisfies Record<PaymentMethod, { number: string; logo: string; alt: string }>;

/** Official TBB rules PDF hosted on Google Drive. */
export const RULES_DOCUMENT = {
  title: "Règlement de l’événement",
  subtitle: "Document officiel · PDF",
  fileId: "1XaXEiNX9ufEf-Ot3p98wpdVcJRG_UUtV",
  viewUrl: "https://drive.google.com/file/d/1XaXEiNX9ufEf-Ot3p98wpdVcJRG_UUtV/view?usp=sharing",
  downloadUrl: "https://drive.google.com/uc?export=download&id=1XaXEiNX9ufEf-Ot3p98wpdVcJRG_UUtV",
} as const;

/** Transfer label to use when paying by MVola or Orange Money. */
export const PAYMENT_MOTIF = {
  pattern: "TBB-VotrePrénom",
  example: "TBB-<VotrePrénom>",
} as const;
