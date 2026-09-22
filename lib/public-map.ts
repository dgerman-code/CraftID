export type MapCoordinate = {
  lat: number;
  lng: number;
  precision: "city" | "country";
};

type Coordinate = { lat: number; lng: number };

const COUNTRY_NAMES_BY_CODE: Record<string, string> = {
  AT: "austria", BE: "belgium", BG: "bulgaria", HR: "croatia", CY: "cyprus",
  CZ: "czechia", DK: "denmark", EE: "estonia", FI: "finland", FR: "france",
  DE: "germany", GR: "greece", HU: "hungary", IE: "ireland", IT: "italy",
  LV: "latvia", LT: "lithuania", LU: "luxembourg", MT: "malta", NL: "netherlands",
  PL: "poland", PT: "portugal", RO: "romania", SK: "slovakia", SI: "slovenia",
  ES: "spain", SE: "sweden", UA: "ukraine", GB: "united kingdom",
  NO: "norway", CH: "switzerland", IS: "iceland", LI: "liechtenstein",
  MD: "moldova", AL: "albania", ME: "montenegro", MK: "north macedonia",
  RS: "serbia", BA: "bosnia and herzegovina",
};

const COUNTRY_CENTROIDS_BY_CODE: Record<string, Coordinate> = {
  AT:{lat:47.5162,lng:14.5501}, BE:{lat:50.5039,lng:4.4699},
  BG:{lat:42.7339,lng:25.4858}, HR:{lat:45.1,lng:15.2},
  CY:{lat:35.1264,lng:33.4299}, CZ:{lat:49.8175,lng:15.473},
  DK:{lat:56.2639,lng:9.5018}, EE:{lat:58.5953,lng:25.0136},
  FI:{lat:61.9241,lng:25.7482}, FR:{lat:46.2276,lng:2.2137},
  DE:{lat:51.1657,lng:10.4515}, GR:{lat:39.0742,lng:21.8243},
  HU:{lat:47.1625,lng:19.5033}, IE:{lat:53.1424,lng:-7.6921},
  IT:{lat:41.8719,lng:12.5674}, LV:{lat:56.8796,lng:24.6032},
  LT:{lat:55.1694,lng:23.8813}, LU:{lat:49.8153,lng:6.1296},
  MT:{lat:35.9375,lng:14.3754}, NL:{lat:52.1326,lng:5.2913},
  PL:{lat:51.9194,lng:19.1451}, PT:{lat:39.3999,lng:-8.2245},
  RO:{lat:45.9432,lng:24.9668}, SK:{lat:48.669,lng:19.699},
  SI:{lat:46.1512,lng:14.9955}, ES:{lat:40.4637,lng:-3.7492},
  SE:{lat:60.1282,lng:18.6435}, UA:{lat:48.3794,lng:31.1656},
  GB:{lat:55.3781,lng:-3.436}, NO:{lat:60.472,lng:8.4689},
  CH:{lat:46.8182,lng:8.2275}, IS:{lat:64.9631,lng:-19.0208},
  LI:{lat:47.166,lng:9.5554}, MD:{lat:47.4116,lng:28.3699},
  AL:{lat:41.1533,lng:20.1683}, ME:{lat:42.7087,lng:19.3744},
  MK:{lat:41.6086,lng:21.7453}, RS:{lat:44.0165,lng:21.0059},
  BA:{lat:43.9159,lng:17.6791},
};

const COUNTRY_CODE_BY_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_NAMES_BY_CODE).map(([code, name]) => [name, code]),
);

Object.assign(COUNTRY_CODE_BY_NAME, {
  "україна": "UA",
  "бельгія": "BE",
  "польща": "PL",
  "німеччина": "DE",
  "нідерланди": "NL",
  "франція": "FR",
});

const CITY_CENTROIDS: Record<string, Coordinate> = {
  "kyiv, ukraine": { lat: 50.4501, lng: 30.5234 },
  "київ, ukraine": { lat: 50.4501, lng: 30.5234 },
  "kiev, ukraine": { lat: 50.4501, lng: 30.5234 },
  "lviv, ukraine": { lat: 49.8397, lng: 24.0297 },
  "львів, ukraine": { lat: 49.8397, lng: 24.0297 },
  "odesa, ukraine": { lat: 46.4825, lng: 30.7233 },
  "odessa, ukraine": { lat: 46.4825, lng: 30.7233 },
  "одеса, ukraine": { lat: 46.4825, lng: 30.7233 },
  "kharkiv, ukraine": { lat: 49.9935, lng: 36.2304 },
  "харків, ukraine": { lat: 49.9935, lng: 36.2304 },
  "dnipro, ukraine": { lat: 48.4647, lng: 35.0462 },
  "дніпро, ukraine": { lat: 48.4647, lng: 35.0462 },
  "uzhhorod, ukraine": { lat: 48.6208, lng: 22.2879 },
  "ужгород, ukraine": { lat: 48.6208, lng: 22.2879 },
  "ivano-frankivsk, ukraine": { lat: 48.9226, lng: 24.7111 },
  "івано-франківськ, ukraine": { lat: 48.9226, lng: 24.7111 },
  "ternopil, ukraine": { lat: 49.5535, lng: 25.5948 },
  "тернопіль, ukraine": { lat: 49.5535, lng: 25.5948 },
  "chernivtsi, ukraine": { lat: 48.2915, lng: 25.9403 },
  "чернівці, ukraine": { lat: 48.2915, lng: 25.9403 },
  "vinnytsia, ukraine": { lat: 49.2331, lng: 28.4682 },
  "вінниця, ukraine": { lat: 49.2331, lng: 28.4682 },
  "poltava, ukraine": { lat: 49.5883, lng: 34.5514 },
  "полтава, ukraine": { lat: 49.5883, lng: 34.5514 },
  "brussels, belgium": { lat: 50.8503, lng: 4.3517 },
  "bruxelles, belgium": { lat: 50.8503, lng: 4.3517 },
  "брюссель, belgium": { lat: 50.8503, lng: 4.3517 },
  "antwerp, belgium": { lat: 51.2194, lng: 4.4025 },
  "antwerpen, belgium": { lat: 51.2194, lng: 4.4025 },
  "антверпен, belgium": { lat: 51.2194, lng: 4.4025 },
  "ghent, belgium": { lat: 51.0543, lng: 3.7174 },
  "gent, belgium": { lat: 51.0543, lng: 3.7174 },
  "leuven, belgium": { lat: 50.8798, lng: 4.7005 },
  "liege, belgium": { lat: 50.6326, lng: 5.5797 },
  "liège, belgium": { lat: 50.6326, lng: 5.5797 },
};

function normalise(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function countryCodeFromToken(token: string) {
  const upper = token.trim().toUpperCase();
  if (COUNTRY_CENTROIDS_BY_CODE[upper]) return upper;
  return COUNTRY_CODE_BY_NAME[normalise(token)] ?? null;
}

export function resolvePublicMapCoordinate(location: string | null): MapCoordinate | null {
  if (!location) return null;

  const normalized = normalise(location);
  const parts = normalized.split(",").map((part) => part.trim()).filter(Boolean);
  const countryToken = parts.at(-1) ?? normalized;
  const countryCode = countryCodeFromToken(countryToken);

  if (parts.length >= 2 && countryCode) {
    const canonicalCountry = COUNTRY_NAMES_BY_CODE[countryCode];
    const cityCountry = `${parts[0]}, ${canonicalCountry}`;
    const city = CITY_CENTROIDS[cityCountry];
    if (city) return { ...city, precision: "city" };
  }

  if (countryCode) {
    const country = COUNTRY_CENTROIDS_BY_CODE[countryCode];
    return { ...country, precision: "country" };
  }

  return null;
}
