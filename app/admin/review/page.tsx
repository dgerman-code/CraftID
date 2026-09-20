import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localeFrom } from "@/components/site-shell";
import { submitReview } from "./actions";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; error?: string; message?: string }> };

const copy = {
  en: {
    eyebrow: "Review workspace",
    title: "Review evidence against a specific claim.",
    intro: "Review decisions apply to individual claims and linked evidence. They do not certify the whole professional or workshop.",
    queue: "Review queue",
    empty: "There are no claim-evidence links available for review.",
    decision: "Decision",
    result: "Resulting claim status",
    notes: "Private reviewer notes",
    submit: "Record review",
    done: "Review recorded.",
    back: "Back to CraftID",
    noAccess: "Reviewer access required.",
  },
  uk: {
    eyebrow: "Робоче місце перевірки",
    title: "Перевіряйте докази щодо конкретного твердження.",
    intro: "Рішення перевірки застосовуються до окремих тверджень і пов’язаних доказів. Вони не сертифікують професіонала чи майстерню в цілому.",
    queue: "Черга перевірки",
    empty: "Немає зв’язків між твердженнями та доказами, доступних для перевірки.",
    decision: "Рішення",
    result: "Підсумковий статус твердження",
    notes: "Приватні нотатки рецензента",
    submit: "Зафіксувати перевірку",
    done: "Перевірку зафіксовано.",
    back: "Назад до CraftID",
    noAccess: "Потрібен доступ рецензента.",
  },
} as const;

export default async function ReviewPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = localeFrom(params.lang);
  const t = copy[locale];
  const q = locale === "uk" ? "?lang=uk" : "";

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) redirect(`/login${q}`);

  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "reviewer" && role !== "admin") redirect(`/my-craftid${q}`);

  const { data: links } = await supabase
    .from("claim_evidence_links")
    .select("claim_id, evidence_id, claims(id, title, claim_type, status), evidence_items(id, title, evidence_type, issuer, review_status)")
    .limit(50);

  return (
    <main className="workspacePage">
      <div className="container">
        <Link className="backLink" href={`/${q}`}>← {t.back}</Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="workspaceIntro">{t.intro}</p>

        {params.error ? <p className="formMessage error">{params.error}</p> : null}
        {params.message ? <p className="formMessage">{t.done}</p> : null}

        <section className="reviewQueue">
          <div className="eyebrow">{t.queue}</div>
          {!links?.length ? (
            <p className="emptyState">{t.empty}</p>
          ) : (
            links.map((link) => {
              const claim = Array.isArray(link.claims) ? link.claims[0] : link.claims;
              const evidence = Array.isArray(link.evidence_items) ? link.evidence_items[0] : link.evidence_items;
              if (!claim || !evidence) return null;

              return (
                <article className="reviewCard" key={`${link.claim_id}-${link.evidence_id}`}>
                  <div className="reviewSummary">
                    <div>
                      <span className="recordId">{claim.claim_type.replaceAll("_", " ")}</span>
                      <h2>{claim.title}</h2>
                      <p>{evidence.title}{evidence.issuer ? ` · ${evidence.issuer}` : ""}</p>
                    </div>
                    <div className="reviewState">
                      <span>Claim: {claim.status.replaceAll("_", " ")}</span>
                      <span>Evidence: {evidence.review_status.replaceAll("_", " ")}</span>
                    </div>
                  </div>

                  <form className="reviewForm" action={submitReview}>
                    <input type="hidden" name="lang" value={locale} />
                    <input type="hidden" name="claimId" value={claim.id} />
                    <input type="hidden" name="evidenceId" value={evidence.id} />
                    <label>{t.decision}
                      <select name="decision" defaultValue="supports_claim">
                        <option value="supports_claim">Supports claim</option>
                        <option value="needs_clarification">Needs clarification</option>
                        <option value="unable_to_determine">Unable to determine</option>
                        <option value="does_not_support_claim">Does not support claim</option>
                      </select>
                    </label>
                    <label>{t.result}
                      <select name="resultingStatus" defaultValue="evidence_reviewed">
                        <option value="evidence_submitted">Evidence submitted</option>
                        <option value="document_reviewed">Document reviewed</option>
                        <option value="evidence_reviewed">Evidence reviewed</option>
                        <option value="external_source_confirmed">External source confirmed</option>
                        <option value="identity_reviewed">Identity reviewed</option>
                      </select>
                    </label>
                    <label>{t.notes}<textarea name="privateNotes" rows={4} /></label>
                    <button className="button buttonPrimary" type="submit">{t.submit}</button>
                  </form>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
