import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const supportedLocales = new Set(["en", "fr", "de", "nl", "pl", "it", "es", "uk"]);

export async function proxy(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("lang") ?? "en";
  const locale = supportedLocales.has(requested) ? requested : "en";
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-craftid-locale", locale);
  return updateSession(request, requestHeaders);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
