import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCraftId } from "./actions";

type OnboardingPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    redirect("/login");
  }

  const { data: entity } = await supabase
    .from("craftid_entities")
    .select("id")
    .eq("owner_user_id", data.claims.sub)
    .limit(1)
    .maybeSingle();

  if (entity) {
    redirect("/my-craftid");
  }

  return (
    <main className="onboardingPage">
      <div className="container">
        <div className="eyebrow">CraftID setup</div>
        <h1 className="onboardingTitle">What will this CraftID represent?</h1>
        <p className="onboardingIntro">
          Choose the record type. This defines the first profile structure and
          can be extended later through affiliations.
        </p>

        {params.error ? <p className="formMessage error">{params.error}</p> : null}

        <div className="choiceGrid">
          <form action={createCraftId} className="choiceCard">
            <input type="hidden" name="entityType" value="professional" />
            <span className="choiceIndex">01</span>
            <h2>Professional</h2>
            <p>
              For an individual craft practitioner with skills, experience,
              qualifications, portfolio and evidence.
            </p>
            <button className="button buttonPrimary" type="submit">
              Create professional CraftID
            </button>
          </form>

          <form action={createCraftId} className="choiceCard">
            <input type="hidden" name="entityType" value="workshop" />
            <span className="choiceIndex">02</span>
            <h2>Workshop</h2>
            <p>
              For a studio, workshop or craft-based micro-enterprise with
              capabilities, team, capacity and portfolio.
            </p>
            <button className="button buttonPrimary" type="submit">
              Create workshop CraftID
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
