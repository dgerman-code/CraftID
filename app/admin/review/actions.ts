"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const allowedDecisions = new Set([
  "supports_claim",
  "does_not_support_claim",
  "unable_to_determine",
  "needs_clarification",
]);

const allowedStatuses = new Set([
  "evidence_submitted",
  "document_reviewed",
  "evidence_reviewed",
  "external_source_confirmed",
  "identity_reviewed",
]);

export async function submitReview(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en") === "uk" ? "uk" : "en";
  const q = lang === "uk" ? "?lang=uk" : "";
  const claimId = String(formData.get("claimId") ?? "");
  const evidenceId = String(formData.get("evidenceId") ?? "") || null;
  const decision = String(formData.get("decision") ?? "");
  const resultingStatus = String(formData.get("resultingStatus") ?? "");
  const notes = String(formData.get("privateNotes") ?? "").trim();

  if (!claimId || !allowedDecisions.has(decision) || !allowedStatuses.has(resultingStatus)) {
    redirect(`/admin/review${q ? `${q}&` : "?"}error=${encodeURIComponent("Invalid review input")}`);
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect(`/login${q}`);

  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "reviewer" && role !== "admin") {
    redirect(`/my-craftid${q}`);
  }

  const { error } = await supabase.rpc("submit_claim_review", {
    p_claim_id: claimId,
    p_evidence_id: evidenceId,
    p_decision: decision,
    p_resulting_status: resultingStatus,
    p_private_notes: notes || null,
  });

  if (error) {
    redirect(`/admin/review${q ? `${q}&` : "?"}error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/review");
  redirect(`/admin/review${q ? `${q}&` : "?"}message=reviewed`);
}
