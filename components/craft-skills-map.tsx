import type { Locale } from "@/lib/i18n";

type CraftSkillsMapProps = {
  locale: Locale;
  points: Array<{
    location: string;
    lat: number;
    lng: number;
    precision: "city" | "country";
    count: number;
  }>;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function CraftSkillsMap({ locale, points }: CraftSkillsMapProps) {
  const labels = {
    en: { empty: "No published records with a map-ready public location yet.", city: "City level", country: "Country level", records: "records", title: "CraftID Craft Skills Map" },
    fr: { empty: "Aucun dossier publié avec une localisation publique exploitable sur la carte pour le moment.", city: "Niveau ville", country: "Niveau pays", records: "dossiers", title: "Carte des compétences artisanales CraftID" },
    de: { empty: "Noch keine veröffentlichten Datensätze mit kartierbarem öffentlichem Standort.", city: "Stadtebene", country: "Landesebene", records: "Datensätze", title: "CraftID-Karte der Handwerkskompetenzen" },
    nl: { empty: "Nog geen gepubliceerde dossiers met een openbare locatie die op de kaart kan worden weergegeven.", city: "Stadsniveau", country: "Landniveau", records: "dossiers", title: "CraftID-kaart van ambachtelijke vaardigheden" },
    pl: { empty: "Nie ma jeszcze opublikowanych zapisów z publiczną lokalizacją gotową do pokazania na mapie.", city: "Poziom miasta", country: "Poziom kraju", records: "zapisów", title: "Mapa umiejętności rzemieślniczych CraftID" },
    it: { empty: "Non ci sono ancora record pubblicati con una località pubblica disponibile per la mappa.", city: "Livello città", country: "Livello paese", records: "record", title: "Mappa delle competenze artigianali CraftID" },
    es: { empty: "Todavía no hay registros publicados con una ubicación pública disponible para el mapa.", city: "Nivel de ciudad", country: "Nivel de país", records: "registros", title: "Mapa de competencias artesanales CraftID" },
    uk: { empty: "Поки немає опублікованих записів із доступною для карти локацією.", city: "Рівень міста", country: "Рівень країни", records: "записів", title: "Карта ремісничих навичок CraftID" },
  }[locale];

  const safePoints = points.map((point) => ({
    ...point,
    location: escapeHtml(point.location),
  }));

  const data = JSON.stringify(safePoints).replaceAll("<", "\\u003c");
  const emptyText = JSON.stringify(labels.empty);
  const cityText = JSON.stringify(labels.city);
  const countryText = JSON.stringify(labels.country);
  const recordsText = JSON.stringify(labels.records);

  const srcDoc = `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css" rel="stylesheet" />
  <style>
    html,body,#map{margin:0;width:100%;height:100%;font-family:Arial,Helvetica,sans-serif;background:#eef0ed}
    .maplibregl-ctrl-attrib{font-size:10px!important}
    .maplibregl-popup-content{border-radius:0;box-shadow:0 8px 24px rgba(17,20,18,.12);padding:14px;border:1px solid #cfd5d0}
    .popup-id{font:11px ui-monospace,SFMono-Regular,Menlo,monospace;color:#59615c;text-transform:uppercase;letter-spacing:.05em}
    .popup-name{font-weight:800;font-size:16px;margin:6px 0 3px;color:#111412}
    .popup-meta{font-size:12px;line-height:1.45;color:#59615c}
    .popup-link{display:inline-block;margin-top:10px;color:#1e3a5f;font-size:12px;font-weight:700;text-decoration:none}
    .empty{position:absolute;z-index:3;left:20px;top:20px;max-width:360px;padding:14px 16px;background:rgba(255,255,255,.96);border-top:2px solid #1e3a5f;border-bottom:1px solid #cfd5d0;color:#59615c;font-size:13px;line-height:1.5}
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js"></script>
  <script>
    const points = ${data};
    const emptyText = ${emptyText};
    const cityText = ${cityText};
    const countryText = ${countryText};
    const recordsText = ${recordsText};

    const map = new maplibregl.Map({
      container: 'map',
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [18.5, 50.2],
      zoom: 3.2,
      attributionControl: true
    });

    map.addControl(new maplibregl.NavigationControl({showCompass:false}), 'top-right');

    map.on('load', () => {
      const features = points.map((point) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [point.lng, point.lat] },
        properties: {
          location: point.location,
          precision: point.precision,
          count: point.count
        }
      }));

      if (!features.length) {
        const box = document.createElement('div');
        box.className = 'empty';
        box.textContent = emptyText;
        document.body.appendChild(box);
        return;
      }

      map.addSource('craftid', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      });

      map.addLayer({
        id: 'groups',
        type: 'circle',
        source: 'craftid',
        paint: {
          'circle-color': '#1e3a5f',
          'circle-radius': ['interpolate', ['linear'], ['get', 'count'], 5, 13, 20, 18, 100, 26],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }
      });

      map.addLayer({
        id: 'group-count',
        type: 'symbol',
        source: 'craftid',
        layout: {
          'text-field': ['to-string', ['get', 'count']],
          'text-size': 11
        },
        paint: { 'text-color': '#ffffff' }
      });

      map.on('click', 'groups', (event) => {
        const feature = event.features && event.features[0];
        if (!feature) return;
        const p = feature.properties;
        const precision = p.precision === 'city' ? cityText : countryText;
        const html =
          '<div class="popup-name">' + p.location + '</div>' +
          '<div class="popup-meta">' + p.count + ' ' + recordsText + ' · ' + precision + '</div>';
        new maplibregl.Popup({ offset: 12 }).setLngLat(feature.geometry.coordinates).setHTML(html).addTo(map);
      });

      for (const layer of ['groups']) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
      }

      if (features.length === 1) {
        map.easeTo({ center: features[0].geometry.coordinates, zoom: 7 });
      } else {
        const bounds = new maplibregl.LngLatBounds();
        for (const feature of features) bounds.extend(feature.geometry.coordinates);
        map.fitBounds(bounds, { padding: 56, maxZoom: 8, duration: 0 });
      }
    });
  </script>
</body>
</html>`;

  return (
    <iframe
      className="craftSkillsMapFrame"
      title={labels.title}
      srcDoc={srcDoc}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
