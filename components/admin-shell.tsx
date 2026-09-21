"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  role: "admin" | "reviewer";
  children: ReactNode;
};

const nav = [
  { href: "/admin", label: "Dashboard", adminOnly: false },
  { href: "/admin/registry", label: "CraftID Registry", adminOnly: true },
  { href: "/admin/publication", label: "Publication Queue", adminOnly: true },
  { href: "/admin/review", label: "Reviews", adminOnly: false },
  { href: "/admin/referrals", label: "Institutional Opportunities", adminOnly: true },
  { href: "/admin/partners", label: "Partner Organisations", adminOnly: true },
  { href: "/admin/taxonomy", label: "Taxonomy", adminOnly: true },
  { href: "/admin/users", label: "Users & Roles", adminOnly: true },
  { href: "/admin/audit", label: "Audit & Compliance", adminOnly: true },
  { href: "/admin/identifiers", label: "Identifier Administration", adminOnly: true },
];

export function AdminShell({ role, children }: Props) {
  const pathname = usePathname();
  const search = useSearchParams();
  const lang = search.get("lang") === "uk" ? "uk" : "en";
  const suffix = lang === "uk" ? "?lang=uk" : "";

  return (
    <div className="adminApp">
      <aside className="adminSidebar">
        <div className="adminBrandBlock">
          <Link href={`/admin${suffix}`} className="adminBrand">CraftID</Link>
          <span>Administration Console</span>
        </div>

        <nav className="adminNav" aria-label="Administration">
          {nav
            .filter((item) => !item.adminOnly || role === "admin")
            .map((item) => {
              const active = item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  className={active ? "active" : ""}
                  href={`${item.href}${suffix}`}
                >
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <div className="adminSidebarFooter">
          <span className="recordId">ROLE · {role}</span>
          <Link href={`/my-craftid${suffix}`}>My CraftID →</Link>
          <Link href={`/${suffix}`}>Public site →</Link>
        </div>
      </aside>

      <div className="adminMain">
        <header className="adminTopbar">
          <div>
            <span className="recordId">CraftID operations</span>
            <strong>{role === "admin" ? "Administrator" : "Reviewer"}</strong>
          </div>
          <div className="languageSwitch">
            <Link className={lang === "en" ? "active" : ""} href={pathname}>EN</Link>
            <span>/</span>
            <Link className={lang === "uk" ? "active" : ""} href={`${pathname}?lang=uk`}>UA</Link>
          </div>
        </header>
        <div className="adminContent">{children}</div>
      </div>
    </div>
  );
}
