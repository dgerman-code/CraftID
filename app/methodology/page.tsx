import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";

type Props = { searchParams: Promise<{ lang?: string }> };

const copy = {
  en: {
    eyebrow: "Trust methodology",
    title: "Clear claims. Clear evidence. Clear review status.",
    intro: "CraftID separates what a profile owner says about professional practice from the evidence that may support a specific claim, and from the review status of that claim.",
    modelTitle: "Claim-based trust model",
    modelText: "Review is applied to individual claims and supporting evidence. CraftID does not use a blanket “verified professional” status. Identity review is a separate control and is not a higher professional trust level.",
    identityTrack: "Identity review",
    identityTrackText: "Identity review links identity evidence to the profile owner. It runs in parallel to professional claim review and does not verify skills, experience or qualifications.",
    statuses: [
      ["Self-declared", "Information entered by the profile owner and not independently reviewed."],
      ["Evidence submitted", "Supporting evidence has been uploaded or referenced for a specific claim and is awaiting or undergoing review."],
      ["Document reviewed", "A reviewer has inspected documentary evidence in relation to the displayed claim. This does not independently recognise the underlying qualification or status."],
      ["Evidence reviewed", "Available evidence has been assessed and reasonably supports the specific claim under the applicable review procedure."],
      ["External source confirmed", "A claim corresponds to an identifiable external source, register, institution or issuer."],
    ],
    reviewsTitle: "What CraftID may review",
    reviewsText: "Identity information and evidence linked to individual professional claims, such as selected qualifications, experience, affiliations, business registration or other documented assertions.",
    notTitle: "What CraftID does not certify",
    notText: "CraftID does not grant official professional status, statutory licences, EU qualifications, geographical indication rights or blanket certification of a person or workshop.",
    evidenceTitle: "Evidence and privacy",
    evidenceText: "Raw supporting files are private by default. Public profiles show relevant trust status and source information rather than exposing sensitive documents automatically.",
    governanceTitle: "Review governance",
    governanceText: "Review actions should be attributable, auditable and reversible where correction or dispute is required. Reviewer access is role-based, and private reviewer notes are not part of the public profile.",
    disclaimer: "CraftID is an independent professional identity and evidence infrastructure. Its methodology may draw on relevant European approaches to traceability, evidence, provenance and credentials, without constituting statutory registration, certification or recognition.",
  },
  fr: {
    eyebrow: "Méthodologie de confiance",
    title: "Des déclarations claires. Des preuves claires. Un statut d’examen clair.",
    intro: "CraftID distingue ce que le titulaire du profil déclare sur sa pratique professionnelle, les preuves pouvant étayer une déclaration précise et le statut d’examen de cette déclaration.",
    modelTitle: "Modèle de confiance fondé sur les déclarations",
    modelText: "L’examen porte sur des déclarations individuelles et les preuves associées. CraftID n’utilise pas de statut global de « professionnel vérifié ». L’examen de l’identité est un contrôle distinct et ne constitue pas un niveau supérieur de confiance professionnelle.",
    identityTrack: "Examen de l’identité",
    identityTrackText: "L’examen de l’identité relie des preuves d’identité au titulaire du profil. Il fonctionne en parallèle de l’examen des déclarations professionnelles et ne vérifie ni compétences, ni expérience, ni qualifications.",
    statuses: [
      ["Autodéclaré", "Information saisie par le titulaire du profil et non examinée de manière indépendante."],
      ["Preuves soumises", "Des preuves ont été téléversées ou référencées pour une déclaration précise et sont en attente ou en cours d’examen."],
      ["Document examiné", "Un réviseur a examiné des preuves documentaires en relation avec la déclaration affichée. Cela ne constitue pas une reconnaissance indépendante de la qualification ou du statut sous-jacent."],
      ["Preuves examinées", "Les preuves disponibles ont été évaluées et soutiennent raisonnablement la déclaration précise selon la procédure d’examen applicable."],
      ["Source externe confirmée", "Une déclaration correspond à une source externe, un registre, une institution ou un émetteur identifiable."],
    ],
    reviewsTitle: "Ce que CraftID peut examiner",
    reviewsText: "Les informations d’identité et les preuves liées à des déclarations professionnelles individuelles, telles que certaines qualifications, expériences, affiliations, immatriculations d’entreprise ou autres affirmations documentées.",
    notTitle: "Ce que CraftID ne certifie pas",
    notText: "CraftID n’accorde ni statut professionnel officiel, ni licence légale, ni qualification de l’UE, ni droit lié à une indication géographique, ni certification globale d’une personne ou d’un atelier.",
    evidenceTitle: "Preuves et confidentialité",
    evidenceText: "Les fichiers justificatifs bruts sont privés par défaut. Les profils publics affichent le statut de confiance pertinent et les informations de source plutôt que d’exposer automatiquement des documents sensibles.",
    governanceTitle: "Gouvernance de l’examen",
    governanceText: "Les actions d’examen doivent être attribuables, auditables et réversibles lorsqu’une correction ou un litige l’exige. L’accès des réviseurs est fondé sur les rôles et leurs notes privées ne font pas partie du profil public.",
    disclaimer: "CraftID est une infrastructure indépendante d’identité professionnelle et de preuves. Sa méthodologie peut s’inspirer d’approches européennes pertinentes en matière de traçabilité, preuves, provenance et credentials, sans constituer un enregistrement légal, une certification ou une reconnaissance officielle.",
  },
  de: {
    eyebrow: "Vertrauensmethodik",
    title: "Klare Angaben. Klare Nachweise. Klarer Prüfstatus.",
    intro: "CraftID trennt das, was ein Profilinhaber über seine berufliche Praxis angibt, von den Nachweisen, die eine konkrete Angabe stützen können, und vom Prüfstatus dieser Angabe.",
    modelTitle: "Angabenbasierte Vertrauenslogik",
    modelText: "Die Prüfung bezieht sich auf einzelne Angaben und unterstützende Nachweise. CraftID verwendet keinen pauschalen Status „verifizierter Professional“. Die Identitätsprüfung ist ein separater Kontrollprozess und kein höheres berufliches Vertrauensniveau.",
    identityTrack: "Identitätsprüfung",
    identityTrackText: "Die Identitätsprüfung verknüpft Identitätsnachweise mit dem Profilinhaber. Sie läuft parallel zur Prüfung beruflicher Angaben und bestätigt weder Kompetenzen, Erfahrung noch Qualifikationen.",
    statuses: [
      ["Selbst angegeben", "Informationen wurden vom Profilinhaber eingetragen und nicht unabhängig geprüft."],
      ["Nachweise eingereicht", "Unterstützende Nachweise wurden für eine konkrete Angabe hochgeladen oder referenziert und warten auf Prüfung oder werden geprüft."],
      ["Dokument geprüft", "Ein Prüfer hat dokumentarische Nachweise in Bezug auf die angezeigte Angabe geprüft. Dies erkennt die zugrunde liegende Qualifikation oder den Status nicht unabhängig an."],
      ["Nachweise geprüft", "Die verfügbaren Nachweise wurden bewertet und stützen die konkrete Angabe nach dem anwendbaren Prüfverfahren in angemessener Weise."],
      ["Externe Quelle bestätigt", "Eine Angabe stimmt mit einer identifizierbaren externen Quelle, einem Register, einer Institution oder einem Aussteller überein."],
    ],
    reviewsTitle: "Was CraftID prüfen kann",
    reviewsText: "Identitätsinformationen und Nachweise zu einzelnen beruflichen Angaben, etwa ausgewählte Qualifikationen, Erfahrung, Zugehörigkeiten, Unternehmensregistrierung oder andere dokumentierte Aussagen.",
    notTitle: "Was CraftID nicht zertifiziert",
    notText: "CraftID verleiht keinen offiziellen Berufsstatus, keine gesetzlichen Lizenzen, EU-Qualifikationen, Rechte aus geografischen Angaben oder pauschale Zertifizierung einer Person oder Werkstatt.",
    evidenceTitle: "Nachweise und Datenschutz",
    evidenceText: "Rohdateien mit unterstützenden Nachweisen sind standardmäßig privat. Öffentliche Profile zeigen relevante Vertrauensstatus und Quelleninformationen, statt sensible Dokumente automatisch offenzulegen.",
    governanceTitle: "Governance der Prüfung",
    governanceText: "Prüfhandlungen sollten zuordenbar, auditierbar und bei erforderlicher Korrektur oder Streit reversibel sein. Prüferzugriff ist rollenbasiert; private Prüfernotizen sind nicht Teil des öffentlichen Profils.",
    disclaimer: "CraftID ist eine unabhängige Infrastruktur für berufliche Identität und Nachweise. Die Methodik kann sich an relevanten europäischen Ansätzen zu Rückverfolgbarkeit, Nachweisen, Provenienz und Credentials orientieren, ohne gesetzliche Registrierung, Zertifizierung oder Anerkennung darzustellen.",
  },
  nl: {
    eyebrow: "Vertrouwensmethodologie",
    title: "Duidelijke claims. Duidelijk bewijs. Duidelijke beoordelingsstatus.",
    intro: "CraftID scheidt wat een profieleigenaar over de professionele praktijk verklaart van het bewijs dat een specifieke claim kan ondersteunen en van de beoordelingsstatus van die claim.",
    modelTitle: "Vertrouwensmodel per claim",
    modelText: "Beoordeling wordt toegepast op afzonderlijke claims en ondersteunend bewijs. CraftID gebruikt geen algemene status ‘geverifieerde professional’. Identiteitsbeoordeling is een afzonderlijke controle en geen hoger niveau van professioneel vertrouwen.",
    identityTrack: "Identiteitsbeoordeling",
    identityTrackText: "Identiteitsbeoordeling koppelt identiteitsbewijs aan de profieleigenaar. Dit loopt parallel aan de beoordeling van professionele claims en verifieert geen vaardigheden, ervaring of kwalificaties.",
    statuses: [
      ["Zelfverklaard", "Informatie ingevoerd door de profieleigenaar en niet onafhankelijk beoordeeld."],
      ["Bewijs ingediend", "Ondersteunend bewijs is voor een specifieke claim geüpload of vermeld en wacht op beoordeling of wordt beoordeeld."],
      ["Document beoordeeld", "Een beoordelaar heeft documentair bewijs bekeken in relatie tot de getoonde claim. Dit erkent de onderliggende kwalificatie of status niet zelfstandig."],
      ["Bewijs beoordeeld", "Beschikbaar bewijs is beoordeeld en ondersteunt de specifieke claim redelijkerwijs volgens de toepasselijke procedure."],
      ["Externe bron bevestigd", "Een claim komt overeen met een identificeerbare externe bron, register, instelling of uitgever."],
    ],
    reviewsTitle: "Wat CraftID kan beoordelen",
    reviewsText: "Identiteitsinformatie en bewijs gekoppeld aan afzonderlijke professionele claims, zoals geselecteerde kwalificaties, ervaring, affiliaties, bedrijfsregistratie of andere gedocumenteerde verklaringen.",
    notTitle: "Wat CraftID niet certificeert",
    notText: "CraftID verleent geen officiële beroepsstatus, wettelijke vergunningen, EU-kwalificaties, geografische-aanduidingsrechten of algemene certificering van een persoon of werkplaats.",
    evidenceTitle: "Bewijs en privacy",
    evidenceText: "Ruwe bewijsbestanden zijn standaard privé. Openbare profielen tonen relevante vertrouwensstatus en broninformatie in plaats van gevoelige documenten automatisch openbaar te maken.",
    governanceTitle: "Governance van beoordeling",
    governanceText: "Beoordelingsacties moeten herleidbaar, auditbaar en waar nodig omkeerbaar zijn bij correctie of geschil. Toegang van beoordelaars is rolgebaseerd en privénotities maken geen deel uit van het openbare profiel.",
    disclaimer: "CraftID is een onafhankelijke infrastructuur voor professionele identiteit en bewijs. De methodologie kan aansluiten op relevante Europese benaderingen van traceerbaarheid, bewijs, provenance en credentials, zonder een wettelijke registratie, certificering of erkenning te vormen.",
  },
  pl: {
    eyebrow: "Metodologia zaufania",
    title: "Jasne deklaracje. Jasne dowody. Jasny status przeglądu.",
    intro: "CraftID oddziela to, co właściciel profilu deklaruje o praktyce zawodowej, od dowodów mogących wspierać konkretną deklarację oraz od statusu jej przeglądu.",
    modelTitle: "Model zaufania oparty na deklaracjach",
    modelText: "Przegląd dotyczy pojedynczych deklaracji i wspierających je dowodów. CraftID nie stosuje ogólnego statusu „zweryfikowany profesjonalista”. Przegląd tożsamości jest odrębną kontrolą i nie stanowi wyższego poziomu zaufania zawodowego.",
    identityTrack: "Przegląd tożsamości",
    identityTrackText: "Przegląd tożsamości łączy dowody tożsamości z właścicielem profilu. Działa równolegle do przeglądu deklaracji zawodowych i nie weryfikuje umiejętności, doświadczenia ani kwalifikacji.",
    statuses: [
      ["Zadeklarowane samodzielnie", "Informacje wprowadzone przez właściciela profilu i niezależnie niezweryfikowane."],
      ["Dowody złożone", "Materiały wspierające konkretną deklarację zostały przesłane lub wskazane i oczekują na przegląd albo są w trakcie przeglądu."],
      ["Dokument przejrzany", "Recenzent przejrzał dowód dokumentowy w odniesieniu do wyświetlanej deklaracji. Nie oznacza to niezależnego uznania kwalifikacji ani statusu."],
      ["Dowody przejrzane", "Dostępne dowody zostały ocenione i w rozsądny sposób wspierają konkretną deklarację zgodnie z odpowiednią procedurą."],
      ["Potwierdzone źródłem zewnętrznym", "Deklaracja odpowiada możliwemu do zidentyfikowania źródłu zewnętrznemu, rejestrowi, instytucji lub wystawcy."],
    ],
    reviewsTitle: "Co CraftID może przeglądać",
    reviewsText: "Informacje o tożsamości oraz dowody powiązane z pojedynczymi deklaracjami zawodowymi, np. wybrane kwalifikacje, doświadczenie, afiliacje, rejestrację działalności lub inne udokumentowane stwierdzenia.",
    notTitle: "Czego CraftID nie certyfikuje",
    notText: "CraftID nie nadaje oficjalnego statusu zawodowego, ustawowych licencji, kwalifikacji UE, praw do oznaczeń geograficznych ani ogólnej certyfikacji osoby lub pracowni.",
    evidenceTitle: "Dowody i prywatność",
    evidenceText: "Surowe pliki dowodowe są domyślnie prywatne. Profile publiczne pokazują odpowiedni status zaufania i informacje o źródle zamiast automatycznie ujawniać wrażliwe dokumenty.",
    governanceTitle: "Zarządzanie przeglądem",
    governanceText: "Działania przeglądowe powinny być przypisywalne, audytowalne i odwracalne, gdy wymagana jest korekta lub powstaje spór. Dostęp recenzentów jest oparty na rolach, a ich prywatne notatki nie są częścią profilu publicznego.",
    disclaimer: "CraftID jest niezależną infrastrukturą tożsamości zawodowej i dowodów. Metodologia może czerpać z odpowiednich europejskich podejść do identyfikowalności, dowodów, pochodzenia i credentials, nie stanowiąc ustawowej rejestracji, certyfikacji ani uznania.",
  },
  it: {
    eyebrow: "Metodologia della fiducia",
    title: "Dichiarazioni chiare. Evidenze chiare. Stato di revisione chiaro.",
    intro: "CraftID separa ciò che il titolare del profilo dichiara sulla pratica professionale dalle evidenze che possono supportare una specifica dichiarazione e dallo stato di revisione di tale dichiarazione.",
    modelTitle: "Modello di fiducia basato sulle dichiarazioni",
    modelText: "La revisione si applica a singole dichiarazioni e alle evidenze di supporto. CraftID non utilizza uno status generale di «professionista verificato». La revisione dell’identità è un controllo separato e non costituisce un livello superiore di fiducia professionale.",
    identityTrack: "Revisione dell’identità",
    identityTrackText: "La revisione dell’identità collega le evidenze di identità al titolare del profilo. Procede in parallelo alla revisione delle dichiarazioni professionali e non verifica competenze, esperienza o qualifiche.",
    statuses: [
      ["Autodichiarato", "Informazioni inserite dal titolare del profilo e non revisionate in modo indipendente."],
      ["Evidenze presentate", "Evidenze di supporto sono state caricate o indicate per una specifica dichiarazione e sono in attesa o in fase di revisione."],
      ["Documento revisionato", "Un revisore ha esaminato evidenze documentali in relazione alla dichiarazione mostrata. Ciò non riconosce in modo indipendente la qualifica o lo status sottostante."],
      ["Evidenze revisionate", "Le evidenze disponibili sono state valutate e supportano ragionevolmente la specifica dichiarazione secondo la procedura applicabile."],
      ["Fonte esterna confermata", "Una dichiarazione corrisponde a una fonte esterna, registro, istituzione o emittente identificabile."],
    ],
    reviewsTitle: "Cosa può revisionare CraftID",
    reviewsText: "Informazioni di identità ed evidenze collegate a singole dichiarazioni professionali, come qualifiche selezionate, esperienza, affiliazioni, registrazione d’impresa o altre affermazioni documentate.",
    notTitle: "Cosa CraftID non certifica",
    notText: "CraftID non conferisce status professionale ufficiale, licenze previste dalla legge, qualifiche UE, diritti di indicazione geografica o certificazione generale di una persona o laboratorio.",
    evidenceTitle: "Evidenze e privacy",
    evidenceText: "I file di supporto grezzi sono privati per impostazione predefinita. I profili pubblici mostrano il relativo stato di fiducia e le informazioni sulla fonte invece di esporre automaticamente documenti sensibili.",
    governanceTitle: "Governance della revisione",
    governanceText: "Le azioni di revisione dovrebbero essere attribuibili, auditabili e reversibili quando servono correzione o gestione di una controversia. L’accesso dei revisori è basato sui ruoli e le note private non fanno parte del profilo pubblico.",
    disclaimer: "CraftID è un’infrastruttura indipendente per identità professionale ed evidenze. La metodologia può richiamare pertinenti approcci europei a tracciabilità, evidenze, provenienza e credenziali, senza costituire registrazione legale, certificazione o riconoscimento.",
  },
  es: {
    eyebrow: "Metodología de confianza",
    title: "Declaraciones claras. Evidencias claras. Estado de revisión claro.",
    intro: "CraftID separa lo que el titular del perfil declara sobre su práctica profesional de las evidencias que pueden respaldar una declaración concreta y del estado de revisión de esa declaración.",
    modelTitle: "Modelo de confianza basado en declaraciones",
    modelText: "La revisión se aplica a declaraciones individuales y evidencias de apoyo. CraftID no utiliza un estado general de «profesional verificado». La revisión de identidad es un control separado y no constituye un nivel superior de confianza profesional.",
    identityTrack: "Revisión de identidad",
    identityTrackText: "La revisión de identidad vincula evidencias de identidad con el titular del perfil. Funciona en paralelo a la revisión de declaraciones profesionales y no verifica competencias, experiencia ni cualificaciones.",
    statuses: [
      ["Autodeclarado", "Información introducida por el titular del perfil y no revisada de forma independiente."],
      ["Evidencias presentadas", "Se han cargado o referenciado evidencias de apoyo para una declaración concreta y están pendientes o en proceso de revisión."],
      ["Documento revisado", "Un revisor ha examinado evidencia documental en relación con la declaración mostrada. Esto no reconoce de manera independiente la cualificación o el estado subyacente."],
      ["Evidencias revisadas", "Las evidencias disponibles han sido evaluadas y respaldan razonablemente la declaración concreta conforme al procedimiento aplicable."],
      ["Fuente externa confirmada", "Una declaración coincide con una fuente externa, registro, institución o emisor identificable."],
    ],
    reviewsTitle: "Qué puede revisar CraftID",
    reviewsText: "Información de identidad y evidencias vinculadas a declaraciones profesionales individuales, como determinadas cualificaciones, experiencia, afiliaciones, registro empresarial u otras afirmaciones documentadas.",
    notTitle: "Qué no certifica CraftID",
    notText: "CraftID no concede estatus profesional oficial, licencias legales, cualificaciones de la UE, derechos de indicación geográfica ni una certificación general de una persona o taller.",
    evidenceTitle: "Evidencias y privacidad",
    evidenceText: "Los archivos de apoyo originales son privados por defecto. Los perfiles públicos muestran el estado de confianza relevante y la información de la fuente en lugar de exponer automáticamente documentos sensibles.",
    governanceTitle: "Gobernanza de la revisión",
    governanceText: "Las acciones de revisión deben ser atribuibles, auditables y reversibles cuando sea necesaria una corrección o exista una disputa. El acceso de revisores se basa en roles y sus notas privadas no forman parte del perfil público.",
    disclaimer: "CraftID es una infraestructura independiente de identidad profesional y evidencias. Su metodología puede apoyarse en enfoques europeos pertinentes de trazabilidad, evidencias, procedencia y credenciales, sin constituir registro legal, certificación ni reconocimiento oficial.",
  },
  uk: {
    eyebrow: "Методологія довіри",
    title: "Чіткі твердження. Чіткі докази. Чіткий статус перевірки.",
    intro: "CraftID розділяє інформацію, яку власник профілю заявляє про професійну практику, докази, що можуть підтверджувати конкретне твердження, та статус перевірки цього твердження.",
    modelTitle: "Модель довіри на рівні тверджень",
    modelText: "Перевірка застосовується до окремих тверджень і підтвердних матеріалів. CraftID не використовує узагальнений статус «верифікований професіонал». Перевірка ідентичності є окремим контролем і не є вищим рівнем професійної довіри.",
    identityTrack: "Перевірка ідентичності",
    identityTrackText: "Перевірка ідентичності пов’язує документи, що посвідчують особу, з власником профілю. Вона відбувається паралельно до перевірки професійних тверджень і не підтверджує навички, досвід чи кваліфікації.",
    statuses: [
      ["Заявлено самостійно", "Інформація внесена власником профілю та не перевірялася незалежно."],
      ["Докази подано", "Підтвердний матеріал завантажено або зазначено для конкретного твердження; перевірка очікується або триває."],
      ["Документ переглянуто", "Рецензент переглянув документальні докази у зв’язку з відображеним твердженням. Це не означає незалежного визнання кваліфікації чи статусу."],
      ["Докази переглянуто", "Наявні докази оцінено та вони обґрунтовано підтримують конкретне твердження відповідно до застосованої процедури."],
      ["Підтверджено зовнішнім джерелом", "Твердження відповідає ідентифікованому зовнішньому джерелу, реєстру, установі або видавцю."],
    ],
    reviewsTitle: "Що CraftID може перевіряти",
    reviewsText: "Дані про ідентичність та докази, пов’язані з окремими професійними твердженнями, наприклад вибраними кваліфікаціями, досвідом, професійними зв’язками, реєстрацією бізнесу або іншими документованими відомостями.",
    notTitle: "Що CraftID не сертифікує",
    notText: "CraftID не надає офіційного професійного статусу, законодавчих ліцензій, кваліфікацій ЄС, прав на географічні зазначення або загальної сертифікації людини чи майстерні.",
    evidenceTitle: "Докази та приватність",
    evidenceText: "Первинні підтвердні файли за замовчуванням є приватними. Публічні профілі показують релевантний статус довіри та інформацію про джерело, а не автоматично відкривають чутливі документи.",
    governanceTitle: "Управління перевіркою",
    governanceText: "Дії з перевірки мають бути атрибутованими, аудитованими та придатними до перегляду у разі виправлення або спору. Доступ рецензентів визначається ролями, а приватні нотатки рецензента не є частиною публічного профілю.",
    disclaimer: "CraftID є незалежною інфраструктурою професійної ідентичності та доказів. Її методологія може спиратися на релевантні європейські підходи до простежуваності, доказів, походження та цифрових кваліфікацій, але не є законодавчою реєстрацією, сертифікацією чи офіційним визнанням.",
  },
} as const;

const sectionLabels = {
  en: { trust: "Trust", parallel: "Parallel control", scope: "Scope", limits: "Limits", privacy: "Privacy", governance: "Governance" },
  fr: { trust: "Confiance", parallel: "Contrôle parallèle", scope: "Périmètre", limits: "Limites", privacy: "Confidentialité", governance: "Gouvernance" },
  de: { trust: "Vertrauen", parallel: "Parallele Kontrolle", scope: "Umfang", limits: "Grenzen", privacy: "Datenschutz", governance: "Governance" },
  nl: { trust: "Vertrouwen", parallel: "Parallelle controle", scope: "Reikwijdte", limits: "Grenzen", privacy: "Privacy", governance: "Governance" },
  pl: { trust: "Zaufanie", parallel: "Kontrola równoległa", scope: "Zakres", limits: "Granice", privacy: "Prywatność", governance: "Zarządzanie" },
  it: { trust: "Fiducia", parallel: "Controllo parallelo", scope: "Ambito", limits: "Limiti", privacy: "Privacy", governance: "Governance" },
  es: { trust: "Confianza", parallel: "Control paralelo", scope: "Alcance", limits: "Límites", privacy: "Privacidad", governance: "Gobernanza" },
  uk: { trust: "Довіра", parallel: "Паралельний контроль", scope: "Обсяг", limits: "Межі", privacy: "Приватність", governance: "Управління" },
} as const;

export default async function MethodologyPage({ searchParams }: Props) {
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale];
  const section = sectionLabels[locale];

  return (
    <>
      <SiteHeader locale={locale} pathname="/methodology" />
      <main className="publicInfoPage">
        <section className="pageHero">
          <div className="container">
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
          </div>
        </section>

        <section className="section editorialSection">
          <div className="container">
            <div className="sectionLead">
              <div className="eyebrow">{section.trust}</div>
              <h2>{t.modelTitle}</h2>
              <p>{t.modelText}</p>
            </div>
            <div className="trustModelLayout">
              <div className="claimTrustTrack">
                {t.statuses.map(([title, text], index) => (
                  <article className="claimTrustStep" key={title}>
                    <span className="choiceIndex">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                  </article>
                ))}
              </div>
              <aside className="identityTrustTrack">
                <div className="eyebrow">{section.parallel}</div>
                <h3>{t.identityTrack}</h3>
                <p>{t.identityTrackText}</p>
              </aside>
            </div>
          </div>
        </section>

        <section className="section editorialSection">
          <div className="container informationGrid">
            <article className="informationCard">
              <div className="eyebrow">{section.scope}</div>
              <h3>{t.reviewsTitle}</h3>
              <p>{t.reviewsText}</p>
            </article>
            <article className="informationCard">
              <div className="eyebrow">{section.limits}</div>
              <h3>{t.notTitle}</h3>
              <p>{t.notText}</p>
            </article>
            <article className="informationCard">
              <div className="eyebrow">{section.privacy}</div>
              <h3>{t.evidenceTitle}</h3>
              <p>{t.evidenceText}</p>
            </article>
            <article className="informationCard">
              <div className="eyebrow">{section.governance}</div>
              <h3>{t.governanceTitle}</h3>
              <p>{t.governanceText}</p>
            </article>
          </div>
        </section>

        <section className="section disclaimerBand">
          <div className="container">
            <p>{t.disclaimer}</p>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
