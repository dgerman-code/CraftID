import Link from "next/link";
import { redirect } from "next/navigation";
import { localeFrom, localeQuery } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ lang?: string }> };

type PartnerOrg = {
  id: string;
  legal_name_en: string;
  legal_name_uk: string | null;
  short_name_en: string | null;
  short_name_uk: string | null;
  country_code: string;
  partner_role: string;
};

export default async function PartnerDashboard({ searchParams }: Props) {
  const locale = localeFrom((await searchParams).lang);
  const q = localeQuery(locale);
  const ua = locale === "uk";
  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) {
    redirect(`/login${q ? `${q}&` : "?"}next=${encodeURIComponent(`/partner${q}`)}`);
  }

  const { data, error } = await supabase.rpc("current_partner_organisations");
  if (error) throw new Error(error.message);
  const organisations = (data ?? []) as PartnerOrg[];
  if (!organisations.length) redirect(`/my-craftid${q}`);

  return (
    <main className="workspacePage">
      <div className="container">
        <div className="partnerPortalTop">
          <div>
            <div className="eyebrow">{ua ? "Партнерський доступ" : "Partner access"}</div>
            <h1>{ua ? "Робочий простір партнера CraftID" : "CraftID Partner Workspace"}</h1>
            <p className="workspaceIntro">
              {ua
                ? "Публікуйте можливості для ремісників і майстерень та відповідайте на запити зацікавлених власників CraftID."
                : "Publish opportunities for craftspeople and workshops and respond to interest from CraftID holders."}
            </p>
          </div>
          <form action={logout}>
            <input type="hidden" name="lang" value={locale} />
            <button className="button" type="submit">{ua ? "Вийти" : "Sign out"}</button>
          </form>
        </div>

        <section className="partnerOrgGrid">
          {organisations.map((org) => (
            <article className="partnerOrgCard" key={org.id}>
              <div className="recordId">{org.country_code} · {org.partner_role === "national_operator" ? (ua ? "Національний оператор" : "National Operator") : (ua ? "Партнер країни" : "Country Partner")}</div>
              <h2>{ua ? org.short_name_uk || org.legal_name_uk || org.short_name_en || org.legal_name_en : org.short_name_en || org.legal_name_en}</h2>
              <small>{org.legal_name_en}</small>
            </article>
          ))}
        </section>

        <section className="dashboardModules partnerPortalModules">
          <Link className="dashboardModule" href={`/partner/opportunities${q}`}>
            <span className="eyebrow">{ua ? "Контент" : "Content"}</span>
            <strong>{ua ? "Можливості" : "Opportunities"}</strong>
            <p>{ua ? "Додавайте гранти, конкурси, навчання, виставки, резиденції, події та інші можливості." : "Add grants, calls, training, fairs, residencies, events and other opportunities."}</p>
            <span className="moduleArrow">→</span>
          </Link>
          <Link className="dashboardModule" href={`/partner/interests${q}`}>
            <span className="eyebrow">{ua ? "Взаємодія" : "Interaction"}</span>
            <strong>{ua ? "Запити зацікавлених" : "Interest requests"}</strong>
            <p>{ua ? "Переглядайте запити від власників CraftID і надсилайте відповідь через платформу." : "Review requests from CraftID holders and send a response through the platform."}</p>
            <span className="moduleArrow">→</span>
          </Link>
        </section>

        <p className="privacyNote">
          {ua
            ? "Партнерський доступ не надає доступу до приватних даних власників CraftID. Контактні дані відображаються лише тоді, коли користувач сам погодився ними поділитися."
            : "Partner access does not expose private CraftID holder data. Contact details are shown only when a holder explicitly chose to share them."}
        </p>
      </div>
    </main>
  );
}
