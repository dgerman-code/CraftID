import Link from "next/link";
import { getDictionary } from "@/lib/i18n";

export default function HomePage() {
  const t = getDictionary("en");

  return (
    <>
      <header className="header">
        <div className="container headerInner">
          <Link href="/" className="brand">
            {t.brand.name}
          </Link>
          <nav className="nav" aria-label="Primary navigation">
            <Link href="/discover">{t.nav.discover}</Link>
            <Link href="/skills">{t.nav.skills}</Link>
            <Link href="/methodology">{t.nav.methodology}</Link>
            <Link href="/about">{t.nav.about}</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <div className="eyebrow">{t.home.eyebrow}</div>
            <h1>{t.home.title}</h1>
            <p>{t.home.description}</p>
            <div className="actions">
              <Link className="button buttonPrimary" href="/discover">
                {t.home.primaryCta}
              </Link>
              <Link className="button" href="/create">
                {t.home.secondaryCta}
              </Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="eyebrow">Core logic</div>
            <div className="logic">
              {["Identity", "Skills", "Practice", "Evidence", "Trust"].map(
                (item, index) => (
                  <div className="logicItem" key={item}>
                    <strong>0{index + 1}</strong>
                    <span>{item}</span>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          CraftID · {t.brand.initiative}
        </div>
      </footer>
    </>
  );
}
