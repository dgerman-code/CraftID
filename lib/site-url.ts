export function getSiteUrl() {
  const environment = process.env.VERCEL_ENV;

  if (environment === "production") {
    return "https://craftid.eu/";
  }

  if (environment === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/`;
  }

  return "http://localhost:3000/";
}
