import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{
    lang?: string;
    craftid?: string;
    q?: string;
    craft?: string;
    country?: string;
    type?: string;
  }>;
};

type PublicClaim = {
  id: string;
  claim_type: string;
  title: string;
  status: string;
};

type PublicRecord = {
  craftid_number: number;
  craftid_check_digits: string;
  entity_type: "professional" | "workshop";
  display_name: string;
  professional_title: string | null;
  craft_sector: string | null;
  location: string | null;
  about: string | null;
  has_public_photo: boolean;
  languages: string[];
  claims: PublicClaim[];
  links: { contact_type: string; value: string; verification_level: string }[];
};

function parseCraftId(value: string) {
  const compact = value.trim().replace(/^CraftID\s*/i, "").replace(/^#/, "");
  const match = compact.match(/^0*(\d+)-(\d{2})$/);
  if (!match) return null;

  const number = Number(match[1]);
  if (!Number.isSafeInteger(number) || number < 1) return null;

  return {
    number,
    check: match[2],
    route: `${String(number).padStart(8, "0")}-${match[2]}`,
  };
}

function formatCraftId(number: number, check: string) {
  return `#${String(number).padStart(8, "0")}-${check}`;
}

function normalized(value?: string) {
  return (value ?? "").trim().toLocaleLowerCase();
}

function locationCountry(location: string | null) {
  if (!location) return "";
  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.at(-1) ?? "";
}

const statusRank: Record<string, number> = {
  self_declared: 0,
  evidence_submitted: 1,
  document_reviewed: 2,
  evidence_reviewed: 3,
  external_source_confirmed: 4,
  identity_reviewed: 1,
};

function strongestClaimStatus(claims: PublicClaim[]) {
  const relevant = claims.filter((claim) => claim.claim_type !== "identity");
  if (!relevant.length) return null;
  return [...relevant].sort(
    (a, b) => (statusRank[b.status] ?? -1) - (statusRank[a.status] ?? -1),
  )[0]?.status ?? null;
}

const statusCopy = {
  en: {
    self_declared: "Self-declared",
    evidence_submitted: "Evidence submitted",
    document_reviewed: "Document reviewed",
    evidence_reviewed: "Evidence reviewed",
    external_source_confirmed: "External source confirmed",
    identity_reviewed: "Identity reviewed",
  },
  uk: {
    self_declared: "Самодекларовано",
    evidence_submitted: "Докази подано",
    document_reviewed: "Документ переглянуто",
    evidence_reviewed: "Докази переглянуто",
    external_source_confirmed: "Зовнішнє джерело підтверджено",
    identity_reviewed: "Особу перевірено",
  },
} as const;

const copy = {
  en: {
    eyebrow: "Public registry",
    title: "Discover professional craft practice.",
    intro: "Find a specific CraftID record directly, or explore published professionals and workshops by craft, skill and location.",
    idEyebrow: "Direct CraftID lookup",
    idTitle: "Find a CraftID record",
    idText: "Use the permanent CraftID number to open a published professional or workshop record directly.",
    idLabel: "CraftID number",
    idPlaceholder: "#00000101-86",
    idButton: "Open record",
    idHint: "Enter the full CraftID number, including the two check digits.",
    idInvalid: "Enter a valid CraftID in the format #00000101-86.",
    idMissing: "No published CraftID record was found for that number.",
    browseEyebrow: "Browse registry",
    browseTitle: "Explore by professional context",
    note: "Public location is shown only at the level selected by the profile owner. Individual professionals default to city- or region-level visibility.",
    search: "Search registry",
    placeholder: "Name, craft or skill",
    craft: "Craft / skill",
    country: "Country",
    type: "Profile type",
    all: "All",
    professional: "Professional",
    workshop: "Workshop",
    results: "Published records",
    oneResult: "published record",
    manyResults: "published records",
    empty: "No published records match these filters.",
    clear: "Clear filters",
    open: "Open record",
    claimStatus: "Highest visible claim status",
    noClaimStatus: "No reviewed public claim",
    mapTitle: "Territorial skills visibility",
    mapText: "CraftID can support privacy-safe mapping of professional and workshop locations to make regional skill clusters and craft ecosystems more visible over time.",
    mapCta: "Map view — coming next",
  },
  uk: {
    eyebrow: "Публічний реєстр",
    title: "Відкривайте професійну ремісничу практику.",
    intro: "Знайдіть конкретний запис CraftID за номером або переглядайте опубліковані профілі професіоналів і майстерень за ремеслом, навичками та місцем.",
    idEyebrow: "Прямий пошук CraftID",
    idTitle: "Знайти запис CraftID",
    idText: "Використовуйте постійний номер CraftID, щоб одразу відкрити опублікований запис професіонала або майстерні.",
    idLabel: "Номер CraftID",
    idPlaceholder: "#00000101-86",
    idButton: "Відкрити запис",
    idHint: "Введіть повний номер CraftID разом із двома контрольними цифрами.",
    idInvalid: "Введіть коректний CraftID у форматі #00000101-86.",
    idMissing: "Опублікований запис CraftID з таким номером не знайдено.",
    browseEyebrow: "Пошук у реєстрі",
    browseTitle: "Пошук за професійним контекстом",
    note: "Публічне місце відображається лише з точністю, обраною власником профілю. Для індивідуальних професіоналів типовим є рівень міста або регіону.",
    search: "Пошук у реєстрі",
    placeholder: "Ім’я, ремесло або навичка",
    craft: "Ремесло / навичка",
    country: "Країна",
    type: "Тип профілю",
    all: "Усі",
    professional: "Професіонал",
    workshop: "Майстерня",
    results: "Опубліковані записи",
    oneResult: "опублікований запис",
    manyResults: "опублікованих записів",
    empty: "За цими фільтрами опублікованих записів не знайдено.",
    clear: "Очистити фільтри",
    open: "Відкрити запис",
    claimStatus: "Найвищий статус видимого твердження",
    noClaimStatus: "Немає переглянутих публічних тверджень",
    mapTitle: "Територіальна видимість навичок",
    mapText: "CraftID може підтримувати приватно-безпечне картографування розташування фахівців і майстерень, щоб з часом зробити видимішими регіональні кластери навичок і ремісничі екосистеми.",
    mapCta: "Карта — наступний етап",
  },
} as const;

export default async function DiscoverPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = localeFrom(params.lang);
  const t = copy[locale];
  const q = locale === "uk" ? "?lang=uk" : "";
  const supabase = await createClient();
  let lookupError: string | null = null;

  if (params.craftid) {
    const parsed = parseCraftId(params.craftid);

    if (!parsed) {
      lookupError = t.idInvalid;
    } else {
      const { data: profile } = await supabase.rpc("public_craftid_profile", {
        p_craftid_number: parsed.number,
        p_check_digits: parsed.check,
      });

      if (profile) {
        redirect(`/id/${parsed.route}${q}`);
      }

      lookupError = t.idMissing;
    }
  }

  const { data: publishedEntities } = await supabase
    .from("craftid_entities")
    .select("craftid_number, craftid_check_digits")
    .eq("public_status", "published")
    .order("craftid_number", { ascending: true })
    .limit(100);

  const resolved = await Promise.all(
    (publishedEntities ?? []).map(async (entity) => {
      const { data } = await supabase.rpc("public_craftid_profile", {
        p_craftid_number: entity.craftid_number,
        p_check_digits: entity.craftid_check_digits,
      });
      return (data ?? null) as PublicRecord | null;
    }),
  );

  const publicRecords = resolved.filter((record): record is PublicRecord => Boolean(record));

  const craftOptions = Array.from(
    new Set(
      publicRecords.flatMap((record) => [
        ...(record.claims ?? [])
          .filter((claim) => claim.claim_type === "skill")
          .map((claim) => claim.title),
        record.professional_title ?? record.craft_sector ?? "",
      ]).filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const countryOptions = Array.from(
    new Set(publicRecords.map((record) => locationCountry(record.location)).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const searchTerm = normalized(params.q);
  const craftFilter = normalized(params.craft);
  const countryFilter = normalized(params.country);
  const typeFilter = normalized(params.type);

  const filteredRecords = publicRecords.filter((record) => {
    const skills = (record.claims ?? [])
      .filter((claim) => claim.claim_type === "skill")
      .map((claim) => claim.title);
    const role = record.professional_title ?? record.craft_sector ?? "";
    const searchable = [
      record.display_name,
      role,
      record.location ?? "",
      ...skills,
    ].join(" ").toLocaleLowerCase();

    const matchesSearch = !searchTerm || searchable.includes(searchTerm);
    const matchesCraft =
      !craftFilter ||
      [role, ...skills].some((value) => normalized(value) === craftFilter);
    const matchesCountry =
      !countryFilter || normalized(locationCountry(record.location)) === countryFilter;
    const matchesType = !typeFilter || normalized(record.entity_type) === typeFilter;

    return matchesSearch && matchesCraft && matchesCountry && matchesType;
  });

  const filterQuery = new URLSearchParams();
  if (locale === "uk") filterQuery.set("lang", "uk");

  return (
    <>
      <SiteHeader locale={locale} pathname="/discover" />
      <main>
        <section className="pageHero registryHero">
          <div className="container">
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
          </div>
        </section>

        <section className="craftIdLookupSection">
          <div className="container craftIdLookupGrid">
            <div className="craftIdLookupIntro">
              <div className="eyebrow">{t.idEyebrow}</div>
              <h2>{t.idTitle}</h2>
              <p>{t.idText}</p>
            </div>
            <form className="craftIdLookupForm" method="get" action="/discover">
              {locale === "uk" ? <input type="hidden" name="lang" value="uk" /> : null}
              <label htmlFor="craftid-lookup">{t.idLabel}</label>
              <div className="craftIdLookupControl">
                <input
                  id="craftid-lookup"
                  name="craftid"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={t.idPlaceholder}
                  defaultValue={params.craftid ?? ""}
                  aria-describedby="craftid-hint"
                />
                <button className="button buttonPrimary" type="submit">{t.idButton}</button>
              </div>
              <p id="craftid-hint" className="craftIdLookupHint">{t.idHint}</p>
              {lookupError ? <p className="formMessage error">{lookupError}</p> : null}
            </form>
          </div>
        </section>

        <section className="section compactSection registryBrowseSection">
          <div className="container">
            <div className="registryBrowseHeading">
              <div className="eyebrow">{t.browseEyebrow}</div>
              <h2>{t.browseTitle}</h2>
            </div>

            <form className="registryToolbar" method="get" action="/discover">
              {locale === "uk" ? <input type="hidden" name="lang" value="uk" /> : null}
              <label className="searchField">
                <span>{t.search}</span>
                <input name="q" placeholder={t.placeholder} defaultValue={params.q ?? ""} />
              </label>
              <label>
                <span>{t.craft}</span>
                <select name="craft" defaultValue={params.craft ?? ""}>
                  <option value="">{t.all}</option>
                  {craftOptions.map((craft) => <option value={craft} key={craft}>{craft}</option>)}
                </select>
              </label>
              <label>
                <span>{t.country}</span>
                <select name="country" defaultValue={params.country ?? ""}>
                  <option value="">{t.all}</option>
                  {countryOptions.map((country) => <option value={country} key={country}>{country}</option>)}
                </select>
              </label>
              <label>
                <span>{t.type}</span>
                <select name="type" defaultValue={params.type ?? ""}>
                  <option value="">{t.all}</option>
                  <option value="professional">{t.professional}</option>
                  <option value="workshop">{t.workshop}</option>
                </select>
              </label>
              <button className="button" type="submit">{locale === "uk" ? "Застосувати" : "Apply"}</button>
            </form>

            <div className="registrySummary">
              <span>
                {filteredRecords.length} {filteredRecords.length === 1 ? t.oneResult : t.manyResults}
              </span>
              {(params.q || params.craft || params.country || params.type) ? (
                <Link href={`/discover${filterQuery.size ? `?${filterQuery.toString()}` : ""}`}>
                  {t.clear}
                </Link>
              ) : null}
            </div>

            <p className="privacyNote">{t.note}</p>
          </div>
        </section>

        <section className="section registryResultsSection">
          <div className="container">
            <div className="eyebrow">{t.results}</div>
            {filteredRecords.length ? (
              <div className="recordList">
                {filteredRecords.map((record, index) => {
                  const skills = (record.claims ?? [])
                    .filter((claim) => claim.claim_type === "skill")
                    .slice(0, 4);
                  const status = strongestClaimStatus(record.claims ?? []);
                  const formatted = formatCraftId(record.craftid_number, record.craftid_check_digits);
                  const route = formatted.replace("#", "");
                  const role = record.professional_title ?? record.craft_sector ?? "";
                  const statusLabel = status
                    ? statusCopy[locale][status as keyof (typeof statusCopy)[typeof locale]] ?? status
                    : t.noClaimStatus;

                  return (
                    <article className="publicRecord registryRecord" key={formatted}>
                      <div className="recordNumber">{String(index + 1).padStart(2, "0")}</div>
                      <div>
                        <div className="recordId">CraftID {formatted}</div>
                        <h2>{record.display_name}</h2>
                        <p className="recordRole">
                          {[role, record.location].filter(Boolean).join(" · ")}
                        </p>
                        {record.about ? <p>{record.about}</p> : null}
                        {skills.length ? (
                          <div className="tagRow">
                            {skills.map((skill) => <span className="tag" key={skill.id}>{skill.title}</span>)}
                          </div>
                        ) : null}
                      </div>
                      <div className="recordStatus">
                        <span className="recordStatusLabel">{t.claimStatus}</span>
                        <strong>{statusLabel}</strong>
                        <Link href={`/id/${route}${q}`}>{t.open} →</Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="registryEmpty">
                <p>{t.empty}</p>
                <Link href={`/discover${filterQuery.size ? `?${filterQuery.toString()}` : ""}`}>{t.clear} →</Link>
              </div>
            )}
          </div>
        </section>

        <section className="section trustBand">
          <div className="container trustBandInner">
            <div>
              <div className="eyebrow">{locale === "uk" ? "Карта" : "Map"}</div>
              <h2>{t.mapTitle}</h2>
              <p>{t.mapText}</p>
            </div>
            <span className="button buttonDisabled">{t.mapCta}</span>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
