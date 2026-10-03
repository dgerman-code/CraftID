"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    __metricoolLoaded?: boolean;
    beTracker?: {
      t: (config: { hash: string }) => void;
    };
  }
}

const PUBLIC_PREFIXES = [
  "/about",
  "/certificate",
  "/contact",
  "/discover",
  "/governance",
  "/id",
  "/methodology",
  "/network",
  "/opportunities",
  "/privacy",
  "/professionals",
  "/skills",
  "/workshops",
];

const PRIVATE_PREFIXES = [
  "/admin",
  "/auth",
  "/login",
  "/my-craftid",
  "/onboarding",
  "/partner",
  "/reset-password",
  "/signup",
];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  if (PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return false;
  }
  if (/^\/opportunities\/[^/]+\/interest(?:\/|$)/.test(pathname)) {
    return false;
  }
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function MetricoolPublicAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isPublicPath(pathname)) return;
    if (window.location.hostname !== "craftid.eu" && window.location.hostname !== "www.craftid.eu") return;
    if (window.__metricoolLoaded) return;

    window.__metricoolLoaded = true;
    let initialised = false;

    /* eslint-disable no-var, @typescript-eslint/no-unused-expressions */
    function loadScript(a: () => void){
      var b=document.getElementsByTagName("head")[0],
          c=document.createElement("script");
      c.type="text/javascript",
      c.src="https://tracker.metricool.com/resources/be.js",
      // @ts-expect-error Metricool's official snippet uses the legacy script ready-state hook.
      c.onreadystatechange=a,
      c.onload=a,
      b.appendChild(c)
    }

    loadScript(function(){
      if (initialised) return;
      if (!window.beTracker || typeof window.beTracker.t !== "function") return;
      initialised = true;
      window.beTracker.t({hash:"ebaf93684e0f50db35ee6b2b75ad9ffe"})
    });
    /* eslint-enable no-var, @typescript-eslint/no-unused-expressions */
  }, [pathname]);

  return null;
}
