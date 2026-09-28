import type { Locale } from "@/lib/i18n";

export const claimStageRank: Record<string, number> = {
  self_declared: 0,
  evidence_submitted: 1,
  identity_reviewed: 2,
  document_reviewed: 3,
  evidence_reviewed: 4,
  external_source_confirmed: 5,
};

export const claimStageCopy: Record<Locale, Record<string, string>> = {
  en: {
    self_declared: "Self-declared",
    evidence_submitted: "Evidence submitted",
    document_reviewed: "Document reviewed",
    evidence_reviewed: "Evidence reviewed",
    external_source_confirmed: "External source confirmed",
    identity_reviewed: "Identity reviewed",
  },
  fr: {
    self_declared: "Autodéclaré",
    evidence_submitted: "Preuves soumises",
    document_reviewed: "Document examiné",
    evidence_reviewed: "Preuves examinées",
    external_source_confirmed: "Source externe confirmée",
    identity_reviewed: "Identité examinée",
  },
  de: {
    self_declared: "Selbst angegeben",
    evidence_submitted: "Nachweise eingereicht",
    document_reviewed: "Dokument geprüft",
    evidence_reviewed: "Nachweise geprüft",
    external_source_confirmed: "Externe Quelle bestätigt",
    identity_reviewed: "Identität geprüft",
  },
  nl: {
    self_declared: "Zelfverklaard",
    evidence_submitted: "Bewijs ingediend",
    document_reviewed: "Document beoordeeld",
    evidence_reviewed: "Bewijs beoordeeld",
    external_source_confirmed: "Externe bron bevestigd",
    identity_reviewed: "Identiteit beoordeeld",
  },
  pl: {
    self_declared: "Zadeklarowane samodzielnie",
    evidence_submitted: "Dowody złożone",
    document_reviewed: "Dokument przejrzany",
    evidence_reviewed: "Dowody przejrzane",
    external_source_confirmed: "Źródło zewnętrzne potwierdzone",
    identity_reviewed: "Tożsamość przejrzana",
  },
  it: {
    self_declared: "Autodichiarato",
    evidence_submitted: "Evidenze presentate",
    document_reviewed: "Documento revisionato",
    evidence_reviewed: "Evidenze revisionate",
    external_source_confirmed: "Fonte esterna confermata",
    identity_reviewed: "Identità revisionata",
  },
  es: {
    self_declared: "Autodeclarado",
    evidence_submitted: "Evidencias presentadas",
    document_reviewed: "Documento revisado",
    evidence_reviewed: "Evidencias revisadas",
    external_source_confirmed: "Fuente externa confirmada",
    identity_reviewed: "Identidad revisada",
  },
  uk: {
    self_declared: "Самодекларовано",
    evidence_submitted: "Докази подано",
    document_reviewed: "Документ переглянуто",
    evidence_reviewed: "Докази переглянуто",
    external_source_confirmed: "Зовнішнє джерело підтверджено",
    identity_reviewed: "Особу перевірено",
  },
};

export type PublicClaimStage = {
  claim_type: string;
  status: string;
};

export function claimStageLabel(locale: Locale, status: string) {
  return claimStageCopy[locale][status] ?? status.replaceAll("_", " ");
}

export function strongestPublicClaimStage(claims: PublicClaimStage[]) {
  const relevant = claims.filter((claim) => claim.claim_type !== "identity");
  if (!relevant.length) return null;

  return [...relevant].sort(
    (a, b) =>
      (claimStageRank[b.status] ?? -1) - (claimStageRank[a.status] ?? -1),
  )[0]?.status ?? null;
}
