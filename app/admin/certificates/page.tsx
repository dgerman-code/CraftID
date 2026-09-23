import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCraftId } from "@/lib/certificate";
import { formatCertificateNumber } from "@/lib/craftid-format";
import { revokeCertificate } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function AdminCertificatesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin") redirect("/admin");

  const { data: certificates } = await supabase
    .from("craftid_certificates")
    .select("certificate_code, version_no, entity_type, craftid_number, craftid_check_digits, issued_display_name, issued_at, status, revoked_at, revoked_reason")
    .order("issued_at", { ascending: false })
    .limit(100);

  return (
    <main className="adminPage">
      <div className="adminPageHeader">
        <div>
          <div className="eyebrow">Certificate governance</div>
          <h1>CraftID Certificates</h1>
          <p>Issued identity certificates are immutable snapshots. Administrators may revoke a certificate with an auditable reason; revocation does not delete its verification record.</p>
        </div>
      </div>

      {sp.error ? <p className="formMessage error">{sp.error}</p> : null}
      {sp.message === "revoked" ? <p className="formMessage">Certificate revoked.</p> : null}

      <section className="adminPanel">
        <div className="adminTable">
          <div className="adminTableHead certificateAdminHead">
            <span>Certificate No.</span>
            <span>CraftID / holder</span>
            <span>Issued</span>
            <span>Status / action</span>
          </div>

          {(certificates ?? []).map((certificate) => {
            const craftId = formatCraftId(
              certificate.craftid_number,
              certificate.craftid_check_digits,
            );

            return (
              <div className="adminTableRow certificateAdminRow" key={certificate.certificate_code}>
                <div>
                  <strong>{formatCertificateNumber(
                    certificate.craftid_number,
                    certificate.craftid_check_digits,
                    certificate.version_no,
                  )}</strong>
                  <small>Version {certificate.version_no} · {certificate.entity_type}</small>
                </div>
                <div>
                  <Link href={"/id/" + craftId}>#{craftId}</Link>
                  <small>{certificate.issued_display_name}</small>
                </div>
                <span>{new Date(certificate.issued_at).toLocaleDateString("en-GB")}</span>
                <div>
                  <strong>{certificate.status}</strong>
                  {certificate.status === "issued" ? (
                    <form className="certificateRevokeForm" action={revokeCertificate}>
                      <input type="hidden" name="certificateCode" value={certificate.certificate_code} />
                      <input name="reason" placeholder="Revocation reason" required />
                      <button className="button dangerButton" type="submit">Revoke</button>
                    </form>
                  ) : (
                    <small>
                      {certificate.revoked_at ? new Date(certificate.revoked_at).toLocaleDateString("en-GB") : ""}
                      {certificate.revoked_reason ? " · " + certificate.revoked_reason : ""}
                    </small>
                  )}
                </div>
              </div>
            );
          })}

          {(certificates ?? []).length === 0 ? <p className="emptyState">No certificates issued yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
