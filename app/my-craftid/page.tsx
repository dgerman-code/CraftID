import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/login/actions";
import { localeFrom } from "@/components/site-shell";
import { closeCraftIdAccount, createAdditionalCraftId } from "./actions";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { formatCraftId } from "@/lib/craftid-format";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ lang?: string; entity?: string; error?: string; message?: string }>;
};

const copy = {
  en: {
    eyebrow: "My CraftID",
    signOut: "Sign out",
    recordFallback: "CraftID record",
    complete: "Add a professional title or craft sector to describe your practice.",
    current: "Your published record is live. Keep its professional information and evidence current.",
    addTitle: "Add a professional title or craft sector",
    addLocation: "Add a public city or region",
    addSkills: "Add professional skills",
    addExperience: "Add experience or qualifications",
    addEvidence: "Link supporting evidence",
    reviewPublish: "Review privacy and publish",
    maintain: "Review your published record and keep it current",
    status: "Status",
    location: "Location",
    notSet: "Not set",
    next: "Next steps",
    profile: "Profile",
    profileText: "Manage the information that describes you or your workshop.",
    skills: "Skills & claims",
    skillsText: "Build structured claims around skills, experience and qualifications.",
    evidence: "Evidence",
    evidenceText: "Manage private supporting material linked to individual claims.",
    privacy: "Privacy",
    privacyText: "Choose what is visible publicly and how precise your location may be.",
    public: "Public profile",
    publicText: "Preview the record before publication or review the live public version.",
    requests: "Contact requests",
    requestsText: "Review controlled enquiries without publishing your private email or phone.",
    referrals: "Institutional opportunities",
    referralsText: "Review project, partnership, training and commission invitations routed through CraftID.",
    support: "Opportunities & Support",
    supportText: "Tell CraftID what kinds of funding, advice, training, partnerships and other support are relevant to you.",
    certificate: "CraftID Certificate",
    certificateText: "Issue and download a versioned identity certificate with a public Certificate ID and QR verification.",
    mark: "CraftID Mark",
    markText: "Use your CraftID on websites, product cards, workshop signage and print. The mark identifies a CraftID record; it is not a certification or quality seal.",
    open: "Open",
    typeProfessional: "Professional",
    typeWorkshop: "Workshop",
    draft: "Draft",
    published: "Published",
    suspended: "Suspended",
    archived: "Archived",
    records: "Your CraftID records",
    switch: "Switch record",
    createProfessional: "Create Professional CraftID",
    createWorkshop: "Create Workshop CraftID",
    professionalCreated: "Professional CraftID created and linked to your workshop record.",
    workshopCreated: "Workshop CraftID created and linked to your professional record.",
    professionalExists: "You already have an active Professional CraftID.",
    workshopExists: "You already have an active Workshop CraftID.",
    relationshipNote: "Personal and workshop records remain separate CraftIDs. Their relationship can be managed without merging professional evidence.",
    account: "Account",
    closeAccount: "Close CraftID account",
    closeAccountText: "Your active CraftID records will be archived immediately and removed from Registry, Discover and Map. Existing CraftID numbers will remain resolvable as minimal historical records so products and documents already carrying the number do not become unverifiable.",
    closeAccountRetention: "Public contacts, profile images and active profile details will no longer be disclosed. The CraftID number is never reassigned. If you later return and recover this identity, the same CraftID is restored as a draft and must be reviewed before publication.",
    closeConfirm: 'Type "close" to confirm',
    closeButton: "Archive records and close account",
  },
  uk: {
    eyebrow: "Мій CraftID",
    signOut: "Вийти",
    recordFallback: "Запис CraftID",
    complete: "Додайте професійну назву або ремісничий напрям, щоб описати свою практику.",
    current: "Ваш опублікований запис доступний публічно. Підтримуйте професійну інформацію та докази актуальними.",
    addTitle: "Додайте професійну назву або ремісничий напрям",
    addLocation: "Додайте публічне місто або регіон",
    addSkills: "Додайте професійні навички",
    addExperience: "Додайте досвід або кваліфікації",
    addEvidence: "Пов’яжіть підтвердні матеріали",
    reviewPublish: "Перевірте приватність і опублікуйте",
    maintain: "Перегляньте опублікований запис і підтримуйте його актуальним",
    status: "Статус",
    location: "Місце",
    notSet: "Не вказано",
    next: "Наступні кроки",
    profile: "Профіль",
    profileText: "Керуйте інформацією, що описує вас або вашу майстерню.",
    skills: "Навички та твердження",
    skillsText: "Формуйте структуровані твердження про навички, досвід і кваліфікації.",
    evidence: "Докази",
    evidenceText: "Керуйте приватними підтвердними матеріалами, пов’язаними з окремими твердженнями.",
    privacy: "Приватність",
    privacyText: "Оберіть, що буде публічним і наскільки точно може відображатися ваше місцезнаходження.",
    public: "Публічний профіль",
    publicText: "Перегляньте запис до публікації або перевірте його актуальну публічну версію.",
    requests: "Запити на контакт",
    requestsText: "Переглядайте контрольовані звернення без публікації вашого приватного email або телефону.",
    referrals: "Інституційні можливості",
    referralsText: "Переглядайте запрошення до проєктів, партнерств, навчання та замовлень, передані через CraftID.",
    support: "Можливості та підтримка",
    supportText: "Вкажіть, які види фінансування, консультацій, навчання, партнерств та іншої підтримки для вас актуальні.",
    certificate: "Сертифікат CraftID",
    certificateText: "Випускайте та завантажуйте версійний сертифікат ідентичності з публічним Certificate ID та QR-перевіркою.",
    mark: "CraftID Mark",
    markText: "Використовуйте CraftID на вебсайті, картках виробів, вивісці майстерні та у друці. CraftID Mark ідентифікує запис CraftID, але не є сертифікацією або знаком якості.",
    open: "Відкрити",
    typeProfessional: "Професіонал",
    typeWorkshop: "Майстерня",
    draft: "Чернетка",
    published: "Опубліковано",
    suspended: "Призупинено",
    archived: "Архів",
    records: "Ваші записи CraftID",
    switch: "Перемкнути запис",
    createProfessional: "Створити CraftID професіонала",
    createWorkshop: "Створити CraftID майстерні",
    professionalCreated: "CraftID професіонала створено та пов’язано з записом майстерні.",
    workshopCreated: "CraftID майстерні створено та пов’язано з вашим професійним записом.",
    professionalExists: "У вас уже є активний CraftID професіонала.",
    workshopExists: "У вас уже є активний CraftID майстерні.",
    relationshipNote: "Персональний запис і майстерня залишаються окремими CraftID. Їхній зв’язок можна керувати без об’єднання професійних доказів.",
    account: "Обліковий запис",
    closeAccount: "Закрити обліковий запис CraftID",
    closeAccountText: "Ваші активні записи CraftID будуть негайно перенесені в архів і зникнуть з Registry, Discover та Map. Уже видані номери CraftID залишаться доступними як мінімальні історичні записи, щоб вироби й документи з цим номером можна було перевірити.",
    closeAccountRetention: "Публічні контакти, фото профілю та активні дані профілю більше не розкриватимуться. Номер CraftID ніколи не буде виданий іншій сутності. Якщо ви повернетеся та відновите цю ідентичність, буде відновлено той самий CraftID як чернетку, яку потрібно перевірити перед повторною публікацією.",
    closeConfirm: "Введіть «закрити» для підтвердження",
    closeButton: "Архівувати записи та закрити обліковий запис",
  },
} as const;

export default async function MyCraftIdPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];

  const { supabase, userId, entity, entities } = await getOwnedCraftId(sp.entity);
  if (!userId) redirect(locale === "uk" ? "/login?lang=uk" : "/login");
  if (sp.entity && !entity) redirect(locale === "uk" ? "/my-craftid?lang=uk" : "/my-craftid");
  if (!entity) redirect(locale === "uk" ? "/onboarding?lang=uk" : "/onboarding");

  const entityIds = entities.map((item) => item.id);
  const [{ data: professionalProfiles }, { data: workshopProfiles }] = await Promise.all([
    entityIds.length
      ? supabase.from("professional_profiles").select("entity_id, display_name, professional_title, country_code, region, city").in("entity_id", entityIds)
      : Promise.resolve({ data: [] }),
    entityIds.length
      ? supabase.from("workshop_profiles").select("entity_id, display_name, craft_sector, country_code, region, city").in("entity_id", entityIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profiles = new Map<string, {
    display_name: string;
    professional_title?: string | null;
    craft_sector?: string | null;
    country_code?: string | null;
    region?: string | null;
    city?: string | null;
  }>();

  for (const profile of professionalProfiles ?? []) profiles.set(profile.entity_id, profile);
  for (const profile of workshopProfiles ?? []) profiles.set(profile.entity_id, profile);

  const record = profiles.get(entity.id) ?? null;
  const typeLabel = entity.entity_type === "professional" ? t.typeProfessional : t.typeWorkshop;

  const [{ count: skillCount }, { count: experienceCount }, { count: evidenceCount }] =
    await Promise.all([
      supabase.from("claims").select("id", { count: "exact", head: true }).eq("entity_id", entity.id).eq("claim_type", "skill"),
      supabase.from("claims").select("id", { count: "exact", head: true }).eq("entity_id", entity.id).in("claim_type", ["experience", "qualification"]),
      supabase.from("evidence_items").select("id", { count: "exact", head: true }).eq("owner_entity_id", entity.id),
    ]);

  const hasTitle = Boolean(record?.professional_title ?? record?.craft_sector);
  const hasLocation = Boolean(record?.city ?? record?.region ?? record?.country_code);
  const nextSteps: string[] = [];

  if (!hasTitle) nextSteps.push(t.addTitle);
  if (!hasLocation) nextSteps.push(t.addLocation);
  if (!skillCount) nextSteps.push(t.addSkills);
  if (!experienceCount) nextSteps.push(t.addExperience);
  if (!evidenceCount) nextSteps.push(t.addEvidence);
  if (entity.public_status !== "published") nextSteps.push(t.reviewPublish);
  if (!nextSteps.length && entity.public_status === "published") nextSteps.push(t.maintain);

  const selectedQuery = ownerWorkspaceQuery(locale, entity.id);
  const hasProfessional = entities.some((item) => item.entity_type === "professional");
  const hasWorkshop = entities.some((item) => item.entity_type === "workshop");

  return (
    <main className="recordPage dashboardPage">
      <div className="container">
        <div className="dashboardHeader">
          <div>
            <Link href={locale === "uk" ? "/?lang=uk" : "/"} className="brand">CraftID</Link>
            <div className="eyebrow dashboardEyebrow">{t.eyebrow}</div>
          </div>
          <div className="dashboardActions">
            <div className="languageSwitch">
              <Link className={locale === "en" ? "active" : ""} href={`/my-craftid?entity=${entity.id}`}>EN</Link>
              <span>/</span>
              <Link className={locale === "uk" ? "active" : ""} href={`/my-craftid?lang=uk&entity=${entity.id}`}>UA</Link>
            </div>
            <form action={logout}>
              <input type="hidden" name="lang" value={locale} />
              <button className="button" type="submit">{t.signOut}</button>
            </form>
          </div>
        </div>

        <section className="entitySwitcher">
          <div>
            <div className="eyebrow">{t.records}</div>
            <p>{t.relationshipNote}</p>
          </div>
          <div className="entitySwitcherRecords" aria-label={t.switch}>
            {entities.map((item) => {
              const itemProfile = profiles.get(item.id);
              const active = item.id === entity.id;
              return (
                <Link
                  className={active ? "entitySwitchCard active" : "entitySwitchCard"}
                  href={`/my-craftid${ownerWorkspaceQuery(locale, item.id)}`}
                  key={item.id}
                >
                  <span>{item.entity_type === "professional" ? t.typeProfessional : t.typeWorkshop}</span>
                  <strong>{itemProfile?.display_name ?? t.recordFallback}</strong>
                  <small>CraftID #{formatCraftId(item.craftid_number, item.craftid_check_digits)}</small>
                </Link>
              );
            })}
            {!hasProfessional ? (
              <form action={createAdditionalCraftId}>
                <input type="hidden" name="lang" value={locale} />
                <input type="hidden" name="entityType" value="professional" />
                <button className="entitySwitchCard entitySwitchCreate" type="submit">
                  <span>+</span>
                  <strong>{t.createProfessional}</strong>
                </button>
              </form>
            ) : null}
            {!hasWorkshop ? (
              <form action={createAdditionalCraftId}>
                <input type="hidden" name="lang" value={locale} />
                <input type="hidden" name="entityType" value="workshop" />
                <button className="entitySwitchCard entitySwitchCreate" type="submit">
                  <span>+</span>
                  <strong>{t.createWorkshop}</strong>
                </button>
              </form>
            ) : null}
          </div>
        </section>

        {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
        {sp.message === "professional_created" ? <p className="formMessage">{t.professionalCreated}</p> : null}
        {sp.message === "workshop_created" ? <p className="formMessage">{t.workshopCreated}</p> : null}
        {sp.message === "professional_exists" ? <p className="formMessage">{t.professionalExists}</p> : null}
        {sp.message === "workshop_exists" ? <p className="formMessage">{t.workshopExists}</p> : null}

        <div className="recordTopbar">
          <div>
            <span className="recordType">{typeLabel}</span>
            <h1>CraftID #{formatCraftId(entity.craftid_number, entity.craftid_check_digits)}</h1>
          </div>
          <div className="dashboardStatus">
            <span>{t.status}</span>
            <strong>{t[entity.public_status as keyof typeof t] ?? entity.public_status}</strong>
          </div>
        </div>

        <div className="recordGrid">
          <section className="recordPrimary">
            <h2>{record?.display_name ?? t.recordFallback}</h2>
            <p>
              {record?.professional_title ??
                record?.craft_sector ??
                (entity.public_status === "published" ? t.current : t.complete)}
            </p>
            <div className="recordMeta">
              <span>{t.location}: {[record?.city, record?.region, record?.country_code].filter(Boolean).join(", ") || t.notSet}</span>
            </div>
          </section>
          <aside className="recordAside">
            <div className="eyebrow">{t.next}</div>
            <ol>{nextSteps.map((step) => <li key={step}>{step}</li>)}</ol>
          </aside>
        </div>

        <section className="dashboardModules">
          {[
            [t.profile, t.profileText, "/my-craftid/profile"],
            [t.skills, t.skillsText, "/my-craftid/claims"],
            [t.evidence, t.evidenceText, "/my-craftid/evidence"],
            [t.privacy, t.privacyText, "/my-craftid/privacy"],
            [t.public, t.publicText, "/my-craftid/preview"],
            [t.requests, t.requestsText, "/my-craftid/requests"],
            [t.referrals, t.referralsText, "/my-craftid/referrals"],
            [t.support, t.supportText, "/my-craftid/support"],
            [t.certificate, t.certificateText, "/my-craftid/certificate"],
            [t.mark, t.markText, "/my-craftid/mark"],
          ].map(([title, text, href], index) => (
            <article className="dashboardModule" key={title}>
              <span className="choiceIndex">{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <Link href={`${href}${selectedQuery}`}>{t.open} →</Link>
            </article>
          ))}
        </section>

        <section className="accountClosureSection">
          <div>
            <div className="eyebrow">{t.account}</div>
            <h2>{t.closeAccount}</h2>
            <p>{t.closeAccountText}</p>
            <p className="privacyNote">{t.closeAccountRetention}</p>
          </div>
          <form className="accountClosureForm" action={closeCraftIdAccount}>
            <input type="hidden" name="lang" value={locale} />
            <label>
              {t.closeConfirm}
              <input
                name="confirmation"
                autoComplete="off"
                placeholder={locale === "uk" ? "закрити" : "close"}
                required
              />
            </label>
            <button className="button dangerButton" type="submit">{t.closeButton}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
