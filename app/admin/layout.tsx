import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) redirect("/login");

  const { data: role } = await supabase.rpc("current_staff_role");
  if (role !== "admin" && role !== "reviewer") redirect("/my-craftid");

  return <AdminShell role={role}>{children}</AdminShell>;
}
