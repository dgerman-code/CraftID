import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCraftId } from "./actions";
import { LanguageMenu, localeFrom } from "@/components/site-shell";

type OnboardingPageProps = {
  searchParams: Promise<{ error?: string; lang?: string }>;
};

export const dynamic = "force-dynamic";

const copy = {
  en: {
    eyebrow: "CraftID setup",
    title: "What will this CraftID represent?",
    intro: "Choose what you are registering first. A personal CraftID and a Workshop CraftID are separate records and can later be linked without merging their professional evidence.",
    guideTitle: "Which record should I choose?",
    guideText: "If you are a craftsperson — including a craftsperson who owns or runs a workshop — start with Professional. You can add a linked Workshop CraftID from your account afterwards. Choose Workshop only when you are registering the workshop, studio or craft-based micro-enterprise itself as the primary record.",
    professional: "Professional",
    professionalText: "For an individual craft practitioner. This record follows the person: skills, experience, qualifications, portfolio and supporting evidence remain connected to the professional even if they change workshop or place of practice.",
    professionalHint: "Recommended starting point for individual craftspeople and workshop owners.",
    professionalCta: "Create professional CraftID",
    workshop: "Workshop",
    workshopText: "For a studio, workshop or craft-based micro-enterprise. This record describes the organisation or place of practice: craft sector, capabilities, team relationships, business context and workshop-level evidence.",
    workshopHint: "Use this for the workshop itself — not as a replacement for the craftsperson's personal record.",
    workshopCta: "Create workshop CraftID",
    note: "Each CraftID is a permanent identifier for one entity. It is never replaced, reassigned or transferred to another entity. If you previously closed your account and return with the same confirmed email, CraftID restores the same archived record as a draft instead of issuing a new number. A person and a workshop may have separate CraftIDs and be linked through a declared relationship. Numbers 00000001–00000100 are reserved for explicit administrative assignment.",
  },
  fr: {
    eyebrow: "Configuration de CraftID", title: "Que représentera ce CraftID ?",
    intro: "Choisissez ce que vous enregistrez en premier. Un CraftID personnel et un CraftID Workshop sont des dossiers distincts et peuvent ensuite être reliés sans fusionner leurs preuves professionnelles.",
    guideTitle: "Quel dossier choisir ?",
    guideText: "Si vous êtes artisan — y compris si vous possédez ou dirigez un atelier — commencez par Professional. Vous pourrez ensuite ajouter un CraftID Workshop lié depuis votre compte. Choisissez Workshop uniquement si vous enregistrez l’atelier, le studio ou la microentreprise artisanale elle-même comme dossier principal.",
    professional: "Professional",
    professionalText: "Pour un praticien individuel. Ce dossier suit la personne : compétences, expérience, qualifications, portfolio et preuves restent liés au professionnel même s’il change d’atelier ou de lieu de pratique.",
    professionalHint: "Point de départ recommandé pour les artisans individuels et les propriétaires d’atelier.",
    professionalCta: "Créer un CraftID Professional",
    workshop: "Workshop",
    workshopText: "Pour un studio, atelier ou une microentreprise artisanale. Ce dossier décrit l’organisation ou le lieu de pratique : secteur artisanal, capacités, relations d’équipe, contexte d’entreprise et preuves au niveau de l’atelier.",
    workshopHint: "À utiliser pour l’atelier lui-même — pas à la place du dossier personnel de l’artisan.",
    workshopCta: "Créer un CraftID Workshop",
    note: "Chaque CraftID est l’identifiant permanent d’une seule entité. Il n’est jamais remplacé, réattribué ou transféré. Si vous revenez après avoir fermé votre compte avec le même e-mail confirmé, CraftID restaure le même dossier archivé comme brouillon au lieu d’émettre un nouveau numéro. Une personne et un atelier peuvent avoir des CraftID séparés et être reliés par une relation déclarée. Les numéros 00000001–00000100 sont réservés à une attribution administrative explicite.",
  },
  de: {
    eyebrow: "CraftID-Einrichtung", title: "Wofür steht diese CraftID?",
    intro: "Wählen Sie zuerst aus, was Sie registrieren. Eine persönliche CraftID und eine Workshop CraftID sind getrennte Datensätze und können später verknüpft werden, ohne ihre beruflichen Nachweise zusammenzuführen.",
    guideTitle: "Welchen Datensatz sollte ich wählen?",
    guideText: "Wenn Sie Handwerkerin oder Handwerker sind — auch wenn Sie eine Werkstatt besitzen oder leiten — beginnen Sie mit Professional. Danach können Sie in Ihrem Konto eine verknüpfte Workshop CraftID hinzufügen. Wählen Sie Workshop nur, wenn die Werkstatt, das Studio oder das handwerksbasierte Kleinstunternehmen selbst der primäre Datensatz sein soll.",
    professional: "Professional",
    professionalText: "Für eine einzelne handwerklich tätige Person. Dieser Datensatz folgt der Person: Kompetenzen, Erfahrung, Qualifikationen, Portfolio und Nachweise bleiben mit ihr verbunden, auch wenn Werkstatt oder Praxisort wechseln.",
    professionalHint: "Empfohlener Startpunkt für einzelne Handwerksprofis und Werkstattinhaber.",
    professionalCta: "Professional CraftID erstellen",
    workshop: "Workshop",
    workshopText: "Für Studio, Werkstatt oder handwerksbasiertes Kleinstunternehmen. Dieser Datensatz beschreibt Organisation oder Praxisort: Handwerksbereich, Fähigkeiten, Teambeziehungen, Geschäftskontext und werkstattbezogene Nachweise.",
    workshopHint: "Für die Werkstatt selbst verwenden — nicht als Ersatz für den persönlichen Datensatz der handwerklich tätigen Person.",
    workshopCta: "Workshop CraftID erstellen",
    note: "Jede CraftID ist eine dauerhafte Kennung für genau eine Entität. Sie wird nie ersetzt, neu zugewiesen oder auf eine andere Entität übertragen. Wenn Sie nach Kontoschließung mit derselben bestätigten E-Mail zurückkehren, stellt CraftID denselben archivierten Datensatz als Entwurf wieder her, statt eine neue Nummer zu vergeben. Person und Werkstatt können getrennte CraftIDs haben und über eine deklarierte Beziehung verknüpft werden. Die Nummern 00000001–00000100 sind für explizite administrative Zuweisung reserviert.",
  },
  nl: {
    eyebrow: "CraftID instellen", title: "Wat vertegenwoordigt deze CraftID?",
    intro: "Kies wat u als eerste registreert. Een persoonlijke CraftID en een Workshop CraftID zijn afzonderlijke dossiers en kunnen later worden gekoppeld zonder hun professionele bewijs samen te voegen.",
    guideTitle: "Welk dossier moet ik kiezen?",
    guideText: "Bent u een ambachtsprofessional — ook als u een werkplaats bezit of leidt — begin dan met Professional. Daarna kunt u vanuit uw account een gekoppelde Workshop CraftID toevoegen. Kies Workshop alleen wanneer u de werkplaats, studio of ambachtelijke micro-onderneming zelf als primair dossier registreert.",
    professional: "Professional",
    professionalText: "Voor een individuele beoefenaar. Dit dossier volgt de persoon: vaardigheden, ervaring, kwalificaties, portfolio en ondersteunend bewijs blijven aan de professional gekoppeld, ook bij verandering van werkplaats of praktijklocatie.",
    professionalHint: "Aanbevolen startpunt voor individuele ambachtsprofessionals en werkplaatseigenaren.",
    professionalCta: "Professional CraftID aanmaken",
    workshop: "Workshop",
    workshopText: "Voor een studio, werkplaats of ambachtelijke micro-onderneming. Dit dossier beschrijft organisatie of praktijklocatie: ambachtssector, capaciteiten, teamrelaties, bedrijfscontext en bewijs op werkplaatsniveau.",
    workshopHint: "Gebruik dit voor de werkplaats zelf — niet als vervanging voor het persoonlijke dossier van de ambachtsprofessional.",
    workshopCta: "Workshop CraftID aanmaken",
    note: "Elke CraftID is een permanente identifier voor één entiteit. Deze wordt nooit vervangen, opnieuw toegewezen of aan een andere entiteit overgedragen. Als u na sluiting van uw account terugkeert met hetzelfde bevestigde e-mailadres, herstelt CraftID hetzelfde gearchiveerde dossier als concept in plaats van een nieuw nummer uit te geven. Een persoon en een werkplaats kunnen aparte CraftIDs hebben en via een verklaarde relatie worden gekoppeld. Nummers 00000001–00000100 zijn gereserveerd voor expliciete administratieve toewijzing.",
  },
  pl: {
    eyebrow: "Konfiguracja CraftID", title: "Co będzie reprezentować ten CraftID?",
    intro: "Wybierz, co rejestrujesz jako pierwsze. Osobisty CraftID i Workshop CraftID są odrębnymi zapisami i mogą później zostać połączone bez łączenia ich dowodów zawodowych.",
    guideTitle: "Który zapis wybrać?",
    guideText: "Jeśli jesteś rzemieślnikiem — także właścicielem lub osobą prowadzącą pracownię — zacznij od Professional. Później możesz dodać z konta powiązany Workshop CraftID. Wybierz Workshop tylko wtedy, gdy jako główny zapis rejestrujesz samą pracownię, studio lub mikroprzedsiębiorstwo rzemieślnicze.",
    professional: "Professional",
    professionalText: "Dla indywidualnego praktyka rzemiosła. Ten zapis podąża za osobą: umiejętności, doświadczenie, kwalifikacje, portfolio i dowody pozostają związane z profesjonalistą nawet po zmianie pracowni lub miejsca praktyki.",
    professionalHint: "Zalecany punkt startowy dla indywidualnych rzemieślników i właścicieli pracowni.",
    professionalCta: "Utwórz Professional CraftID",
    workshop: "Workshop",
    workshopText: "Dla studia, pracowni lub mikroprzedsiębiorstwa rzemieślniczego. Ten zapis opisuje organizację lub miejsce praktyki: sektor rzemiosła, możliwości, relacje zespołowe, kontekst biznesowy i dowody na poziomie pracowni.",
    workshopHint: "Użyj dla samej pracowni — nie zamiast osobistego zapisu rzemieślnika.",
    workshopCta: "Utwórz Workshop CraftID",
    note: "Każdy CraftID jest stałym identyfikatorem jednej jednostki. Nigdy nie jest zastępowany, ponownie przydzielany ani przenoszony na inną jednostkę. Jeśli po zamknięciu konta wrócisz z tym samym potwierdzonym adresem e-mail, CraftID przywróci ten sam zarchiwizowany zapis jako wersję roboczą zamiast wydawać nowy numer. Osoba i pracownia mogą mieć oddzielne CraftID i być połączone zadeklarowaną relacją. Numery 00000001–00000100 są zarezerwowane do wyraźnego przydziału administracyjnego.",
  },
  it: {
    eyebrow: "Configurazione CraftID", title: "Che cosa rappresenterà questo CraftID?",
    intro: "Scegli cosa stai registrando per primo. Un CraftID personale e un Workshop CraftID sono record separati e possono essere collegati in seguito senza unire le rispettive evidenze professionali.",
    guideTitle: "Quale record dovrei scegliere?",
    guideText: "Se sei un artigiano — anche proprietario o responsabile di un laboratorio — inizia con Professional. In seguito potrai aggiungere dal tuo account un Workshop CraftID collegato. Scegli Workshop solo se stai registrando come record principale il laboratorio, lo studio o la microimpresa artigianale stessa.",
    professional: "Professional",
    professionalText: "Per un singolo professionista dell’artigianato. Questo record segue la persona: competenze, esperienza, qualifiche, portfolio ed evidenze rimangono collegate al professionista anche se cambia laboratorio o luogo di pratica.",
    professionalHint: "Punto di partenza consigliato per singoli artigiani e proprietari di laboratori.",
    professionalCta: "Crea Professional CraftID",
    workshop: "Workshop",
    workshopText: "Per uno studio, laboratorio o microimpresa artigianale. Questo record descrive l’organizzazione o il luogo di pratica: settore artigianale, capacità, relazioni di team, contesto d’impresa ed evidenze a livello di laboratorio.",
    workshopHint: "Usalo per il laboratorio stesso — non come sostituto del record personale dell’artigiano.",
    workshopCta: "Crea Workshop CraftID",
    note: "Ogni CraftID è un identificativo permanente per una sola entità. Non viene mai sostituito, riassegnato o trasferito a un’altra entità. Se torni dopo aver chiuso l’account usando la stessa e-mail confermata, CraftID ripristina lo stesso record archiviato come bozza anziché emettere un nuovo numero. Una persona e un laboratorio possono avere CraftID separati e essere collegati tramite una relazione dichiarata. I numeri 00000001–00000100 sono riservati ad assegnazione amministrativa esplicita.",
  },
  es: {
    eyebrow: "Configuración de CraftID", title: "¿Qué representará este CraftID?",
    intro: "Elige qué vas a registrar primero. Un CraftID personal y un Workshop CraftID son registros separados y pueden vincularse posteriormente sin fusionar sus evidencias profesionales.",
    guideTitle: "¿Qué registro debo elegir?",
    guideText: "Si eres profesional de la artesanía — incluso si eres propietario o diriges un taller — empieza por Professional. Después podrás añadir desde tu cuenta un Workshop CraftID vinculado. Elige Workshop solo cuando estés registrando como registro principal el propio taller, estudio o microempresa artesanal.",
    professional: "Professional",
    professionalText: "Para un profesional individual de la artesanía. Este registro sigue a la persona: competencias, experiencia, cualificaciones, portfolio y evidencias permanecen vinculados al profesional aunque cambie de taller o lugar de práctica.",
    professionalHint: "Punto de partida recomendado para artesanos individuales y propietarios de talleres.",
    professionalCta: "Crear Professional CraftID",
    workshop: "Workshop",
    workshopText: "Para un estudio, taller o microempresa artesanal. Este registro describe la organización o lugar de práctica: sector artesanal, capacidades, relaciones del equipo, contexto empresarial y evidencias a nivel de taller.",
    workshopHint: "Úsalo para el propio taller — no como sustituto del registro personal del artesano.",
    workshopCta: "Crear Workshop CraftID",
    note: "Cada CraftID es un identificador permanente de una sola entidad. Nunca se sustituye, reasigna ni transfiere a otra entidad. Si vuelves tras cerrar tu cuenta con el mismo correo confirmado, CraftID restaura el mismo registro archivado como borrador en lugar de emitir un nuevo número. Una persona y un taller pueden tener CraftID separados y vincularse mediante una relación declarada. Los números 00000001–00000100 están reservados para asignación administrativa explícita.",
  },
  uk: {
    eyebrow: "Налаштування CraftID",
    title: "Що представлятиме цей CraftID?",
    intro: "Оберіть, що саме ви реєструєте насамперед. Персональний CraftID і CraftID майстерні є окремими записами та згодом можуть бути пов’язані без об’єднання їхніх професійних доказів.",
    guideTitle: "Який запис обрати?",
    guideText: "Якщо ви ремісник або майстер — у тому числі власник чи керівник майстерні — почніть із Професіонала. Після цього у своєму кабінеті ви зможете додати пов’язаний CraftID майстерні. Обирайте Майстерню, якщо ви реєструєте саме студію, майстерню або ремісниче мікропідприємство як основний об’єкт.",
    professional: "Професіонал",
    professionalText: "Для окремого майстра або ремісничого фахівця. Цей запис слідує за людиною: навички, досвід, кваліфікації, портфоліо та підтвердні матеріали залишаються пов’язаними з професіоналом навіть при зміні майстерні чи місця діяльності.",
    professionalHint: "Рекомендований стартовий варіант для індивідуальних майстрів і власників майстерень.",
    professionalCta: "Створити CraftID професіонала",
    workshop: "Майстерня",
    workshopText: "Для студії, майстерні або ремісничого мікропідприємства. Цей запис описує організацію або місце професійної діяльності: ремісничий напрям, можливості, командні зв’язки, бізнес-контекст і докази на рівні майстерні.",
    workshopHint: "Використовуйте для самої майстерні — не замість персонального запису майстра.",
    workshopCta: "Створити CraftID майстерні",
    note: "Кожен CraftID є постійним ідентифікатором однієї сутності. Він ніколи не замінюється, не видається повторно і не переноситься на іншу сутність. Якщо ви раніше закрили обліковий запис і повертаєтесь із тією самою підтвердженою email-адресою, CraftID відновить той самий архівний запис як чернетку замість видачі нового номера. Людина і майстерня можуть мати окремі CraftID та бути пов’язаними між собою. Номери 00000001–00000100 зарезервовані для окремого призначення адміністратором.",
  },
} as const;

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams;
  const locale = localeFrom(params.lang);
  const t = copy[locale];
  const q = locale === "en" ? "" : `?lang=${locale}`;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    redirect(`/login${q}`);
  }

  const { data: entity } = await supabase
    .from("craftid_entities")
    .select("id")
    .eq("owner_user_id", data.claims.sub)
    .neq("public_status", "archived")
    .limit(1)
    .maybeSingle();

  if (entity) {
    redirect(`/my-craftid${q}`);
  }

  return (
    <main className="onboardingPage">
      <div className="container">
        <div className="onboardingTopline">
          <a className="brand" href={`/${q}`}>CraftID</a>
          <LanguageMenu locale={locale} pathname="/onboarding" />
        </div>

        <div className="eyebrow">{t.eyebrow}</div>
        <h1 className="onboardingTitle">{t.title}</h1>
        <p className="onboardingIntro">{t.intro}</p>

        {params.error ? <p className="formMessage error">{params.error}</p> : null}

        <section className="onboardingGuide">
          <div className="eyebrow">{t.guideTitle}</div>
          <p>{t.guideText}</p>
        </section>

        <div className="choiceGrid">
          <form action={createCraftId} className="choiceCard">
            <input type="hidden" name="entityType" value="professional" />
            <input type="hidden" name="lang" value={locale} />
            <span className="choiceIndex">01</span>
            <h2>{t.professional}</h2>
            <p>{t.professionalText}</p>
            <small className="choiceHint">{t.professionalHint}</small>
            <button className="button buttonPrimary" type="submit">{t.professionalCta}</button>
          </form>

          <form action={createCraftId} className="choiceCard">
            <input type="hidden" name="entityType" value="workshop" />
            <input type="hidden" name="lang" value={locale} />
            <span className="choiceIndex">02</span>
            <h2>{t.workshop}</h2>
            <p>{t.workshopText}</p>
            <small className="choiceHint">{t.workshopHint}</small>
            <button className="button buttonPrimary" type="submit">{t.workshopCta}</button>
          </form>
        </div>

        <p className="onboardingNote">{t.note}</p>
      </div>
    </main>
  );
}
