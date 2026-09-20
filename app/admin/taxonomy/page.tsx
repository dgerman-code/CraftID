import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveTaxonomyTerm } from "./actions";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ error?: string; message?: string; edit?: string }> };

export default async function TaxonomyAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/admin");

  const { data: terms } = await supabase
    .from("taxonomy_terms")
    .select("id, parent_id, term_type, stable_key, label_en, label_uk, description_en, description_uk, sort_order, is_active")
    .order("sort_order", { ascending: true })
    .order("label_en", { ascending: true });

  const edit = sp.edit ? (terms ?? []).find((t) => t.id === sp.edit) : null;
  const parentOptions = (terms ?? []).filter((t) => t.id !== edit?.id);

  return (
    <main className="adminPage">
      <div className="adminPageHeader">
        <div className="eyebrow">Classification governance</div>
        <h1>Taxonomy Management</h1>
        <p>Maintain CraftID-native categories, professions and skills. Stable keys are immutable once created; external mappings remain a separate interoperability layer.</p>
      </div>

      {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
      {sp.message ? <p className="formMessage">Taxonomy term saved.</p> : null}

      <div className="adminDetailGrid">
        <section className="adminPanel">
          <div className="adminPanelHeader"><div><div className="eyebrow">Current terms</div><h2>CraftID taxonomy</h2></div><span>{terms?.length ?? 0}</span></div>
          <div className="adminTable">
            <div className="adminTableHead adminTaxonomyColumns"><span>Key / Label</span><span>Type</span><span>Parent</span><span>Status</span><span></span></div>
            {(terms ?? []).map((term) => {
              const parent = (terms ?? []).find((p) => p.id === term.parent_id);
              return (
                <div className="adminTableRow adminTaxonomyColumns" key={term.id}>
                  <div className="adminRegistryIdentity"><strong>{term.stable_key}</strong><span>{term.label_en}</span><small>{term.label_uk}</small></div>
                  <span>{term.term_type}</span>
                  <span>{parent?.label_en ?? "—"}</span>
                  <span className="adminStatus">{term.is_active ? "active" : "inactive"}</span>
                  <a className="textButton" href={`/admin/taxonomy?edit=${term.id}`}>Edit</a>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="adminPanel">
          <div className="eyebrow">{edit ? "Edit term" : "New term"}</div>
          <h2>{edit ? edit.label_en : "Create taxonomy term"}</h2>
          <form className="adminStatusForm" action={saveTaxonomyTerm}>
            <input type="hidden" name="id" value={edit?.id ?? ""} />
            <label>Type<select name="termType" defaultValue={edit?.term_type ?? "skill"}><option value="craft_category">Craft category</option><option value="profession">Profession</option><option value="skill">Skill</option></select></label>
            <label>Stable key<input name="stableKey" required readOnly={Boolean(edit)} defaultValue={edit?.stable_key ?? ""} placeholder="wood.joinery" /></label>
            <label>Parent<select name="parentId" defaultValue={edit?.parent_id ?? ""}><option value="">No parent</option>{parentOptions.map((term) => <option key={term.id} value={term.id}>{term.label_en} · {term.stable_key}</option>)}</select></label>
            <label>English label<input name="labelEn" required defaultValue={edit?.label_en ?? ""} /></label>
            <label>Ukrainian label<input name="labelUk" required defaultValue={edit?.label_uk ?? ""} /></label>
            <label>English description<textarea name="descriptionEn" rows={3} defaultValue={edit?.description_en ?? ""} /></label>
            <label>Ukrainian description<textarea name="descriptionUk" rows={3} defaultValue={edit?.description_uk ?? ""} /></label>
            <label>Sort order<input name="sortOrder" type="number" defaultValue={edit?.sort_order ?? 0} /></label>
            <label className="adminCheckbox"><input name="isActive" type="checkbox" defaultChecked={edit?.is_active ?? true} /> Active</label>
            <button className="button buttonPrimary" type="submit">Save term</button>
          </form>
        </aside>
      </div>
    </main>
  );
}
