import Link from "next/link";
import { redirect } from "next/navigation";
import { localeFrom } from "@/components/site-shell";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { saveSupportProfile } from "./actions";
import { localeQuery } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ lang?: string; entity?: string; error?: string; message?: string }>;
};

const copy = {
  en: {
    eyebrow: "Opportunities & Support", title: "Tell us what would help your professional practice.",
    intro: "Select the areas that interest you now. This is a self-declared support profile, not an application and not an eligibility assessment. You can change it at any time.",
    privateNote: "These selections are not shown on your public CraftID profile. CraftID uses them for internal needs analysis and, where you explicitly allow it, to contact you about relevant support.",
    level: "Current interest", notInterested: "Not currently interested", interested: "Interested", active: "Actively looking",
    note: "Optional details", notePlaceholder: "Briefly describe what you are looking for, if useful.",
    contact: "CraftID or the authorised national operator may contact me about support relevant to the interests I selected.",
    contactHelp: "This does not share your data with external partners. Any future partner-facing matching or data-sharing flow will require its own rules and controls.",
    save: "Save support profile", saved: "Support profile saved.", back: "Back to My CraftID",
  },
  fr: {
    eyebrow: "Opportunités et soutien", title: "Indiquez-nous ce qui pourrait aider votre pratique professionnelle.",
    intro: "Sélectionnez les domaines qui vous intéressent actuellement. Il s’agit d’un profil de besoins autodéclaré, pas d’une candidature ni d’une évaluation d’éligibilité. Vous pouvez le modifier à tout moment.",
    privateNote: "Ces choix ne sont pas affichés sur votre profil public CraftID. CraftID les utilise pour l’analyse interne des besoins et, si vous l’autorisez explicitement, pour vous contacter au sujet d’un soutien pertinent.",
    level: "Intérêt actuel", notInterested: "Pas intéressé actuellement", interested: "Intéressé", active: "Recherche active",
    note: "Précisions facultatives", notePlaceholder: "Décrivez brièvement ce que vous recherchez, si utile.",
    contact: "CraftID ou l’opérateur national autorisé peut me contacter au sujet d’un soutien pertinent pour les intérêts sélectionnés.",
    contactHelp: "Cela ne partage pas vos données avec des partenaires externes. Tout futur processus de mise en relation ou partage de données avec des partenaires aura ses propres règles et contrôles.",
    save: "Enregistrer le profil de soutien", saved: "Profil de soutien enregistré.", back: "Retour à Mon CraftID",
  },
  de: {
    eyebrow: "Möglichkeiten & Unterstützung", title: "Teilen Sie uns mit, was Ihre berufliche Tätigkeit unterstützen würde.",
    intro: "Wählen Sie die Bereiche aus, die Sie derzeit interessieren. Dies ist ein selbst erklärtes Unterstützungsprofil, kein Antrag und keine Förderfähigkeitsprüfung. Sie können es jederzeit ändern.",
    privateNote: "Diese Auswahl wird nicht in Ihrem öffentlichen CraftID-Profil angezeigt. CraftID nutzt sie für interne Bedarfsanalysen und – wenn Sie ausdrücklich zustimmen – um Sie zu passender Unterstützung zu kontaktieren.",
    level: "Aktuelles Interesse", notInterested: "Derzeit nicht interessiert", interested: "Interessiert", active: "Aktiv auf der Suche",
    note: "Optionale Details", notePlaceholder: "Beschreiben Sie kurz, wonach Sie suchen, wenn hilfreich.",
    contact: "CraftID oder der autorisierte nationale Betreiber darf mich zu Unterstützung kontaktieren, die zu meinen ausgewählten Interessen passt.",
    contactHelp: "Dadurch werden Ihre Daten nicht mit externen Partnern geteilt. Künftige Matching- oder Datenfreigabeprozesse gegenüber Partnern benötigen eigene Regeln und Kontrollen.",
    save: "Unterstützungsprofil speichern", saved: "Unterstützungsprofil gespeichert.", back: "Zurück zu Meine CraftID",
  },
  nl: {
    eyebrow: "Kansen & ondersteuning", title: "Vertel ons wat uw professionele praktijk zou helpen.",
    intro: "Selecteer de gebieden die u nu interesseren. Dit is een zelfverklaard ondersteuningsprofiel, geen aanvraag en geen beoordeling van geschiktheid. U kunt het altijd aanpassen.",
    privateNote: "Deze keuzes worden niet op uw openbare CraftID-profiel getoond. CraftID gebruikt ze voor interne behoefteanalyse en, waar u dit uitdrukkelijk toestaat, om contact op te nemen over relevante ondersteuning.",
    level: "Huidige interesse", notInterested: "Momenteel niet geïnteresseerd", interested: "Geïnteresseerd", active: "Actief op zoek",
    note: "Optionele details", notePlaceholder: "Beschrijf kort wat u zoekt, indien nuttig.",
    contact: "CraftID of de bevoegde nationale operator mag contact met mij opnemen over ondersteuning die relevant is voor mijn geselecteerde interesses.",
    contactHelp: "Dit deelt uw gegevens niet met externe partners. Elke toekomstige matching- of gegevensdelingsstroom richting partners krijgt eigen regels en controles.",
    save: "Ondersteuningsprofiel opslaan", saved: "Ondersteuningsprofiel opgeslagen.", back: "Terug naar Mijn CraftID",
  },
  pl: {
    eyebrow: "Możliwości i wsparcie", title: "Powiedz nam, co mogłoby pomóc w Twojej praktyce zawodowej.",
    intro: "Wybierz obszary, które interesują Cię teraz. To samodzielnie deklarowany profil potrzeb, a nie wniosek ani ocena kwalifikowalności. Możesz go zmienić w dowolnym momencie.",
    privateNote: "Te wybory nie są wyświetlane w publicznym profilu CraftID. CraftID wykorzystuje je do wewnętrznej analizy potrzeb oraz – jeśli wyraźnie na to pozwolisz – do kontaktowania się w sprawie odpowiedniego wsparcia.",
    level: "Aktualne zainteresowanie", notInterested: "Obecnie mnie nie interesuje", interested: "Interesuje mnie", active: "Aktywnie szukam",
    note: "Opcjonalne szczegóły", notePlaceholder: "Krótko opisz, czego szukasz, jeśli to pomocne.",
    contact: "CraftID lub upoważniony operator krajowy może kontaktować się ze mną w sprawie wsparcia związanego z wybranymi zainteresowaniami.",
    contactHelp: "Nie oznacza to udostępniania danych partnerom zewnętrznym. Każdy przyszły proces dopasowywania lub udostępniania danych partnerom będzie miał odrębne zasady i kontrole.",
    save: "Zapisz profil wsparcia", saved: "Profil wsparcia zapisany.", back: "Wróć do Mój CraftID",
  },
  it: {
    eyebrow: "Opportunità e supporto", title: "Dicci cosa potrebbe aiutare la tua pratica professionale.",
    intro: "Seleziona le aree che ti interessano ora. È un profilo di supporto autodichiarato, non una candidatura né una valutazione di ammissibilità. Puoi modificarlo in qualsiasi momento.",
    privateNote: "Queste selezioni non sono mostrate nel profilo pubblico CraftID. CraftID le usa per l’analisi interna dei bisogni e, se lo autorizzi esplicitamente, per contattarti in merito a supporto pertinente.",
    level: "Interesse attuale", notInterested: "Non interessato al momento", interested: "Interessato", active: "Ricerca attiva",
    note: "Dettagli facoltativi", notePlaceholder: "Descrivi brevemente cosa stai cercando, se utile.",
    contact: "CraftID o l’operatore nazionale autorizzato può contattarmi per supporto pertinente agli interessi selezionati.",
    contactHelp: "Questo non condivide i tuoi dati con partner esterni. Ogni futuro processo di matching o condivisione dati con partner avrà regole e controlli propri.",
    save: "Salva profilo di supporto", saved: "Profilo di supporto salvato.", back: "Torna a Il mio CraftID",
  },
  es: {
    eyebrow: "Oportunidades y apoyo", title: "Cuéntanos qué ayudaría a tu práctica profesional.",
    intro: "Selecciona las áreas que te interesan ahora. Este es un perfil de apoyo autodeclarado, no una solicitud ni una evaluación de elegibilidad. Puedes cambiarlo en cualquier momento.",
    privateNote: "Estas selecciones no se muestran en tu perfil público CraftID. CraftID las utiliza para análisis interno de necesidades y, cuando lo autorizas expresamente, para contactarte sobre apoyo relevante.",
    level: "Interés actual", notInterested: "No me interesa actualmente", interested: "Me interesa", active: "Buscando activamente",
    note: "Detalles opcionales", notePlaceholder: "Describe brevemente qué estás buscando, si resulta útil.",
    contact: "CraftID o el operador nacional autorizado puede contactarme sobre apoyo relevante para los intereses seleccionados.",
    contactHelp: "Esto no comparte tus datos con socios externos. Cualquier futuro proceso de matching o intercambio de datos con socios tendrá sus propias reglas y controles.",
    save: "Guardar perfil de apoyo", saved: "Perfil de apoyo guardado.", back: "Volver a Mi CraftID",
  },
  uk: {
    eyebrow: "Можливості та підтримка", title: "Розкажіть, що може допомогти вашій професійній діяльності.",
    intro: "Оберіть напрями, які вас цікавлять зараз. Це самодекларований профіль потреб, а не заявка і не оцінка відповідності програмі. Ви можете змінити його будь-коли.",
    privateNote: "Ці дані не показуються у вашому публічному профілі CraftID. CraftID використовує їх для внутрішнього аналізу потреб і, лише за вашою окремою згодою, для зв’язку щодо релевантної підтримки.",
    level: "Поточний інтерес", notInterested: "Зараз не цікавить", interested: "Цікавить", active: "Активно шукаю",
    note: "Додаткове пояснення", notePlaceholder: "Коротко опишіть, що саме ви шукаєте, якщо це корисно.",
    contact: "CraftID або уповноважений національний оператор може зв’язуватися зі мною щодо підтримки, релевантної обраним інтересам.",
    contactHelp: "Це не означає передачу ваших даних зовнішнім партнерам. Майбутній matching або передача даних партнерам матимуть окремі правила та контроль.",
    save: "Зберегти профіль підтримки", saved: "Профіль підтримки збережено.", back: "Назад до Мій CraftID",
  },
} as const;

const supportCategoryCopy = {
  fr: {
    funding_finance: ["Financement et soutien financier", "Subventions, chèques, aides, prêts, financement d’équipement et autres soutiens financiers."],
    business_advisory: ["Soutien et conseil aux entreprises", "Planification, tarification, numérisation, conseil juridique ou opérationnel."],
    certification_standards: ["Certification, normes et conformité", "Conseils sur la certification, les exigences produits, les essais, les normes et la conformité."],
    training_skills: ["Formation et développement des compétences", "Développement des compétences techniques, numériques, entrepreneuriales, de gestion et autres."],
    partnerships: ["Partenariats et coopération", "Coopération avec artisans, ateliers, designers, fournisseurs, institutions ou autres partenaires."],
    markets_export: ["Marchés, ventes et export", "Salons, marketplaces, acheteurs B2B, distributeurs, export et soutien à l’internationalisation."],
    production_equipment: ["Production, espace de travail et équipement", "Équipement, machines, ateliers partagés, capacité de production, logistique ou infrastructure."],
    innovation_sustainability: ["Innovation et durabilité", "Fabrication numérique, nouvelles technologies, efficacité énergétique, production circulaire et matériaux durables."],
  },
  de: {
    funding_finance: ["Finanzierung & finanzielle Unterstützung", "Zuschüsse, Gutscheine, Förderungen, Darlehen, Ausrüstungsfinanzierung und weitere finanzielle Unterstützung."],
    business_advisory: ["Unternehmensunterstützung & Beratung", "Geschäftsplanung, Preisgestaltung, Digitalisierung sowie rechtliche oder operative Beratung."],
    certification_standards: ["Zertifizierung, Standards & Compliance", "Beratung zu Zertifizierung, Produktanforderungen, Prüfungen, Standards und Compliance."],
    training_skills: ["Schulung & Kompetenzentwicklung", "Technische, digitale, unternehmerische, Management- und weitere Kompetenzentwicklung."],
    partnerships: ["Partnerschaften & Zusammenarbeit", "Zusammenarbeit mit Handwerksprofis, Werkstätten, Designern, Lieferanten, Institutionen oder anderen Partnern."],
    markets_export: ["Märkte, Vertrieb & Export", "Messen, Marktplätze, B2B-Käufer, Vertriebspartner, Export und Internationalisierungsunterstützung."],
    production_equipment: ["Produktion, Arbeitsraum & Ausstattung", "Ausrüstung, Maschinen, geteilte Werkstätten, Produktionskapazität, Logistik oder Infrastruktur."],
    innovation_sustainability: ["Innovation & Nachhaltigkeit", "Digitale Fertigung, neue Technologien, Energieeffizienz, Kreislaufproduktion und nachhaltige Materialien."],
  },
  nl: {
    funding_finance: ["Financiering & financiële ondersteuning", "Subsidies, vouchers, tegemoetkomingen, leningen, apparatuurfinanciering en andere financiële ondersteuning."],
    business_advisory: ["Bedrijfsondersteuning & advies", "Bedrijfsplanning, prijsstelling, digitalisering, juridisch of operationeel advies."],
    certification_standards: ["Certificering, normen & compliance", "Begeleiding rond certificering, productvereisten, testen, normen en compliance."],
    training_skills: ["Opleiding & vaardighedenontwikkeling", "Technische, digitale, ondernemerschaps-, management- en andere vaardighedenontwikkeling."],
    partnerships: ["Partnerschappen & samenwerking", "Samenwerking met ambachtsprofessionals, werkplaatsen, ontwerpers, leveranciers, instellingen of andere partners."],
    markets_export: ["Markten, verkoop & export", "Beurzen, marketplaces, B2B-kopers, distributeurs, export en internationaliseringsondersteuning."],
    production_equipment: ["Productie, werkruimte & apparatuur", "Apparatuur, machines, gedeelde werkplaatsen, productiecapaciteit, logistiek of infrastructuur."],
    innovation_sustainability: ["Innovatie & duurzaamheid", "Digitale fabricage, nieuwe technologieën, energie-efficiëntie, circulaire productie en duurzame materialen."],
  },
  pl: {
    funding_finance: ["Finansowanie i wsparcie finansowe", "Granty, vouchery, dotacje, pożyczki, finansowanie sprzętu i inne formy wsparcia finansowego."],
    business_advisory: ["Wsparcie biznesowe i doradztwo", "Planowanie biznesowe, wycena, cyfryzacja oraz doradztwo prawne lub operacyjne."],
    certification_standards: ["Certyfikacja, normy i zgodność", "Wsparcie dotyczące certyfikacji, wymagań produktowych, testów, norm i zgodności."],
    training_skills: ["Szkolenia i rozwój umiejętności", "Rozwój umiejętności technicznych, cyfrowych, przedsiębiorczych, zarządczych i innych."],
    partnerships: ["Partnerstwa i współpraca", "Współpraca z rzemieślnikami, pracowniami, projektantami, dostawcami, instytucjami i innymi partnerami."],
    markets_export: ["Rynki, sprzedaż i eksport", "Targi, marketplace’y, kupujący B2B, dystrybutorzy, eksport i wsparcie internacjonalizacji."],
    production_equipment: ["Produkcja, przestrzeń i sprzęt", "Sprzęt, maszyny, wspólne przestrzenie warsztatowe, moce produkcyjne, logistyka lub infrastruktura."],
    innovation_sustainability: ["Innowacje i zrównoważony rozwój", "Produkcja cyfrowa, nowe technologie, efektywność energetyczna, produkcja obiegu zamkniętego i zrównoważone materiały."],
  },
  it: {
    funding_finance: ["Finanziamenti e supporto finanziario", "Contributi, voucher, sovvenzioni, prestiti, finanziamento di attrezzature e altri supporti finanziari."],
    business_advisory: ["Supporto e consulenza aziendale", "Pianificazione aziendale, prezzi, digitalizzazione, consulenza legale o operativa."],
    certification_standards: ["Certificazione, standard e conformità", "Orientamento su certificazione, requisiti di prodotto, test, standard e conformità."],
    training_skills: ["Formazione e sviluppo delle competenze", "Sviluppo di competenze tecniche, digitali, imprenditoriali, manageriali e altre."],
    partnerships: ["Partnership e cooperazione", "Cooperazione con artigiani, laboratori, designer, fornitori, istituzioni o altri partner."],
    markets_export: ["Mercati, vendite ed export", "Fiere, marketplace, acquirenti B2B, distributori, export e supporto all’internazionalizzazione."],
    production_equipment: ["Produzione, spazio di lavoro e attrezzature", "Attrezzature, macchinari, laboratori condivisi, capacità produttiva, logistica o infrastrutture."],
    innovation_sustainability: ["Innovazione e sostenibilità", "Fabbricazione digitale, nuove tecnologie, efficienza energetica, produzione circolare e materiali sostenibili."],
  },
  es: {
    funding_finance: ["Financiación y apoyo financiero", "Subvenciones, vales, ayudas, préstamos, financiación de equipos y otras formas de apoyo financiero."],
    business_advisory: ["Apoyo empresarial y asesoramiento", "Planificación empresarial, precios, digitalización y asesoramiento jurídico u operativo."],
    certification_standards: ["Certificación, normas y cumplimiento", "Orientación sobre certificación, requisitos de producto, ensayos, normas y cumplimiento."],
    training_skills: ["Formación y desarrollo de competencias", "Desarrollo de competencias técnicas, digitales, empresariales, de gestión y otras."],
    partnerships: ["Alianzas y cooperación", "Cooperación con profesionales de la artesanía, talleres, diseñadores, proveedores, instituciones u otros socios."],
    markets_export: ["Mercados, ventas y exportación", "Ferias, marketplaces, compradores B2B, distribuidores, exportación y apoyo a la internacionalización."],
    production_equipment: ["Producción, espacio de trabajo y equipos", "Equipos, maquinaria, talleres compartidos, capacidad de producción, logística o infraestructura."],
    innovation_sustainability: ["Innovación y sostenibilidad", "Fabricación digital, nuevas tecnologías, eficiencia energética, producción circular y materiales sostenibles."],
  },
} as const;

export default async function SupportPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];

  const { supabase, userId, entity } = await getOwnedCraftId(sp.entity);
  if (!userId) redirect(`/login${localeQuery(locale)}`);
  if (sp.entity && !entity) redirect(`/my-craftid${localeQuery(locale)}`);
  if (!entity) redirect(`/onboarding${localeQuery(locale)}`);

  const q = ownerWorkspaceQuery(locale, entity.id);
  const [{ data: categories }, { data: interests }, { data: preferences }] = await Promise.all([
    supabase
      .from("support_interest_taxonomy")
      .select("code, label_en, label_uk, description_en, description_uk, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("entity_support_interests")
      .select("interest_code, engagement_level, note")
      .eq("entity_id", entity.id),
    supabase
      .from("entity_support_preferences")
      .select("allow_relevant_contact")
      .eq("entity_id", entity.id)
      .maybeSingle(),
  ]);

  const byCode = new Map((interests ?? []).map((item) => [item.interest_code, item]));

  return (
    <main className="workspacePage">
      <div className="container workspaceNarrow">
        <Link className="backLink" href={`/my-craftid${q}`}>← {t.back}</Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="workspaceIntro">{t.intro}</p>
        <p className="privacyNote">{t.privateNote}</p>

        {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
        {sp.message === "saved" ? <p className="formMessage">{t.saved}</p> : null}

        <form className="workspaceForm" action={saveSupportProfile}>
          <input type="hidden" name="lang" value={locale} />
          <input type="hidden" name="entityId" value={entity.id} />

          <div className="workspaceList">
            {(categories ?? []).map((category) => {
              const current = byCode.get(category.code);
              const localized =
                locale === "uk"
                  ? [category.label_uk, category.description_uk]
                  : locale === "en"
                    ? [category.label_en, category.description_en]
                    : supportCategoryCopy[locale][
                        category.code as keyof (typeof supportCategoryCopy)[typeof locale]
                      ];
              const label = localized?.[0] ?? category.label_en;
              const description = localized?.[1] ?? category.description_en;

              return (
                <article className="claimItem" key={category.code}>
                  <h3>{label}</h3>
                  <p>{description}</p>
                  <div className="formGrid">
                    <label>
                      {t.level}
                      <select
                        name={`level_${category.code}`}
                        defaultValue={current?.engagement_level ?? ""}
                      >
                        <option value="">{t.notInterested}</option>
                        <option value="interested">{t.interested}</option>
                        <option value="actively_looking">{t.active}</option>
                      </select>
                    </label>
                    <label>
                      {t.note}
                      <textarea
                        name={`note_${category.code}`}
                        rows={3}
                        maxLength={1000}
                        defaultValue={current?.note ?? ""}
                        placeholder={t.notePlaceholder}
                      />
                    </label>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="toggleList">
            <label>
              <input
                type="checkbox"
                name="allowRelevantContact"
                defaultChecked={preferences?.allow_relevant_contact ?? false}
              />
              {t.contact}
            </label>
          </div>
          <p className="fieldHelp">{t.contactHelp}</p>

          <button className="button buttonPrimary" type="submit">{t.save}</button>
        </form>
      </div>
    </main>
  );
}
