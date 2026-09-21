export type MapPoint = {
  craftId: string;
  name: string;
  role: string;
  location: string;
  lat: number;
  lng: number;
  precision: "city" | "country";
  href: string;
};

type Coordinate = { lat: number; lng: number };

const CITY_CENTROIDS: Record<string, Coordinate> = {
  "kyiv, ukraine": { lat: 50.4501, lng: 30.5234 },
  "київ, україна": { lat: 50.4501, lng: 30.5234 },
  "kiev, ukraine": { lat: 50.4501, lng: 30.5234 },
  "lviv, ukraine": { lat: 49.8397, lng: 24.0297 },
  "львів, україна": { lat: 49.8397, lng: 24.0297 },
  "odesa, ukraine": { lat: 46.4825, lng: 30.7233 },
  "odessa, ukraine": { lat: 46.4825, lng: 30.7233 },
  "одеса, україна": { lat: 46.4825, lng: 30.7233 },
  "kharkiv, ukraine": { lat: 49.9935, lng: 36.2304 },
  "харків, україна": { lat: 49.9935, lng: 36.2304 },
  "dnipro, ukraine": { lat: 48.4647, lng: 35.0462 },
  "дніпро, україна": { lat: 48.4647, lng: 35.0462 },
  "uzhhorod, ukraine": { lat: 48.6208, lng: 22.2879 },
  "ужгород, україна": { lat: 48.6208, lng: 22.2879 },
  "ivano-frankivsk, ukraine": { lat: 48.9226, lng: 24.7111 },
  "івано-франківськ, україна": { lat: 48.9226, lng: 24.7111 },
  "ternopil, ukraine": { lat: 49.5535, lng: 25.5948 },
  "тернопіль, україна": { lat: 49.5535, lng: 25.5948 },
  "chernivtsi, ukraine": { lat: 48.2915, lng: 25.9403 },
  "чернівці, україна": { lat: 48.2915, lng: 25.9403 },
  "vinnytsia, ukraine": { lat: 49.2331, lng: 28.4682 },
  "вінниця, україна": { lat: 49.2331, lng: 28.4682 },
  "poltava, ukraine": { lat: 49.5883, lng: 34.5514 },
  "полтава, україна": { lat: 49.5883, lng: 34.5514 },
  "brussels, belgium": { lat: 50.8503, lng: 4.3517 },
  "bruxelles, belgium": { lat: 50.8503, lng: 4.3517 },
  "брюссель, бельгія": { lat: 50.8503, lng: 4.3517 },
  "antwerp, belgium": { lat: 51.2194, lng: 4.4025 },
  "antwerpen, belgium": { lat: 51.2194, lng: 4.4025 },
  "антверпен, бельгія": { lat: 51.2194, lng: 4.4025 },
  "ghent, belgium": { lat: 51.0543, lng: 3.7174 },
  "gent, belgium": { lat: 51.0543, lng: 3.7174 },
  "leuven, belgium": { lat: 50.8798, lng: 4.7005 },
  "liege, belgium": { lat: 50.6326, lng: 5.5797 },
  "liège, belgium": { lat: 50.6326, lng: 5.5797 },
};

const COUNTRY_CENTROIDS: Record<string, Coordinate> = {
  ukraine: { lat: 49.0, lng: 31.3 },
  "україна": { lat: 49.0, lng: 31.3 },
  belgium: { lat: 50.64, lng: 4.67 },
  "бельгія": { lat: 50.64, lng: 4.67 },
  poland: { lat: 52.1, lng: 19.4 },
  "польща": { lat: 52.1, lng: 19.4 },
  germany: { lat: 51.1, lng: 10.4 },
  "німеччина": { lat: 51.1, lng: 10.4 },
  netherlands: { lat: 52.2, lng: 5.3 },
  "нідерланди": { lat: 52.2, lng: 5.3 },
  france: { lat: 46.6, lng: 2.2 },
  "франція": { lat: 46.6, lng: 2.2 },
};

export function resolvePublicMapCoordinate(location: string | null) {
  if (!location) return null;

  const normalized = location
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, " ");

  const direct = CITY_CENTROIDS[normalized];
  if (direct) return { ...direct, precision: "city" as const };

  const parts = normalized.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const cityCountry = `${parts[0]}, ${parts.at(-1)}`;
    const city = CITY_CENTROIDS[cityCountry];
    if (city) return { ...city, precision: "city" as const };
  }

  const country = parts.at(-1) ?? normalized;
  const countryCoordinate = COUNTRY_CENTROIDS[country];
  if (countryCoordinate) return { ...countryCoordinate, precision: "country" as const };

  return null;
}
