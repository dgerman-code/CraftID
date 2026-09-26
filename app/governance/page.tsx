import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";

type Props = { searchParams: Promise<{ lang?: string }> };

const copy = {
  en: {
    eyebrow: "Governance",
    title: "Trust requires accountable rules.",
    intro: "CraftID governance is designed around traceability, proportional review, role separation and clear limits on what the platform may claim.",
    items: [
      ["Profile ownership", "Professionals and workshops control their records, while platform rules protect identifier integrity and the audit trail."],
      ["Reviewer separation", "Reviewer and administrator permissions are role-based. Review decisions are attributable to authenticated staff roles."],
      ["Claim-level review", "Evidence review changes the status of a specific claim, not a blanket status for the whole person or workshop."],
      ["Auditability", "Sensitive changes and review actions are recorded so decisions can be traced and corrected where appropriate."],
      ["Taxonomy stewardship", "Core taxonomy changes are controlled rather than freely user-editable, while the model remains extensible over time."],
      ["Disputes and correction", "Production governance should include documented correction, withdrawal and dispute procedures before external scale-up."],
    ],
    boundaryTitle: "Institutional boundary",
    boundaryText: "EUFUA develops and operates CraftID as an independent professional identity and evidence infrastructure. CraftID does not represent the European Union, grant statutory recognition or replace competent authorities, regulated qualifications or formal certification schemes.",
  },
  fr: {
    eyebrow: "Gouvernance",
    title: "La confiance exige des règles responsables.",
    intro: "La gouvernance de CraftID repose sur la traçabilité, un examen proportionné, la séparation des rôles et des limites claires quant aux affirmations de la plateforme.",
    items: [
      ["Propriété du profil", "Les professionnels et ateliers contrôlent leurs dossiers, tandis que les règles de la plateforme protègent l’intégrité des identifiants et la piste d’audit."],
      ["Séparation des réviseurs", "Les autorisations des réviseurs et administrateurs sont fondées sur les rôles. Les décisions d’examen sont attribuables à des rôles de personnel authentifiés."],
      ["Examen au niveau de la déclaration", "L’examen des preuves modifie le statut d’une déclaration précise, et non un statut global pour toute la personne ou l’atelier."],
      ["Auditabilité", "Les changements sensibles et actions d’examen sont enregistrés afin que les décisions puissent être retracées et corrigées si nécessaire."],
      ["Gestion de la taxonomie", "Les modifications de la taxonomie centrale sont contrôlées plutôt que librement éditables par les utilisateurs, tout en gardant le modèle extensible."],
      ["Litiges et corrections", "La gouvernance de production doit inclure des procédures documentées de correction, retrait et règlement des litiges avant un déploiement externe à grande échelle."],
    ],
    boundaryTitle: "Limite institutionnelle",
    boundaryText: "EUFUA développe et exploite CraftID comme infrastructure indépendante d’identité professionnelle et de preuves. CraftID ne représente pas l’Union européenne, n’accorde pas de reconnaissance légale et ne remplace pas les autorités compétentes, qualifications réglementées ou systèmes formels de certification.",
  },
  de: {
    eyebrow: "Governance",
    title: "Vertrauen braucht verantwortliche Regeln.",
    intro: "Die Governance von CraftID basiert auf Rückverfolgbarkeit, verhältnismäßiger Prüfung, Rollentrennung und klaren Grenzen dessen, was die Plattform behaupten darf.",
    items: [
      ["Profileigentum", "Professionals und Werkstätten kontrollieren ihre Datensätze, während Plattformregeln die Integrität der Kennung und die Auditspur schützen."],
      ["Trennung von Prüferrollen", "Berechtigungen für Prüfer und Administratoren sind rollenbasiert. Prüfentscheidungen sind authentifizierten Mitarbeiterrollen zuordenbar."],
      ["Prüfung auf Angabeebene", "Die Nachweisprüfung ändert den Status einer konkreten Angabe, nicht einen pauschalen Status für die gesamte Person oder Werkstatt."],
      ["Auditierbarkeit", "Sensible Änderungen und Prüfhandlungen werden protokolliert, damit Entscheidungen nachvollzogen und gegebenenfalls korrigiert werden können."],
      ["Taxonomie-Verantwortung", "Änderungen an der Kerntaxonomie werden kontrolliert und nicht frei durch Nutzer bearbeitet; das Modell bleibt zugleich erweiterbar."],
      ["Streitfälle und Korrektur", "Die Produktions-Governance sollte dokumentierte Verfahren für Korrektur, Rücknahme und Streitbeilegung enthalten, bevor extern skaliert wird."],
    ],
    boundaryTitle: "Institutionelle Grenze",
    boundaryText: "EUFUA entwickelt und betreibt CraftID als unabhängige Infrastruktur für berufliche Identität und Nachweise. CraftID vertritt nicht die Europäische Union, gewährt keine gesetzliche Anerkennung und ersetzt weder zuständige Behörden noch reglementierte Qualifikationen oder formelle Zertifizierungssysteme.",
  },
  nl: {
    eyebrow: "Governance",
    title: "Vertrouwen vraagt om verantwoordelijke regels.",
    intro: "De governance van CraftID is gebaseerd op traceerbaarheid, proportionele beoordeling, scheiding van rollen en duidelijke grenzen aan wat het platform kan claimen.",
    items: [
      ["Eigendom van het profiel", "Professionals en werkplaatsen beheren hun dossiers, terwijl platformregels de integriteit van identifiers en de audittrail beschermen."],
      ["Scheiding van beoordelaars", "Rechten van beoordelaars en beheerders zijn rolgebaseerd. Beoordelingsbesluiten zijn herleidbaar tot geauthenticeerde personeelsrollen."],
      ["Beoordeling per claim", "Beoordeling van bewijs verandert de status van een specifieke claim, niet een algemene status voor de hele persoon of werkplaats."],
      ["Auditbaarheid", "Gevoelige wijzigingen en beoordelingsacties worden vastgelegd zodat besluiten kunnen worden getraceerd en waar nodig gecorrigeerd."],
      ["Beheer van taxonomie", "Wijzigingen in de kerntaxonomie worden gecontroleerd in plaats van vrij door gebruikers bewerkbaar te zijn, terwijl het model uitbreidbaar blijft."],
      ["Geschillen en correctie", "Productiegovernance moet vóór externe opschaling gedocumenteerde procedures bevatten voor correctie, intrekking en geschilbehandeling."],
    ],
    boundaryTitle: "Institutionele grens",
    boundaryText: "EUFUA ontwikkelt en beheert CraftID als onafhankelijke infrastructuur voor professionele identiteit en bewijs. CraftID vertegenwoordigt de Europese Unie niet, verleent geen wettelijke erkenning en vervangt geen bevoegde autoriteiten, gereglementeerde kwalificaties of formele certificeringsstelsels.",
  },
  pl: {
    eyebrow: "Zarządzanie",
    title: "Zaufanie wymaga odpowiedzialnych zasad.",
    intro: "Zarządzanie CraftID opiera się na identyfikowalności, proporcjonalnym przeglądzie, rozdzieleniu ról i jasnych granicach tego, co platforma może deklarować.",
    items: [
      ["Własność profilu", "Profesjonaliści i pracownie kontrolują swoje zapisy, a zasady platformy chronią integralność identyfikatora i ścieżkę audytową."],
      ["Rozdzielenie ról recenzenta", "Uprawnienia recenzentów i administratorów są oparte na rolach. Decyzje przeglądu są przypisane do uwierzytelnionych ról personelu."],
      ["Przegląd na poziomie deklaracji", "Przegląd dowodów zmienia status konkretnej deklaracji, a nie nadaje ogólnego statusu całej osobie lub pracowni."],
      ["Audytowalność", "Wrażliwe zmiany i działania przeglądowe są rejestrowane, aby decyzje można było prześledzić i w razie potrzeby poprawić."],
      ["Zarządzanie taksonomią", "Zmiany podstawowej taksonomii są kontrolowane, a nie dowolnie edytowane przez użytkowników, przy zachowaniu możliwości rozszerzania modelu."],
      ["Spory i korekty", "Przed szerszym wdrożeniem zarządzanie produkcyjne powinno obejmować udokumentowane procedury korekty, wycofania i rozpatrywania sporów."],
    ],
    boundaryTitle: "Granica instytucjonalna",
    boundaryText: "EUFUA rozwija i prowadzi CraftID jako niezależną infrastrukturę tożsamości zawodowej i dowodów. CraftID nie reprezentuje Unii Europejskiej, nie nadaje uznania ustawowego i nie zastępuje właściwych organów, kwalifikacji regulowanych ani formalnych systemów certyfikacji.",
  },
  it: {
    eyebrow: "Governance",
    title: "La fiducia richiede regole responsabili.",
    intro: "La governance di CraftID è progettata attorno a tracciabilità, revisione proporzionata, separazione dei ruoli e limiti chiari a ciò che la piattaforma può dichiarare.",
    items: [
      ["Titolarità del profilo", "Professionisti e laboratori controllano i propri record, mentre le regole della piattaforma proteggono l’integrità dell’identificativo e la traccia di audit."],
      ["Separazione dei revisori", "I permessi di revisori e amministratori sono basati sui ruoli. Le decisioni di revisione sono attribuibili a ruoli del personale autenticati."],
      ["Revisione a livello di dichiarazione", "La revisione delle evidenze modifica lo stato di una dichiarazione specifica, non uno status generale per l’intera persona o laboratorio."],
      ["Auditabilità", "Le modifiche sensibili e le azioni di revisione vengono registrate affinché le decisioni possano essere tracciate e corrette quando necessario."],
      ["Gestione della tassonomia", "Le modifiche alla tassonomia centrale sono controllate anziché liberamente modificabili dagli utenti, mantenendo il modello estensibile nel tempo."],
      ["Controversie e correzioni", "La governance operativa dovrebbe includere procedure documentate di correzione, ritiro e gestione delle controversie prima di un ampliamento esterno."],
    ],
    boundaryTitle: "Confine istituzionale",
    boundaryText: "EUFUA sviluppa e gestisce CraftID come infrastruttura indipendente per identità professionale ed evidenze. CraftID non rappresenta l’Unione europea, non concede riconoscimento legale e non sostituisce autorità competenti, qualifiche regolamentate o schemi formali di certificazione.",
  },
  es: {
    eyebrow: "Gobernanza",
    title: "La confianza exige reglas responsables.",
    intro: "La gobernanza de CraftID se basa en trazabilidad, revisión proporcional, separación de funciones y límites claros sobre lo que la plataforma puede afirmar.",
    items: [
      ["Titularidad del perfil", "Los profesionales y talleres controlan sus registros, mientras que las reglas de la plataforma protegen la integridad del identificador y la pista de auditoría."],
      ["Separación de revisores", "Los permisos de revisores y administradores se basan en roles. Las decisiones de revisión se atribuyen a funciones de personal autenticadas."],
      ["Revisión a nivel de declaración", "La revisión de evidencias cambia el estado de una declaración concreta, no un estado general para toda la persona o taller."],
      ["Auditabilidad", "Los cambios sensibles y las acciones de revisión se registran para que las decisiones puedan rastrearse y corregirse cuando proceda."],
      ["Gestión de taxonomía", "Los cambios en la taxonomía central están controlados y no son libremente editables por los usuarios, aunque el modelo siga siendo ampliable."],
      ["Disputas y corrección", "La gobernanza operativa debe incluir procedimientos documentados de corrección, retirada y resolución de disputas antes de una ampliación externa."],
    ],
    boundaryTitle: "Límite institucional",
    boundaryText: "EUFUA desarrolla y opera CraftID como infraestructura independiente de identidad profesional y evidencias. CraftID no representa a la Unión Europea, no otorga reconocimiento legal ni sustituye a autoridades competentes, cualificaciones reguladas o sistemas formales de certificación.",
  },
  uk: {
    eyebrow: "Управління",
    title: "Довіра потребує підзвітних правил.",
    intro: "Управління CraftID будується на простежуваності, пропорційній перевірці, розподілі ролей та чітких межах того, що платформа може заявляти.",
    items: [
      ["Власність профілю", "Професіонали та майстерні керують своїми записами, а правила платформи захищають цілісність ідентифікатора та аудиторського сліду."],
      ["Розподіл ролей рецензента", "Права рецензентів та адміністраторів визначаються ролями. Рішення перевірки прив’язані до автентифікованих службових ролей."],
      ["Перевірка на рівні твердження", "Перевірка доказів змінює статус конкретного твердження, а не створює загальний статус для людини чи майстерні."],
      ["Аудитованість", "Чутливі зміни та дії перевірки фіксуються, щоб рішення можна було простежити та, де доречно, виправити."],
      ["Управління таксономією", "Зміни базової таксономії контролюються, а не є вільно редагованими користувачами, водночас модель залишається розширюваною."],
      ["Спори та виправлення", "До масштабування назовні виробниче управління має включати документовані процедури виправлення, відкликання та розгляду спорів."],
    ],
    boundaryTitle: "Інституційна межа",
    boundaryText: "EUFUA розвиває та адмініструє CraftID як незалежну інфраструктуру професійної ідентичності та доказів. CraftID не представляє Європейський Союз, не надає законодавчого визнання та не замінює компетентні органи, регульовані кваліфікації чи формальні схеми сертифікації.",
  },
} as const;

export default async function GovernancePage({ searchParams }: Props) {
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale as keyof typeof copy] ?? copy.en;

  return (
    <>
      <SiteHeader locale={locale} pathname="/governance" />
      <main>
        <section className="pageHero">
          <div className="container">
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
          </div>
        </section>
        <section className="section editorialSection">
          <div className="container statusGrid">
            {t.items.map(([title, text], index) => (
              <article className="statusCard" key={title}>
                <span className="choiceIndex">{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="section trustBand">
          <div className="container sectionLead">
            <div className="eyebrow">EUFUA</div>
            <h2>{t.boundaryTitle}</h2>
            <p>{t.boundaryText}</p>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
