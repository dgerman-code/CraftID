import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";
import { saveSkillProfile } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ claimId: string }>;
  searchParams: Promise<{ lang?: string; entity?: string; error?: string; message?: string }>;
};

const optionLabels = {
  en: {
    rarely: "Rarely",
    regularly: "Regularly",
    core: "Core part of my practice",
    main_activity: "Main professional activity",
    active: "Currently practising",
    occasional: "Practised occasionally",
    temporarily_inactive: "Temporarily inactive",
    no_longer_active: "No longer practising",
    lt_1: "Less than 1 year",
    "1_3": "1–3 years",
    "4_7": "4–7 years",
    "8_15": "8–15 years",
    "15_plus": "15+ years",
    fully_handmade: "Entirely handmade",
    hand_tools: "Handmade using hand tools",
    machine_assisted_hand_defined: "Machine-assisted, but hand work determines the result",
    mostly_mechanised_with_hand_finishing: "Mostly mechanised/digital with hand finishing",
    digital_design_handmade: "Digital design with manual production",
    none: "Do not use",
    regular: "Regularly",
    non_commercial: "Non-commercial",
    occasional_paid: "Occasional paid work",
    regular_paid: "Regular paid work",
    main_income: "Main source of income",
    no: "No",
    yes: "Yes",
    with_support: "Yes, with support",
    not_applicable: "Not applicable",
    informal: "Informally",
    mentor: "As a mentor",
    apprenticeship: "Through apprenticeship",
    structured_training: "Through structured training",
  },
  uk: {
    rarely: "Рідко",
    regularly: "Регулярно",
    core: "Основна частина моєї практики",
    main_activity: "Головна професійна діяльність",
    active: "Практикую зараз",
    occasional: "Практикую час від часу",
    temporarily_inactive: "Тимчасово не практикую",
    no_longer_active: "Більше не практикую",
    lt_1: "Менше 1 року",
    "1_3": "1–3 роки",
    "4_7": "4–7 років",
    "8_15": "8–15 років",
    "15_plus": "15+ років",
    fully_handmade: "Повністю ручне виготовлення",
    hand_tools: "Ручне виготовлення з ручним інструментом",
    machine_assisted_hand_defined: "З використанням станків, але ручна робота визначає результат",
    mostly_mechanised_with_hand_finishing: "Переважно механізоване/цифрове виготовлення з ручною доводкою",
    digital_design_handmade: "Цифрове проєктування + ручне виготовлення",
    none: "Не використовую",
    regular: "Регулярно",
    non_commercial: "Некомерційне використання",
    occasional_paid: "Епізодична оплачувана робота",
    regular_paid: "Регулярна оплачувана робота",
    main_income: "Основне джерело доходу",
    no: "Ні",
    yes: "Так",
    with_support: "Так, за наявності підтримки",
    not_applicable: "Не застосовується",
    informal: "Неформально",
    mentor: "Як ментор",
    apprenticeship: "Через учнівство",
    structured_training: "Через структуроване навчання",
  },
} as const;

const copy = {
  en: {
    eyebrow: "Skill profile",
    back: "Back to Skills & Claims",
    title: "Describe how this skill is practised.",
    intro: "These answers strengthen CraftID intelligence while remaining clearly marked as self-declared unless later supported by evidence or review.",
    provenance: "Current provenance: self-declared",
    save: "Save answers",
    saved: "Skill profile saved.",
    questions: {
      "skill.usage_intensity": "How central is this skill to your current practice?",
      "skill.practice_status": "Do you currently practise this skill?",
      "skill.years_band": "How long have you practised this skill?",
      "skill.production_archetype": "How is work using this skill mainly performed?",
      "skill.digital_design_intensity": "How much do you use digital design with this skill?",
      "skill.digital_fabrication_intensity": "How much do you use digital fabrication with this skill?",
      "skill.repair_restoration_role": "What role does repair or restoration play?",
      "skill.commercial_relevance": "How commercially important is this skill?",
      "skill.apprenticeship_capacity": "Could you take an apprentice for this skill?",
      "skill.successor_status": "Is there an identified successor for this skill?",
      "skill.teaching_capacity": "Can you teach or transfer this skill?",
    },
  },
  uk: {
    eyebrow: "Профіль навички",
    back: "Назад до Навички та твердження",
    title: "Опишіть, як ви практикуєте цю навичку.",
    intro: "Ці відповіді підсилюють CraftID Intelligence, але залишаються чітко позначеними як самодекларовані, доки не будуть підтверджені доказами або перевіркою.",
    provenance: "Поточне походження даних: самодекларовано",
    save: "Зберегти відповіді",
    saved: "Профіль навички збережено.",
    questions: {
      "skill.usage_intensity": "Наскільки ця навичка є центральною у вашій поточній практиці?",
      "skill.practice_status": "Чи практикуєте ви цю навичку зараз?",
      "skill.years_band": "Як довго ви практикуєте цю навичку?",
      "skill.production_archetype": "Як переважно виконується робота з цією навичкою?",
      "skill.digital_design_intensity": "Наскільки ви використовуєте цифрове проєктування?",
      "skill.digital_fabrication_intensity": "Наскільки ви використовуєте цифрове виготовлення?",
      "skill.repair_restoration_role": "Яку роль відіграє ремонт або реставрація?",
      "skill.commercial_relevance": "Яке комерційне значення має ця навичка?",
      "skill.apprenticeship_capacity": "Чи можете ви прийняти учня для цієї навички?",
      "skill.successor_status": "Чи є визначений наступник для цієї навички?",
      "skill.teaching_capacity": "Чи можете ви навчати або передавати цю навичку?",
    },
  },
} as const;

export default async function SkillProfilePage({ params, searchParams }: Props) {
  const { claimId } = await params;
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];
  const labels = optionLabels[locale];
  const { supabase, userId, entity } = await getOwnedCraftId(sp.entity);
  if (!userId) redirect(locale === "uk" ? "/login?lang=uk" : "/login");
  if (!entity) redirect(locale === "uk" ? "/my-craftid?lang=uk" : "/my-craftid");
  const q = ownerWorkspaceQuery(locale, entity.id);

  const { data: claim } = await supabase
    .from("claims")
    .select("id, entity_id, title, taxonomy_term_id, claim_type")
    .eq("id", claimId)
    .eq("claim_type", "skill")
    .single();

  if (!claim) redirect(`/my-craftid/claims${q}`);

  if (claim.entity_id !== entity.id) redirect(`/my-craftid/claims${q}`);

  const [{ data: definitions }, { data: observations }] = await Promise.all([
    supabase
      .from("indicator_definition_versions")
      .select("id, indicator_key, label_en, label_uk, options, version, is_current, indicator_definitions!inner(scope, sort_order, is_active)")
      .eq("is_current", true)
      .eq("indicator_definitions.scope", "skill")
      .eq("indicator_definitions.is_active", true)
      .order("indicator_definitions(sort_order)"),
    supabase
      .from("current_observations")
      .select("indicator_key, value, provenance_status, observed_at")
      .eq("claim_id", claim.id),
  ]);

  const current = new Map((observations ?? []).map((o) => [o.indicator_key, String(o.value)]));

  return (
    <main className="workspacePage">
      <div className="container workspaceNarrow">
        <Link className="backLink" href={`/my-craftid/claims${q}`}>← {t.back}</Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{claim.title}</h1>
        <p className="workspaceIntro">{t.title}</p>
        <p className="privacyNote">{t.intro}</p>
        <div className="provenanceBadge">{t.provenance}</div>

        {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
        {sp.message ? <p className="formMessage">{t.saved}</p> : null}

        <form className="indicatorForm" action={saveSkillProfile}>
          <input type="hidden" name="lang" value={locale} />
          <input type="hidden" name="claimId" value={claim.id} />
          <input type="hidden" name="entityId" value={entity.id} />

          {definitions?.map((definition) => {
            const options = Array.isArray(definition.options) ? definition.options as string[] : [];
            return (
              <label className="indicatorQuestion" key={definition.id}>
                <span>{t.questions[definition.indicator_key as keyof typeof t.questions] ?? (locale === "uk" ? definition.label_uk : definition.label_en)}</span>
                <select name={definition.indicator_key} defaultValue={current.get(definition.indicator_key) ?? ""}>
                  <option value="">{locale === "uk" ? "Оберіть відповідь" : "Choose an answer"}</option>
                  {options.map((option) => (
                    <option value={option} key={option}>
                      {labels[option as keyof typeof labels] ?? option.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}

          <button className="button buttonPrimary" type="submit">{t.save}</button>
        </form>
      </div>
    </main>
  );
}
