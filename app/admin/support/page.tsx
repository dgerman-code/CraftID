import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCraftIdWithHash } from "@/lib/craftid-format";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    interest?: string;
    level?: string;
    type?: string;
    country?: string;
  }>;
};

type SummaryRow = {
  interest_code: string;
  label_en: string;
  label_uk: string;
  interested_count: number;
  actively_looking_count: number;
  total_count: number;
};

type SupportRow = {
  entity_id: string;
  craftid_number: number;
  craftid_check_digits: string;
  entity_type: string;
  display_name: string | null;
  country_code: string | null;
  interest_code: string;
  engagement_level: string;
  note: string | null;
  allow_relevant_contact: boolean;
  updated_at: string;
};

export default async function AdminSupportPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/my-craftid");

  const interest = sp.interest?.trim() || null;
  const level = ["interested", "actively_looking"].includes(sp.level ?? "")
    ? sp.level!
    : null;
  const entityType = ["professional", "workshop"].includes(sp.type ?? "")
    ? sp.type!
    : null;
  const country = sp.country?.trim().toUpperCase() || null;

  const [{ data: summary }, { data: rows }, { data: taxonomy }] = await Promise.all([
    supabase.rpc("admin_support_interest_summary"),
    supabase.rpc("admin_support_interest_records", {
      p_interest_code: interest,
      p_level: level,
      p_entity_type: entityType,
      p_country_code: country,
      p_limit: 200,
    }),
    supabase
      .from("support_interest_taxonomy")
      .select("code, label_en, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const summaryRows = (summary ?? []) as SummaryRow[];
  const supportRows = (rows ?? []) as SupportRow[];
  const labelByCode = new Map((taxonomy ?? []).map((item) => [item.code, item.label_en]));

  return (
    <main className="adminPage">
      <div className="adminPageHeader">
        <div>
          <div className="eyebrow">Needs intelligence</div>
          <h1>Support & interests</h1>
          <p>
            Self-declared needs from CraftID holders. This is operational intelligence only:
            no eligibility scoring or programme matching is performed.
          </p>
        </div>
      </div>

      <section className="adminMetricGrid">
        {summaryRows.map((item) => (
          <Link
            className="adminMetric"
            href={`/admin/support?interest=${encodeURIComponent(item.interest_code)}`}
            key={item.interest_code}
          >
            <span>{item.label_en}</span>
            <strong>{item.total_count}</strong>
            <small>{item.actively_looking_count} actively looking</small>
          </Link>
        ))}
      </section>

      <section className="adminPanel">
        <div className="adminPanelHeader">
          <div>
            <div className="eyebrow">Filter demand</div>
            <h2>Interest records</h2>
          </div>
          {(interest || level || entityType || country) ? (
            <Link href="/admin/support">Clear filters →</Link>
          ) : null}
        </div>

        <form className="registryToolbar" method="get" action="/admin/support">
          <label>
            <span>Interest</span>
            <select name="interest" defaultValue={interest ?? ""}>
              <option value="">All</option>
              {(taxonomy ?? []).map((item) => (
                <option value={item.code} key={item.code}>{item.label_en}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Level</span>
            <select name="level" defaultValue={level ?? ""}>
              <option value="">All</option>
              <option value="interested">Interested</option>
              <option value="actively_looking">Actively looking</option>
            </select>
          </label>
          <label>
            <span>Entity type</span>
            <select name="type" defaultValue={entityType ?? ""}>
              <option value="">All</option>
              <option value="professional">Professional</option>
              <option value="workshop">Workshop</option>
            </select>
          </label>
          <label>
            <span>Country code</span>
            <input name="country" maxLength={2} defaultValue={country ?? ""} placeholder="BE" />
          </label>
          <button className="button" type="submit">Apply</button>
        </form>

        <p className="privacyNote">
          Internal view. Support interests are not public profile fields. “May contact” reflects
          the holder’s current consent for CraftID or an authorised national operator to follow up.
        </p>

        <div className="adminTable">
          <div className="adminTableHead">
            <span>CraftID</span><span>Interest</span><span>Level</span><span>Contact</span>
          </div>
          {supportRows.length ? supportRows.map((row) => (
            <Link
              className="adminTableRow"
              href={`/admin/registry/${row.entity_id}`}
              key={`${row.entity_id}:${row.interest_code}`}
            >
              <span>
                <strong>{formatCraftIdWithHash(row.craftid_number, row.craftid_check_digits)}</strong>
                <small>
                  {[row.display_name, row.entity_type, row.country_code].filter(Boolean).join(" · ")}
                </small>
              </span>
              <span>
                <strong>{labelByCode.get(row.interest_code) ?? row.interest_code}</strong>
                {row.note ? <small>{row.note}</small> : null}
              </span>
              <span className="adminStatus">
                {row.engagement_level === "actively_looking" ? "Actively looking" : "Interested"}
              </span>
              <span>{row.allow_relevant_contact ? "May contact" : "No contact consent"}</span>
            </Link>
          )) : (
            <p className="emptyState">No support interests match these filters.</p>
          )}
        </div>
      </section>
    </main>
  );
}
