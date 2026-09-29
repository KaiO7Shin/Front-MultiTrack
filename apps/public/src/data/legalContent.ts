import { ORGANIZER_CONTACTS } from "../config/site";
import { EVENT_INFO } from "../data/catalog";

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

/** Politique de confidentialité — contenu affiché sur /confidentialite. */
export const PRIVACY_POLICY = {
  title: "Politique de confidentialité",
  intro:
    "Cette politique décrit comment MultiTrack et l’organisation de TBB — Trail Bike Beer collectent et utilisent vos données personnelles lorsque vous utilisez le site d’inscription.",
  updatedAt: "29 septembre 2026",
  sections: [
    {
      title: "1. Qui est responsable ?",
      paragraphs: [
        "Le traitement des données liées à l’inscription à l’événement TBB — Trail Bike Beer est assuré par l’organisation de l’événement, via la plateforme MultiTrack (opérateur technique).",
        `Pour toute question relative à vos données : ${ORGANIZER_CONTACTS.email} ou ${ORGANIZER_CONTACTS.phone}.`,
      ],
    },
    {
      title: "2. Données collectées",
      paragraphs: [
        "Lors de la création de compte et de l’inscription, nous pouvons collecter : identité (nom, prénom, date de naissance, sexe), coordonnées (e-mail, téléphone), informations sportives (course, catégorie), et documents nécessaires à la participation (pièce d’identité, certificat médical, autorisation parentale le cas échéant).",
        "Nous collectons également des données techniques utiles au fonctionnement du service (session de connexion, logs d’erreurs applicatifs anonymisés ou pseudonymisés lorsque possible).",
        "Les justificatifs de paiement (référence de transfert MVola / Orange Money) peuvent être associés à votre inscription pour validation par l’organisation.",
      ],
    },
    {
      title: "3. Finalités",
      paragraphs: [
        "Vos données sont utilisées pour : gérer votre compte et vos inscriptions ; vérifier l’éligibilité et la conformité réglementaire ; traiter et suivre les paiements ; communiquer des informations liées à l’événement ; assurer la sécurité et le bon fonctionnement de la plateforme.",
        "Elles ne sont pas vendues à des tiers à des fins publicitaires.",
      ],
    },
    {
      title: "4. Hébergement et prestataires",
      paragraphs: [
        "La plateforme MultiTrack est hébergée chez des prestataires d’infrastructure cloud. Les documents d’inscription (pièce d’identité, certificat médical, autorisation parentale) sont stockés de manière sécurisée via Google Drive, accessibles uniquement aux opérateurs autorisés de l’événement.",
        "L’authentification Google utilisée côté opérateur sert uniquement à l’accès technique au stockage documentaire ; elle n’implique pas que les participants se connectent avec Google pour s’inscrire.",
      ],
    },
    {
      title: "5. Conservation",
      paragraphs: [
        `Les données d’inscription sont conservées le temps nécessaire à l’organisation, au déroulement et aux suites administratives de l’événement ${EVENT_INFO.name} (${EVENT_INFO.dateLabel}, ${EVENT_INFO.location}), puis archivées ou supprimées selon les besoins légitimes de l’organisation et les obligations applicables.`,
        "Vous pouvez demander la suppression de votre compte ou de certaines données en contactant l’organisation aux coordonnées ci-dessus, sous réserve des obligations de conservation liées à l’événement.",
      ],
    },
    {
      title: "6. Vos droits",
      paragraphs: [
        "Selon le droit applicable, vous pouvez demander l’accès, la rectification, la limitation ou la suppression de vos données personnelles, ainsi que vous opposer à certains traitements.",
        "Pour exercer ces droits, écrivez à l’adresse e-mail indiquée. Nous répondrons dans un délai raisonnable.",
      ],
    },
    {
      title: "7. Sécurité",
      paragraphs: [
        "Nous mettons en œuvre des mesures techniques et organisationnelles adaptées (connexion authentifiée, accès restreint aux documents, journalisation des erreurs) pour protéger vos données contre l’accès non autorisé, la perte ou l’altération.",
        "Aucun système n’étant infaillible, nous vous invitons à utiliser un mot de passe robuste et à ne pas le partager.",
      ],
    },
    {
      title: "8. Mise à jour",
      paragraphs: [
        "Cette politique peut être mise à jour pour refléter l’évolution du service ou de la réglementation. La date de mise à jour figure en tête de page. En cas de changement substantiel, une information pourra être communiquée sur le site.",
      ],
    },
  ] satisfies LegalSection[],
} as const;

/** Conditions d’utilisation — contenu affiché sur /conditions. */
export const TERMS_OF_USE = {
  title: "Conditions d’utilisation",
  intro:
    "Les présentes conditions régissent l’accès et l’utilisation du site public MultiTrack dédié à l’événement TBB — Trail Bike Beer, notamment la création de compte et les inscriptions en ligne.",
  updatedAt: "29 septembre 2026",
  sections: [
    {
      title: "1. Objet du service",
      paragraphs: [
        "Le site permet de consulter les informations de l’événement, de créer un compte participant, de s’inscrire à une ou plusieurs courses, de transmettre les documents requis et de déclarer un paiement selon les modalités indiquées (MVola, Orange Money).",
        "MultiTrack fournit l’outil technique ; l’organisation de TBB reste responsable du contenu événementiel, de la validation des inscriptions et du déroulement de la course.",
      ],
    },
    {
      title: "2. Compte utilisateur",
      paragraphs: [
        "Vous vous engagez à fournir des informations exactes et à jour, et à maintenir la confidentialité de vos identifiants.",
        "Toute activité réalisée via votre compte est réputée effectuée sous votre responsabilité. Signalez sans délai toute utilisation frauduleuse à l’organisation.",
      ],
    },
    {
      title: "3. Inscription et documents",
      paragraphs: [
        "L’inscription n’est complète qu’après transmission des informations et documents demandés, et validation par l’organisation (y compris du paiement le cas échéant).",
        "Les documents fournis doivent être lisibles, authentiques et conformes au règlement de l’événement. L’organisation peut refuser ou suspendre une inscription en cas de non-conformité.",
        "Le règlement officiel de TBB et les éventuels modèles (autorisation parentale, etc.) font partie intégrante des règles de participation.",
      ],
    },
    {
      title: "4. Paiement",
      paragraphs: [
        "Les tarifs affichés sur le site sont ceux de l’événement. Le paiement s’effectue selon les moyens indiqués (notamment mobile money) ; le participant doit respecter le motif et les instructions de transfert communiqués lors de l’inscription.",
        "La validation du paiement est effectuée par l’organisation. Un paiement incomplet, erroné ou non identifiable peut entraîner le rejet ou la mise en attente de l’inscription.",
      ],
    },
    {
      title: "5. Usage acceptable",
      paragraphs: [
        "Vous vous interdisez toute utilisation frauduleuse, abusive ou illicite du site (usurpation d’identité, téléversement de contenus illicites, tentative d’intrusion, surcharge volontaire du service).",
        "L’organisation et MultiTrack peuvent suspendre un compte ou une inscription en cas de manquement.",
      ],
    },
    {
      title: "6. Disponibilité",
      paragraphs: [
        "Nous nous efforçons d’assurer la disponibilité du service, sans garantie d’accès ininterrompu. Des maintenances ou incidents (hébergement, stockage documentaire, réseau) peuvent temporairement limiter certaines fonctions, notamment le dépôt de documents.",
      ],
    },
    {
      title: "7. Propriété intellectuelle",
      paragraphs: [
        "Les contenus du site (textes, marques, logos MultiTrack et TBB, éléments graphiques) sont protégés. Toute reproduction non autorisée est interdite, hors usage personnel lié à votre participation.",
      ],
    },
    {
      title: "8. Responsabilité",
      paragraphs: [
        "Dans les limites autorisées par la loi, MultiTrack et l’organisation ne sauraient être tenus responsables des dommages indirects liés à l’usage du site, ni des décisions sportives ou organisationnelles propres à l’événement.",
        "La participation à TBB reste soumise au règlement de l’événement et aux consignes des organisateurs sur le terrain.",
      ],
    },
    {
      title: "9. Contact",
      paragraphs: [
        `Pour toute question relative à ces conditions ou à votre inscription : ${ORGANIZER_CONTACTS.email} · ${ORGANIZER_CONTACTS.phone}.`,
      ],
    },
    {
      title: "10. Modifications",
      paragraphs: [
        "Ces conditions peuvent être mises à jour. La version applicable est celle publiée sur cette page à la date d’utilisation du service. La date de mise à jour figure en tête de page.",
      ],
    },
  ] satisfies LegalSection[],
} as const;
