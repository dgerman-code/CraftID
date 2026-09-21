import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localeFrom } from "@/components/site-shell";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ craftId: string }>;
  searchParams: Promise<{ lang?: string }>;
};

function parseCraftId(value: string) {
  const match = value.match(/^(?:#)?0*(\d+)-(\d{2})$/);
  if (!match) return null;
  const number = Number(match[1]);
  if (!Number.isSafeInteger(number) || number < 1) return null;
  return { number, check: match[2] };
}

function formatCraftId(number: number | string, check: string) {
  return `#${String(number).padStart(8, "0")}-${check}`;
}

const copy = {
  en: {
    identity: "Professional identity record",
    about: "About",
    skills: "Skills",
    location: "Location",
    links: "External presence",
    contact: "Contact through CraftID",
    notice: "CraftID is an independent professional identity and evidence infrastructure. This profile is not a quality certification or EU recognition.",
    unavailable: "Not available",
    website: "Website",
    linkedin: "LinkedIn",
    portfolio: "Portfolio",
  },
  uk: {
    identity: "Запис професійної ідентичності",
    about: "Про практику",
    skills: "Навички",
    location: "Місце",
    links: "Зовнішні профілі",
    contact: "Зв’язатися через CraftID",
    notice: "CraftID — незалежна інфраструктура професійної ідентичності та доказів. Цей профіль не є сертифікацією якості або визнанням ЄС.",
    unavailable: "Не вказано",
    website: "Вебсайт",
    linkedin: "LinkedIn",
    portfolio: "Портфоліо",
  },
} as const;

export default async function PublicCraftIdPage({ params, searchParams }: Props) {
  const { craftId } = await params;
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale];
  const q = locale === "uk" ? "?lang=uk" : "";

  const parsed = parseCraftId(craftId);
  if (!parsed) notFound();

  const supabase = await createClient();
  const { data: profile } = await supabase.rpc("public_craftid_profile", {
    p_craftid_number: parsed.number,
    p_check_digits: parsed.check,
  });

  const record = profile as {
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
    claims: { id: string; claim_type: string; title: string; status: string }[];
    links: { contact_type: string; value: string; verification_level: string }[];
  } | null;

  if (!record) notFound();

  const claims = record.claims.filter((claim) => claim.claim_type === "skill");
  const links = record.links;
  const location = record.location ?? "";

  const formatted = formatCraftId(record.craftid_number, record.craftid_check_digits);
  const routeId = formatted.replace("#", "");

  return (
    <main className="publicIdentityPage">
      <div className="container">
        <header className="publicIdentityHeader">
          <Link className="brand" href={`/${q}`}>CraftID</Link>
          <div className="recordId">{t.identity}</div>
        </header>

        <section className="publicIdentityHero">
          <div>
            <div className="recordId">CraftID {formatted}</div>
            <h1>{record.display_name}</h1>
            <p className="profileRole">{record.professional_title ?? record.craft_sector ?? ""}</p>
          </div>
          <div className="trustStamp">
            <span>CraftID</span>
            <strong>{formatted}</strong>
          </div>
        </section>

        <section className="publicIdentityGrid">
          <article>
            <div className="eyebrow">{t.about}</div>
            <p className="profileSummary">{record.about || t.unavailable}</p>

            <div className="profileBlock">
              <div className="eyebrow">{t.skills}</div>
              {claims?.length ? (
                <div className="tagRow">
                  {claims.map((claim) => <span className="tag" key={claim.id}>{claim.title}</span>)}
                </div>
              ) : <p>{t.unavailable}</p>}
            </div>
          </article>

          <aside>
            <div className="eyebrow">{t.location}</div>
            <p>{location || t.unavailable}</p>

            {links?.length ? (
              <div className="profileMetaBlock">
                <div className="eyebrow">{t.links}</div>
                <div className="contactPreviewList">
                  {links.map((item) => (
                    <a
                      key={item.contact_type}
                      href={item.value}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                    >
                      {t[item.contact_type as "website" | "linkedin" | "portfolio"] ?? item.contact_type} →
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="profileMetaBlock">
              <Link className="button buttonPrimary" href={`/contact/${routeId}${q}`}>{t.contact}</Link>
            </div>
          </aside>
        </section>

        <p className="publicIdentityNotice">{t.notice}</p>
      </div>
    </main>
  );
}
