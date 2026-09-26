import type { Locale } from "@/lib/i18n";

type Labels = Record<string, string>;

function label(map: Record<Locale, Labels>, locale: Locale, value: string) {
  return map[locale][value] ?? map.en[value] ?? value.replaceAll("_", " ");
}

const claimTypes: Record<Locale, Labels> = {
  en: { identity:"Identity", skill:"Skill", experience:"Experience", qualification:"Qualification", workshop_affiliation:"Workshop affiliation", external_recognition:"External recognition", origin:"Origin", craft_tradition:"Craft tradition" },
  fr: { identity:"Identité", skill:"Compétence", experience:"Expérience", qualification:"Qualification", workshop_affiliation:"Affiliation à un atelier", external_recognition:"Reconnaissance externe", origin:"Origine", craft_tradition:"Tradition artisanale" },
  de: { identity:"Identität", skill:"Kompetenz", experience:"Erfahrung", qualification:"Qualifikation", workshop_affiliation:"Werkstattzugehörigkeit", external_recognition:"Externe Anerkennung", origin:"Herkunft", craft_tradition:"Handwerkstradition" },
  nl: { identity:"Identiteit", skill:"Vaardigheid", experience:"Ervaring", qualification:"Kwalificatie", workshop_affiliation:"Werkplaatsrelatie", external_recognition:"Externe erkenning", origin:"Herkomst", craft_tradition:"Ambachtelijke traditie" },
  pl: { identity:"Tożsamość", skill:"Umiejętność", experience:"Doświadczenie", qualification:"Kwalifikacja", workshop_affiliation:"Powiązanie z pracownią", external_recognition:"Uznanie zewnętrzne", origin:"Pochodzenie", craft_tradition:"Tradycja rzemieślnicza" },
  it: { identity:"Identità", skill:"Competenza", experience:"Esperienza", qualification:"Qualifica", workshop_affiliation:"Affiliazione al laboratorio", external_recognition:"Riconoscimento esterno", origin:"Origine", craft_tradition:"Tradizione artigianale" },
  es: { identity:"Identidad", skill:"Competencia", experience:"Experiencia", qualification:"Cualificación", workshop_affiliation:"Vinculación con taller", external_recognition:"Reconocimiento externo", origin:"Origen", craft_tradition:"Tradición artesanal" },
  uk: { identity:"Ідентичність", skill:"Навичка", experience:"Досвід", qualification:"Кваліфікація", workshop_affiliation:"Зв’язок із майстернею", external_recognition:"Зовнішнє визнання", origin:"Походження", craft_tradition:"Реміснича традиція" },
};

const claimStatuses: Record<Locale, Labels> = {
  en: { self_declared:"Self-declared", evidence_submitted:"Evidence submitted", document_reviewed:"Document reviewed", evidence_reviewed:"Evidence reviewed", external_source_confirmed:"External source confirmed", identity_reviewed:"Identity reviewed" },
  fr: { self_declared:"Autodéclaré", evidence_submitted:"Preuve soumise", document_reviewed:"Document examiné", evidence_reviewed:"Preuve examinée", external_source_confirmed:"Source externe confirmée", identity_reviewed:"Identité examinée" },
  de: { self_declared:"Selbstauskunft", evidence_submitted:"Nachweis eingereicht", document_reviewed:"Dokument geprüft", evidence_reviewed:"Nachweis geprüft", external_source_confirmed:"Externe Quelle bestätigt", identity_reviewed:"Identität geprüft" },
  nl: { self_declared:"Zelfverklaard", evidence_submitted:"Bewijs ingediend", document_reviewed:"Document beoordeeld", evidence_reviewed:"Bewijs beoordeeld", external_source_confirmed:"Externe bron bevestigd", identity_reviewed:"Identiteit beoordeeld" },
  pl: { self_declared:"Deklaracja własna", evidence_submitted:"Dowód przesłany", document_reviewed:"Dokument sprawdzony", evidence_reviewed:"Dowód sprawdzony", external_source_confirmed:"Źródło zewnętrzne potwierdzone", identity_reviewed:"Tożsamość sprawdzona" },
  it: { self_declared:"Autodichiarato", evidence_submitted:"Evidenza inviata", document_reviewed:"Documento revisionato", evidence_reviewed:"Evidenza revisionata", external_source_confirmed:"Fonte esterna confermata", identity_reviewed:"Identità revisionata" },
  es: { self_declared:"Autodeclarado", evidence_submitted:"Evidencia enviada", document_reviewed:"Documento revisado", evidence_reviewed:"Evidencia revisada", external_source_confirmed:"Fuente externa confirmada", identity_reviewed:"Identidad revisada" },
  uk: { self_declared:"Самодекларовано", evidence_submitted:"Доказ подано", document_reviewed:"Документ перевірено", evidence_reviewed:"Доказ перевірено", external_source_confirmed:"Зовнішнє джерело підтверджено", identity_reviewed:"Ідентичність перевірено" },
};

const visibility: Record<Locale, Labels> = {
  en:{ public:"Public", private:"Private" }, fr:{ public:"Public", private:"Privé" }, de:{ public:"Öffentlich", private:"Privat" },
  nl:{ public:"Publiek", private:"Privé" }, pl:{ public:"Publiczna", private:"Prywatna" }, it:{ public:"Pubblica", private:"Privata" },
  es:{ public:"Pública", private:"Privada" }, uk:{ public:"Публічне", private:"Приватне" },
};

const evidenceTypes: Record<Locale, Labels> = {
  en:{ qualification_document:"Qualification document", experience_document:"Experience document", identity_document:"Identity document", business_registration:"Business registration", portfolio_evidence:"Portfolio evidence", external_reference:"External reference", other:"Other" },
  fr:{ qualification_document:"Document de qualification", experience_document:"Document d’expérience", identity_document:"Document d’identité", business_registration:"Enregistrement d’entreprise", portfolio_evidence:"Élément de portfolio", external_reference:"Référence externe", other:"Autre" },
  de:{ qualification_document:"Qualifikationsnachweis", experience_document:"Erfahrungsnachweis", identity_document:"Identitätsdokument", business_registration:"Unternehmensregistrierung", portfolio_evidence:"Portfolio-Nachweis", external_reference:"Externe Referenz", other:"Sonstiges" },
  nl:{ qualification_document:"Kwalificatiedocument", experience_document:"Ervaringsdocument", identity_document:"Identiteitsdocument", business_registration:"Bedrijfsregistratie", portfolio_evidence:"Portfoliobewijs", external_reference:"Externe referentie", other:"Anders" },
  pl:{ qualification_document:"Dokument kwalifikacji", experience_document:"Dokument doświadczenia", identity_document:"Dokument tożsamości", business_registration:"Rejestracja działalności", portfolio_evidence:"Materiał portfolio", external_reference:"Źródło zewnętrzne", other:"Inne" },
  it:{ qualification_document:"Documento di qualifica", experience_document:"Documento di esperienza", identity_document:"Documento d’identità", business_registration:"Registrazione dell’attività", portfolio_evidence:"Evidenza di portfolio", external_reference:"Riferimento esterno", other:"Altro" },
  es:{ qualification_document:"Documento de cualificación", experience_document:"Documento de experiencia", identity_document:"Documento de identidad", business_registration:"Registro empresarial", portfolio_evidence:"Evidencia de portfolio", external_reference:"Referencia externa", other:"Otro" },
  uk:{ qualification_document:"Документ про кваліфікацію", experience_document:"Документ про досвід", identity_document:"Документ для підтвердження особи", business_registration:"Реєстрація бізнесу", portfolio_evidence:"Матеріал портфоліо", external_reference:"Зовнішнє джерело", other:"Інше" },
};

const evidenceStatuses: Record<Locale, Labels> = {
  en:{ submitted:"Submitted", under_review:"Under review", reviewed:"Reviewed", needs_clarification:"Needs clarification", rejected:"Rejected" },
  fr:{ submitted:"Soumise", under_review:"En cours d’examen", reviewed:"Examinée", needs_clarification:"Clarification requise", rejected:"Rejetée" },
  de:{ submitted:"Eingereicht", under_review:"In Prüfung", reviewed:"Geprüft", needs_clarification:"Klärung erforderlich", rejected:"Abgelehnt" },
  nl:{ submitted:"Ingediend", under_review:"In beoordeling", reviewed:"Beoordeeld", needs_clarification:"Verduidelijking nodig", rejected:"Afgewezen" },
  pl:{ submitted:"Przesłany", under_review:"W trakcie przeglądu", reviewed:"Sprawdzony", needs_clarification:"Wymaga wyjaśnienia", rejected:"Odrzucony" },
  it:{ submitted:"Inviata", under_review:"In revisione", reviewed:"Revisionata", needs_clarification:"Richiede chiarimenti", rejected:"Respinta" },
  es:{ submitted:"Enviada", under_review:"En revisión", reviewed:"Revisada", needs_clarification:"Requiere aclaración", rejected:"Rechazada" },
  uk:{ submitted:"Подано", under_review:"На перевірці", reviewed:"Перевірено", needs_clarification:"Потрібне уточнення", rejected:"Відхилено" },
};

const referralTypes: Record<Locale, Labels> = {
  en:{ project:"Project", partnership:"Partnership", training:"Training", commission:"Commission", research:"Research", restoration:"Restoration", other:"Other" },
  fr:{ project:"Projet", partnership:"Partenariat", training:"Formation", commission:"Commande", research:"Recherche", restoration:"Restauration", other:"Autre" },
  de:{ project:"Projekt", partnership:"Partnerschaft", training:"Schulung", commission:"Auftrag", research:"Forschung", restoration:"Restaurierung", other:"Sonstiges" },
  nl:{ project:"Project", partnership:"Partnerschap", training:"Opleiding", commission:"Opdracht", research:"Onderzoek", restoration:"Restauratie", other:"Anders" },
  pl:{ project:"Projekt", partnership:"Partnerstwo", training:"Szkolenie", commission:"Zlecenie", research:"Badania", restoration:"Restauracja", other:"Inne" },
  it:{ project:"Progetto", partnership:"Partnership", training:"Formazione", commission:"Incarico", research:"Ricerca", restoration:"Restauro", other:"Altro" },
  es:{ project:"Proyecto", partnership:"Alianza", training:"Formación", commission:"Encargo", research:"Investigación", restoration:"Restauración", other:"Otro" },
  uk:{ project:"Проєкт", partnership:"Партнерство", training:"Навчання", commission:"Замовлення", research:"Дослідження", restoration:"Реставрація", other:"Інше" },
};

const referralStatuses: Record<Locale, Labels> = {
  en:{ invited:"Invited", accepted:"Accepted", declined:"Declined", withdrawn:"Withdrawn", closed:"Closed" },
  fr:{ invited:"Invité", accepted:"Accepté", declined:"Refusé", withdrawn:"Retiré", closed:"Clos" },
  de:{ invited:"Eingeladen", accepted:"Angenommen", declined:"Abgelehnt", withdrawn:"Zurückgezogen", closed:"Geschlossen" },
  nl:{ invited:"Uitgenodigd", accepted:"Geaccepteerd", declined:"Afgewezen", withdrawn:"Ingetrokken", closed:"Gesloten" },
  pl:{ invited:"Zaproszenie", accepted:"Przyjęte", declined:"Odrzucone", withdrawn:"Wycofane", closed:"Zamknięte" },
  it:{ invited:"Invitato", accepted:"Accettato", declined:"Rifiutato", withdrawn:"Ritirato", closed:"Chiuso" },
  es:{ invited:"Invitado", accepted:"Aceptado", declined:"Rechazado", withdrawn:"Retirado", closed:"Cerrado" },
  uk:{ invited:"Запрошено", accepted:"Прийнято", declined:"Відхилено", withdrawn:"Відкликано", closed:"Закрито" },
};

const requestStatuses: Record<Locale, Labels> = {
  en:{ pending:"Pending", accepted:"Accepted", declined:"Declined", closed:"Closed", spam:"Spam" },
  fr:{ pending:"En attente", accepted:"Acceptée", declined:"Refusée", closed:"Close", spam:"Spam" },
  de:{ pending:"Ausstehend", accepted:"Angenommen", declined:"Abgelehnt", closed:"Geschlossen", spam:"Spam" },
  nl:{ pending:"In behandeling", accepted:"Geaccepteerd", declined:"Afgewezen", closed:"Gesloten", spam:"Spam" },
  pl:{ pending:"Oczekująca", accepted:"Przyjęta", declined:"Odrzucona", closed:"Zamknięta", spam:"Spam" },
  it:{ pending:"In attesa", accepted:"Accettata", declined:"Rifiutata", closed:"Chiusa", spam:"Spam" },
  es:{ pending:"Pendiente", accepted:"Aceptada", declined:"Rechazada", closed:"Cerrada", spam:"Spam" },
  uk:{ pending:"Очікує", accepted:"Прийнято", declined:"Відхилено", closed:"Закрито", spam:"Спам" },
};

const requestPurposes: Record<Locale, Labels> = {
  en:{ professional_enquiry:"Professional enquiry", institutional_partnership:"Institutional partnership", project_invitation:"Project invitation", training:"Training", commission:"Commission", other:"Other" },
  fr:{ professional_enquiry:"Demande professionnelle", institutional_partnership:"Partenariat institutionnel", project_invitation:"Invitation à un projet", training:"Formation", commission:"Commande", other:"Autre" },
  de:{ professional_enquiry:"Berufliche Anfrage", institutional_partnership:"Institutionelle Partnerschaft", project_invitation:"Projekteinladung", training:"Schulung", commission:"Auftrag", other:"Sonstiges" },
  nl:{ professional_enquiry:"Professionele vraag", institutional_partnership:"Institutioneel partnerschap", project_invitation:"Projectuitnodiging", training:"Opleiding", commission:"Opdracht", other:"Anders" },
  pl:{ professional_enquiry:"Zapytanie zawodowe", institutional_partnership:"Partnerstwo instytucjonalne", project_invitation:"Zaproszenie do projektu", training:"Szkolenie", commission:"Zlecenie", other:"Inne" },
  it:{ professional_enquiry:"Richiesta professionale", institutional_partnership:"Partnership istituzionale", project_invitation:"Invito a progetto", training:"Formazione", commission:"Incarico", other:"Altro" },
  es:{ professional_enquiry:"Consulta profesional", institutional_partnership:"Alianza institucional", project_invitation:"Invitación a proyecto", training:"Formación", commission:"Encargo", other:"Otro" },
  uk:{ professional_enquiry:"Професійний запит", institutional_partnership:"Інституційне партнерство", project_invitation:"Запрошення до проєкту", training:"Навчання", commission:"Замовлення", other:"Інше" },
};

const contactTypes: Record<Locale, Labels> = {
  en:{ professional_email:"Professional email", phone:"Phone", website:"Website", linkedin:"LinkedIn", portfolio:"Portfolio" },
  fr:{ professional_email:"E-mail professionnel", phone:"Téléphone", website:"Site web", linkedin:"LinkedIn", portfolio:"Portfolio" },
  de:{ professional_email:"Berufliche E-Mail", phone:"Telefon", website:"Website", linkedin:"LinkedIn", portfolio:"Portfolio" },
  nl:{ professional_email:"Professioneel e-mailadres", phone:"Telefoon", website:"Website", linkedin:"LinkedIn", portfolio:"Portfolio" },
  pl:{ professional_email:"E-mail zawodowy", phone:"Telefon", website:"Strona internetowa", linkedin:"LinkedIn", portfolio:"Portfolio" },
  it:{ professional_email:"E-mail professionale", phone:"Telefono", website:"Sito web", linkedin:"LinkedIn", portfolio:"Portfolio" },
  es:{ professional_email:"Correo profesional", phone:"Teléfono", website:"Sitio web", linkedin:"LinkedIn", portfolio:"Portfolio" },
  uk:{ professional_email:"Професійний email", phone:"Телефон", website:"Вебсайт", linkedin:"LinkedIn", portfolio:"Портфоліо" },
};

export const workspaceLabel = {
  claimType: (locale: Locale, value: string) => label(claimTypes, locale, value),
  claimStatus: (locale: Locale, value: string) => label(claimStatuses, locale, value),
  visibility: (locale: Locale, value: string) => label(visibility, locale, value),
  evidenceType: (locale: Locale, value: string) => label(evidenceTypes, locale, value),
  evidenceStatus: (locale: Locale, value: string) => label(evidenceStatuses, locale, value),
  referralType: (locale: Locale, value: string) => label(referralTypes, locale, value),
  referralStatus: (locale: Locale, value: string) => label(referralStatuses, locale, value),
  requestStatus: (locale: Locale, value: string) => label(requestStatuses, locale, value),
  requestPurpose: (locale: Locale, value: string) => label(requestPurposes, locale, value),
  contactType: (locale: Locale, value: string) => label(contactTypes, locale, value),
};
