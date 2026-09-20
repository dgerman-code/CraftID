const PREVIEW_BRANCH_URL =
  "https://craft-id-git-chore-initial-platform-baseline-hcus-projects.vercel.app";

export function getSiteUrl() {
  const environment = process.env.VERCEL_ENV;

  let url =
    environment === "production"
      ? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
      : environment === "preview"
        ? PREVIEW_BRANCH_URL
        : "http://localhost:3000";

  if (!url.startsWith("http")) {
    url = `https://${url}`;
  }

  return url.endsWith("/") ? url : `${url}/`;
}
