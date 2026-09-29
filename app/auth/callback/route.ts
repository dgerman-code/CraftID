import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeInternalPath(value: string | null) {
  if (!value) return "/onboarding";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/onboarding";
  }

  try {
    const decoded = decodeURIComponent(value);
    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("\\")) {
      return "/onboarding";
    }
  } catch {
    return "/onboarding";
  }

  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeInternalPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  const errorPath = next.startsWith("/partner")
    ? "/partner/login?error=Unable%20to%20confirm%20your%20partner%20account"
    : "/login?error=Unable%20to%20confirm%20your%20account";

  return NextResponse.redirect(new URL(errorPath, requestUrl.origin));
}
