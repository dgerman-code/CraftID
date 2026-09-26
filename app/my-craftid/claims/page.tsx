import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";
import { addClaim, addSkillClaims } from "./actions";
import { localeQuery } from "@/lib/i18n";
import { workspaceLabel } from "@/lib/workspace-labels";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; entity?: string; error?: string; message?: string }> };

const copy = {
  en: {
    eyebrow: "Skills & claims", title: "Build your professional record claim by claim.",
    intro: "A claim is a specific statement about your professional practice. Evidence can be linked later to support that claim.",
    type: "Claim type", titleLabel: "Claim title", desc: "Description", visibility: "Visibility", public: "Public", private: "Private", add: "Add claim",
    list: "Your claims", empty: "No claims yet. Start with a skill, experience or qualification that matters to your professional record.",
    back: "Back to My CraftID", added: "Claim added.", status: "Status", describeSkill: "Describe skill",
    selectSkills: "Select professional skills",
    selectSkillsIntro: "Choose one or more skills from the CraftID taxonomy. Selected skills are added as structured self-declared claims and can later be supported by evidence.",
    saveSkills: "Add selected skills", skillsAdded: "Skills added.", additionalClaim: "Add another claim", customSkill: "Other skill (not yet in taxonomy)",
  },
  fr: {
    eyebrow: "Compétences et déclarations", title: "Construisez votre dossier professionnel déclaration par déclaration.",
    intro: "Une déclaration est une affirmation précise sur votre pratique professionnelle. Des preuves pourront ensuite y être associées.",
    type: "Type de déclaration", titleLabel: "Intitulé", desc: "Description", visibility: "Visibilité", public: "Public", private: "Privé", add: "Ajouter la déclaration",
    list: "Vos déclarations", empty: "Aucune déclaration pour le moment. Commencez par une compétence, une expérience ou une qualification importante pour votre dossier professionnel.",
    back: "Retour à Mon CraftID", added: "Déclaration ajoutée.", status: "Statut", describeSkill: "Décrire la compétence",
    selectSkills: "Sélectionner des compétences professionnelles",
    selectSkillsIntro: "Choisissez une ou plusieurs compétences dans la taxonomie CraftID. Elles sont ajoutées comme déclarations structurées autodéclarées et pourront ensuite être étayées par des preuves.",
    saveSkills: "Ajouter les compétences sélectionnées", skillsAdded: "Compétences ajoutées.", additionalClaim: "Ajouter une autre déclaration", customSkill: "Autre compétence (pas encore dans la taxonomie)",
  },
  de: {
    eyebrow: "Kompetenzen & Angaben", title: "Bauen Sie Ihren beruflichen Datensatz Angabe für Angabe auf.",
    intro: "Eine Angabe ist eine konkrete Aussage zu Ihrer beruflichen Tätigkeit. Später können Nachweise verknüpft werden, um sie zu stützen.",
    type: "Art der Angabe", titleLabel: "Titel der Angabe", desc: "Beschreibung", visibility: "Sichtbarkeit", public: "Öffentlich", private: "Privat", add: "Angabe hinzufügen",
    list: "Ihre Angaben", empty: "Noch keine Angaben. Beginnen Sie mit einer Kompetenz, Erfahrung oder Qualifikation, die für Ihren beruflichen Datensatz wichtig ist.",
    back: "Zurück zu Meine CraftID", added: "Angabe hinzugefügt.", status: "Status", describeSkill: "Kompetenz beschreiben",
    selectSkills: "Berufliche Kompetenzen auswählen",
    selectSkillsIntro: "Wählen Sie eine oder mehrere Kompetenzen aus der CraftID-Taxonomie. Ausgewählte Kompetenzen werden als strukturierte Selbstauskünfte hinzugefügt und können später durch Nachweise gestützt werden.",
    saveSkills: "Ausgewählte Kompetenzen hinzufügen", skillsAdded: "Kompetenzen hinzugefügt.", additionalClaim: "Weitere Angabe hinzufügen", customSkill: "Andere Kompetenz (noch nicht in der Taxonomie)",
  },
  nl: {
    eyebrow: "Vaardigheden & verklaringen", title: "Bouw uw professionele dossier verklaring voor verklaring op.",
    intro: "Een verklaring is een specifieke uitspraak over uw professionele praktijk. Bewijs kan later worden gekoppeld om die verklaring te ondersteunen.",
    type: "Type verklaring", titleLabel: "Titel van verklaring", desc: "Beschrijving", visibility: "Zichtbaarheid", public: "Publiek", private: "Privé", add: "Verklaring toevoegen",
    list: "Uw verklaringen", empty: "Nog geen verklaringen. Begin met een vaardigheid, ervaring of kwalificatie die belangrijk is voor uw professionele dossier.",
    back: "Terug naar Mijn CraftID", added: "Verklaring toegevoegd.", status: "Status", describeSkill: "Vaardigheid beschrijven",
    selectSkills: "Professionele vaardigheden selecteren",
    selectSkillsIntro: "Kies één of meer vaardigheden uit de CraftID-taxonomie. Geselecteerde vaardigheden worden toegevoegd als gestructureerde zelfverklaarde claims en kunnen later met bewijs worden ondersteund.",
    saveSkills: "Geselecteerde vaardigheden toevoegen", skillsAdded: "Vaardigheden toegevoegd.", additionalClaim: "Nog een verklaring toevoegen", customSkill: "Andere vaardigheid (nog niet in taxonomie)",
  },
  pl: {
    eyebrow: "Umiejętności i deklaracje", title: "Buduj zapis zawodowy deklaracja po deklaracji.",
    intro: "Deklaracja to konkretne stwierdzenie dotyczące Twojej praktyki zawodowej. Później można powiązać z nią dowody.",
    type: "Typ deklaracji", titleLabel: "Tytuł deklaracji", desc: "Opis", visibility: "Widoczność", public: "Publiczna", private: "Prywatna", add: "Dodaj deklarację",
    list: "Twoje deklaracje", empty: "Nie ma jeszcze deklaracji. Zacznij od umiejętności, doświadczenia lub kwalifikacji ważnej dla Twojego zapisu zawodowego.",
    back: "Wróć do Mój CraftID", added: "Deklaracja dodana.", status: "Status", describeSkill: "Opisz umiejętność",
    selectSkills: "Wybierz umiejętności zawodowe",
    selectSkillsIntro: "Wybierz jedną lub więcej umiejętności z taksonomii CraftID. Wybrane umiejętności są dodawane jako uporządkowane deklaracje własne i mogą później zostać poparte dowodami.",
    saveSkills: "Dodaj wybrane umiejętności", skillsAdded: "Umiejętności dodane.", additionalClaim: "Dodaj kolejną deklarację", customSkill: "Inna umiejętność (jeszcze poza taksonomią)",
  },
  it: {
    eyebrow: "Competenze e dichiarazioni", title: "Costruisci il tuo record professionale dichiarazione per dichiarazione.",
    intro: "Una dichiarazione è un’affermazione specifica sulla tua pratica professionale. In seguito possono essere collegate evidenze a supporto.",
    type: "Tipo di dichiarazione", titleLabel: "Titolo della dichiarazione", desc: "Descrizione", visibility: "Visibilità", public: "Pubblica", private: "Privata", add: "Aggiungi dichiarazione",
    list: "Le tue dichiarazioni", empty: "Nessuna dichiarazione. Inizia con una competenza, esperienza o qualifica importante per il tuo record professionale.",
    back: "Torna a Il mio CraftID", added: "Dichiarazione aggiunta.", status: "Stato", describeSkill: "Descrivi competenza",
    selectSkills: "Seleziona competenze professionali",
    selectSkillsIntro: "Scegli una o più competenze dalla tassonomia CraftID. Le competenze selezionate vengono aggiunte come dichiarazioni strutturate autodichiarate e potranno essere supportate da evidenze.",
    saveSkills: "Aggiungi competenze selezionate", skillsAdded: "Competenze aggiunte.", additionalClaim: "Aggiungi un’altra dichiarazione", customSkill: "Altra competenza (non ancora nella tassonomia)",
  },
  es: {
    eyebrow: "Competencias y declaraciones", title: "Construye tu registro profesional declaración por declaración.",
    intro: "Una declaración es una afirmación concreta sobre tu práctica profesional. Después pueden vincularse evidencias para respaldarla.",
    type: "Tipo de declaración", titleLabel: "Título de la declaración", desc: "Descripción", visibility: "Visibilidad", public: "Pública", private: "Privada", add: "Añadir declaración",
    list: "Tus declaraciones", empty: "Aún no hay declaraciones. Empieza por una competencia, experiencia o cualificación importante para tu registro profesional.",
    back: "Volver a Mi CraftID", added: "Declaración añadida.", status: "Estado", describeSkill: "Describir competencia",
    selectSkills: "Seleccionar competencias profesionales",
    selectSkillsIntro: "Elige una o más competencias de la taxonomía CraftID. Las competencias seleccionadas se añaden como declaraciones estructuradas autodeclaradas y podrán respaldarse después con evidencias.",
    saveSkills: "Añadir competencias seleccionadas", skillsAdded: "Competencias añadidas.", additionalClaim: "Añadir otra declaración", customSkill: "Otra competencia (aún fuera de la taxonomía)",
  },
  uk: {
    eyebrow: "Навички та твердження", title: "Формуйте професійний запис окремими твердженнями.",
    intro: "Твердження — це конкретна інформація про вашу професійну практику. Згодом до нього можна пов’язати докази.",
    type: "Тип твердження", titleLabel: "Назва твердження", desc: "Опис", visibility: "Видимість", public: "Публічне", private: "Приватне", add: "Додати твердження",
    list: "Ваші твердження", empty: "Тверджень ще немає. Почніть із навички, досвіду або кваліфікації, важливої для вашого професійного запису.",
    back: "Назад до Мій CraftID", added: "Твердження додано.", status: "Статус", describeSkill: "Описати навичку",
    selectSkills: "Оберіть професійні навички",
    selectSkillsIntro: "Оберіть одну або кілька навичок із таксономії CraftID. Вибрані навички додаються як структуровані самодекларовані твердження, до яких згодом можна додати докази.",
    saveSkills: "Додати вибрані навички", skillsAdded: "Навички додано.", additionalClaim: "Додати інше твердження", customSkill: "Інша навичка (ще не в таксономії)",
  },
} as const;

const claimTypeOptions = {
  en: { experience: "Experience", qualification: "Qualification", workshop_affiliation: "Workshop affiliation", external_recognition: "External recognition", origin: "Origin", craft_tradition: "Craft tradition" },
  fr: { experience: "Expérience", qualification: "Qualification", workshop_affiliation: "Affiliation à un atelier", external_recognition: "Reconnaissance externe", origin: "Origine", craft_tradition: "Tradition artisanale" },
  de: { experience: "Erfahrung", qualification: "Qualifikation", workshop_affiliation: "Werkstattzugehörigkeit", external_recognition: "Externe Anerkennung", origin: "Herkunft", craft_tradition: "Handwerkstradition" },
  nl: { experience: "Ervaring", qualification: "Kwalificatie", workshop_affiliation: "Werkplaatsrelatie", external_recognition: "Externe erkenning", origin: "Herkomst", craft_tradition: "Ambachtelijke traditie" },
  pl: { experience: "Doświadczenie", qualification: "Kwalifikacja", workshop_affiliation: "Powiązanie z pracownią", external_recognition: "Uznanie zewnętrzne", origin: "Pochodzenie", craft_tradition: "Tradycja rzemieślnicza" },
  it: { experience: "Esperienza", qualification: "Qualifica", workshop_affiliation: "Affiliazione al laboratorio", external_recognition: "Riconoscimento esterno", origin: "Origine", craft_tradition: "Tradizione artigianale" },
  es: { experience: "Experiencia", qualification: "Cualificación", workshop_affiliation: "Vinculación con taller", external_recognition: "Reconocimiento externo", origin: "Origen", craft_tradition: "Tradición artesanal" },
  uk: { experience: "Досвід", qualification: "Кваліфікація", workshop_affiliation: "Зв’язок із майстернею", external_recognition: "Зовнішнє визнання", origin: "Походження", craft_tradition: "Реміснича традиція" },
} as const;

export default async function ClaimsPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = localeFrom(params.lang);
  const t = copy[locale];
  const { supabase, userId, entity } = await getOwnedCraftId(params.entity);
  const q = entity ? ownerWorkspaceQuery(locale, entity.id) : localeQuery(locale);
  if (!userId) redirect(`/login${localeQuery(locale)}`);
  if (params.entity && !entity) redirect(`/my-craftid${localeQuery(locale)}`);
  if (!entity) redirect(`/onboarding${localeQuery(locale)}`);

  const [{ data: claims }, { data: skillTerms }] = await Promise.all([
    supabase.from("claims")
      .select("id, claim_type, title, description, visibility, status, created_at, taxonomy_term_id")
      .eq("entity_id", entity.id)
      .order("created_at", { ascending: false }),
    supabase.from("taxonomy_terms")
      .select("id, stable_key, label_en, label_uk")
      .eq("term_type", "skill")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const selectedSkillIds = new Set(
    (claims ?? [])
      .filter((claim) => claim.claim_type === "skill" && claim.taxonomy_term_id)
      .map((claim) => claim.taxonomy_term_id),
  );

  return (
    <main className="workspacePage">
      <div className="container">
        <Link className="backLink" href={`/my-craftid${q}`}>← {t.back}</Link>
        <div className="workspaceGrid">
          <section>
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>{t.title}</h1>
            <p className="workspaceIntro">{t.intro}</p>
            {params.error ? <p className="formMessage error">{params.error}</p> : null}
            {params.message ? <p className="formMessage">{params.message === "skills" ? t.skillsAdded : t.added}</p> : null}

            <section className="skillSelector">
              <div className="eyebrow">{t.selectSkills}</div>
              <p className="fieldHelp">{t.selectSkillsIntro}</p>
              <form action={addSkillClaims}>
                <input type="hidden" name="lang" value={locale} />
                <input type="hidden" name="entityId" value={entity.id} />
                <div className="skillOptionGrid">
                  {skillTerms?.map((term) => {
                    const label = locale === "uk" ? term.label_uk : term.label_en;
                    const selected = selectedSkillIds.has(term.id);
                    return (
                      <label className={selected ? "skillOption selected" : "skillOption"} key={term.id}>
                        <input type="checkbox" name="skillId" value={term.id} disabled={selected} defaultChecked={selected} />
                        <span>{label}</span>
                      </label>
                    );
                  })}
                </div>
                <button className="button buttonPrimary" type="submit">{t.saveSkills}</button>
              </form>
            </section>

            <div className="eyebrow secondaryFormEyebrow">{t.additionalClaim}</div>

            <form className="workspaceForm compactForm" action={addClaim}>
              <input type="hidden" name="lang" value={locale} />
                <input type="hidden" name="entityId" value={entity.id} />
              <label>{t.type}
                <select name="claimType" required defaultValue="skill">
                  <option value="skill">{t.customSkill}</option>
                  <option value="experience">{claimTypeOptions[locale].experience}</option>
                  <option value="qualification">{claimTypeOptions[locale].qualification}</option>
                  <option value="workshop_affiliation">{claimTypeOptions[locale].workshop_affiliation}</option>
                  <option value="external_recognition">{claimTypeOptions[locale].external_recognition}</option>
                  <option value="origin">{claimTypeOptions[locale].origin}</option>
                  <option value="craft_tradition">{claimTypeOptions[locale].craft_tradition}</option>
                </select>
              </label>
              <label>{t.titleLabel}<input name="title" required /></label>
              <label>{t.desc}<textarea name="description" rows={4} /></label>
              <label>{t.visibility}
                <select name="visibility" defaultValue="public">
                  <option value="public">{t.public}</option>
                  <option value="private">{t.private}</option>
                </select>
              </label>
              <button className="button buttonPrimary" type="submit">{t.add}</button>
            </form>
          </section>

          <aside className="workspaceList">
            <div className="eyebrow">{t.list}</div>
            {!claims?.length ? <p className="emptyState">{t.empty}</p> : claims.map((claim) => (
              <article className="claimItem" key={claim.id}>
                <span className="recordId">{workspaceLabel.claimType(locale, claim.claim_type)}</span>
                <h3>{claim.title}</h3>
                {claim.description ? <p>{claim.description}</p> : null}
                <div className="claimMeta">
                  <span>{t.status}: {workspaceLabel.claimStatus(locale, claim.status)}</span>
                  <span>{workspaceLabel.visibility(locale, claim.visibility)}</span>
                </div>
                {claim.claim_type === "skill" ? (
                  <Link className="claimAction" href={`/my-craftid/claims/${claim.id}${q}`}>
                    {t.describeSkill} →
                  </Link>
                ) : null}
              </article>
            ))}
          </aside>
        </div>
      </div>
    </main>
  );
}
