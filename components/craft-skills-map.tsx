type CraftSkillsMapProps = {
  locale: "en" | "uk";
  points: Array<{
    craftId: string;
    name: string;
    role: string;
    location: string;
    lat: number;
    lng: number;
    precision: "city" | "country";
    href: string;
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
  const labels =
    locale === "uk"
      ? {
          empty: "Поки немає опублікованих записів із доступною для карти локацією.",
          city: "Рівень міста",
          country: "Рівень країни",
          open: "Відкрити запис",
        }
      : {
          empty: "No published records with a map-ready public location yet.",
          city: "City level",
          country: "Country level",
          open: "Open record",
        };

  const safePoints = points.map((point) => ({
    ...point,
    craftId: escapeHtml(point.craftId),
    name: escapeHtml(point.name),
    role: escapeHtml(point.role),
    location: escapeHtml(point.location),
    href: escapeHtml(point.href),
  }));

  const data = JSON.stringify(safePoints).replaceAll("<", "\\u003c");
  const emptyText = JSON.stringify(labels.empty);
  const cityText = JSON.stringify(labels.city);
  const countryText = JSON.stringify(labels.country);
  const openText = JSON.stringify(labels.open);

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
    const openText = ${openText};

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
          craftId: point.craftId,
          name: point.name,
          role: point.role,
          location: point.location,
          precision: point.precision,
          href: point.href
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
        cluster: true,
        clusterMaxZoom: 10,
        clusterRadius: 45
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'craftid',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#1e3a5f',
          'circle-radius': ['step', ['get', 'point_count'], 18, 10, 23, 40, 30],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'craftid',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 12
        },
        paint: { 'text-color': '#ffffff' }
      });

      map.addLayer({
        id: 'unclustered',
        type: 'circle',
        source: 'craftid',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#1e3a5f',
          'circle-radius': 8,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }
      });

      map.on('click', 'clusters', async (event) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: ['clusters'] })[0];
        if (!feature) return;
        const clusterId = feature.properties.cluster_id;
        const source = map.getSource('craftid');
        const zoom = await source.getClusterExpansionZoom(clusterId);
        map.easeTo({ center: feature.geometry.coordinates, zoom });
      });

      map.on('click', 'unclustered', (event) => {
        const feature = event.features && event.features[0];
        if (!feature) return;
        const p = feature.properties;
        const precision = p.precision === 'city' ? cityText : countryText;
        const html =
          '<div class="popup-id">' + p.craftId + '</div>' +
          '<div class="popup-name">' + p.name + '</div>' +
          '<div class="popup-meta">' + (p.role || '') + '</div>' +
          '<div class="popup-meta">' + (p.location || '') + ' · ' + precision + '</div>' +
          '<a class="popup-link" href="' + p.href + '" target="_top">' + openText + ' →</a>';
        new maplibregl.Popup({ offset: 12 }).setLngLat(feature.geometry.coordinates).setHTML(html).addTo(map);
      });

      for (const layer of ['clusters', 'unclustered']) {
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
      title={locale === "uk" ? "Карта ремісничих навичок CraftID" : "CraftID Craft Skills Map"}
      srcDoc={srcDoc}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
