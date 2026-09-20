import Link from "next/link";
import { SiteFooter, SiteHeader, localeFrom } from "@/components/site-shell";

type Props = { searchParams: Promise<{ lang?: string }> };

const copy = {
  en: {
    id: "CraftID #00001284-29",
    name: "Maria Kovalenko",
    role: "Ceramicist",
    location: "Lviv, Ukraine",
    summary: "Maria is an independent ceramicist specialising in wheel-thrown stoneware and porcelain. Her practice combines functional tableware with small-batch sculptural work, with particular attention to material consistency, firing quality and durable glazing.",
    note: "She works from a shared studio in Lviv and collaborates with other makers on kiln use, exhibition preparation and small-format learning activities.",
    skills: "Skills",
    experience: "Experience",
    qualifications: "Qualifications",
    affiliation: "Workshop / affiliation",
    languages: "Languages",
    interests: "Cooperation interests",
    trust: "Trust & evidence",
    status: "Evidence reviewed",
    back: "Back to registry",
    disclaimer: "Demo record. All profile content is fictional and shown only to demonstrate the CraftID information model.",
  },
  uk: {
    id: "CraftID #00001284-29",
    name: "Maria Kovalenko",
    role: "Керамістка",
    location: "Львів, Україна",
    summary: "Марія — незалежна керамістка, яка спеціалізується на гончарному кам’яному посуді та порцеляні. Її практика поєднує функціональний посуд із малосерійними скульптурними роботами, з особливою увагою до стабільності матеріалів, якості випалу та довговічності глазурі.",
    note: "Вона працює у спільній майстерні у Львові та співпрацює з іншими майстрами щодо використання печей, підготовки виставок і невеликих навчальних форматів.",
    skills: "Навички",
    experience: "Досвід",
    qualifications: "Кваліфікації",
    affiliation: "Майстерня / професійний зв’язок",
    languages: "Мови",
    interests: "Інтереси співпраці",
    trust: "Довіра та докази",
    status: "Докази переглянуто",
    back: "Назад до реєстру",
    disclaimer: "Демонстраційний запис. Увесь зміст профілю є вигаданим і використовується лише для демонстрації інформаційної моделі CraftID.",
  },
} as const;

export default async function ProfessionalProfile({ searchParams }: Props) {
  const locale = localeFrom((await searchParams).lang);
  const t = copy[locale];
  const q = locale === "uk" ? "?lang=uk" : "";

  return (
    <>
      <SiteHeader locale={locale} pathname="/professionals/maria-kovalenko" />
      <main>
        <section className="profileHero">
          <div className="container">
            <Link className="backLink" href={`/discover${q}`}>← {t.back}</Link>
            <div className="profileHeaderGrid">
              <div>
                <div className="recordId">{t.id}</div>
                <h1>{t.name}</h1>
                <p className="profileRole">{t.role} · {t.location}</p>
              </div>
              <div className="trustStamp">
                <span>Trust status</span>
                <strong>{t.status}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="section profileSection">
          <div className="container profileColumns">
            <div className="profileMain">
              <p className="profileSummary">{t.summary}</p>
              <p>{t.note}</p>

              <div className="profileBlock">
                <div className="eyebrow">{t.skills}</div>
                <div className="tagRow">
                  {["Wheel throwing", "Porcelain", "Ceramic glazing", "Traditional Ukrainian ceramics"].map((x) => <span className="tag" key={x}>{x}</span>)}
                </div>
              </div>

              <div className="profileBlock">
                <div className="eyebrow">{t.experience}</div>
                <div className="timelineItem"><strong>Independent Ceramicist</strong><span>2018–present · Lviv, Ukraine</span></div>
                <div className="timelineItem"><strong>Ceramics Studio Assistant</strong><span>2014–2018 · Lviv, Ukraine</span></div>
              </div>

              <div className="profileBlock">
                <div className="eyebrow">{t.qualifications}</div>
                <div className="timelineItem"><strong>Diploma in Ceramic Arts</strong><span>Lviv National Academy of Arts · 2014</span><em>{t.status}</em></div>
              </div>
            </div>

            <aside className="profileAside">
              <div className="profileMetaBlock">
                <div className="eyebrow">{t.affiliation}</div>
                <strong>Atelier Kolo</strong>
                <span>Workshop affiliation confirmed</span>
              </div>
              <div className="profileMetaBlock">
                <div className="eyebrow">{t.languages}</div>
                <p>Ukrainian · English · Polish</p>
              </div>
              <div className="profileMetaBlock">
                <div className="eyebrow">{t.interests}</div>
                <p>Exhibitions · Cross-border craft projects · Apprenticeship · Training · Design collaboration</p>
              </div>
              <div className="profileMetaBlock">
                <div className="eyebrow">{t.trust}</div>
                <p>Qualification — reviewed</p>
                <p>Professional experience — evidence submitted</p>
                <p>Workshop affiliation — external source confirmed</p>
              </div>
            </aside>
          </div>
        </section>

        <section className="section disclaimerBand">
          <div className="container"><p>{t.disclaimer}</p></div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
