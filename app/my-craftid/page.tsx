import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";

export const dynamic = "force-dynamic";

function formatCraftId(value: number | string) {
  return `#${String(value).padStart(8, "0")}`;
}

export default async function MyCraftIdPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: entity } = await supabase
    .from("craftid_entities")
    .select("id, craftid_number, entity_type, public_status")
    .eq("owner_user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!entity) {
    redirect("/onboarding");
  }

  const profile =
    entity.entity_type === "professional"
      ? await supabase
          .from("professional_profiles")
          .select("display_name, professional_title, country_code, region, city")
          .eq("entity_id", entity.id)
          .single()
      : await supabase
          .from("workshop_profiles")
          .select("display_name, craft_sector, country_code, region, city")
          .eq("entity_id", entity.id)
          .single();

  const record = profile.data as
    | {
        display_name: string;
        professional_title?: string | null;
        craft_sector?: string | null;
        country_code?: string | null;
        region?: string | null;
        city?: string | null;
      }
    | null;

  return (
    <main className="recordPage">
      <div className="container">
        <div className="recordTopbar">
          <div>
            <div className="eyebrow">My CraftID</div>
            <h1>{formatCraftId(entity.craftid_number)}</h1>
          </div>
          <form action={logout}>
            <button className="button" type="submit">
              Sign out
            </button>
          </form>
        </div>

        <div className="recordGrid">
          <section className="recordPrimary">
            <span className="recordType">{entity.entity_type}</span>
            <h2>{record?.display_name ?? "CraftID record"}</h2>
            <p>
              {record?.professional_title ??
                record?.craft_sector ??
                "Complete your profile to describe your professional practice."}
            </p>
            <div className="recordMeta">
              <span>Status: {entity.public_status}</span>
              <span>
                Location:{" "}
                {[record?.city, record?.region, record?.country_code]
                  .filter(Boolean)
                  .join(", ") || "Not set"}
              </span>
            </div>
          </section>

          <aside className="recordAside">
            <div className="eyebrow">Next steps</div>
            <ol>
              <li>Complete profile information</li>
              <li>Add professional skills</li>
              <li>Add experience and qualifications</li>
              <li>Link supporting evidence</li>
              <li>Review privacy and publish</li>
            </ol>
          </aside>
        </div>
      </div>
    </main>
  );
}
