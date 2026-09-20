export function getSiteUrl() {
  const isProduction = process.env.VERCEL_ENV === "production";

  let url = isProduction
    ? process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.NEXT_PUBLIC_VERCEL_URL ??
      "http://localhost:3000"
    : process.env.NEXT_PUBLIC_VERCEL_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

  if (!url.startsWith("http")) {
    url = `https://${url}`;
  }

  return url.endsWith("/") ? url : `${url}/`;
}
