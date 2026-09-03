/**
 * Pad Koi — Map layer (Leaflet + OpenStreetMap)
 * A project of ScriptySphere
 *
 * This module is intentionally isolated behind a small interface
 * (init, setMarkers, centerOn, highlightMarker) so the underlying
 * provider can be swapped for Google Maps later by rewriting only
 * this file. See config.js → map.provider.
 */

const PadKoiMap = (() => {
  let map = null;
  let markersLayer = null;
  let markerIndex = {}; // storeId -> Leaflet marker
  let userMarker = null;

  function init(elementId) {
    const el = document.getElementById(elementId);
    if (!el || typeof L === "undefined") {
      console.error("Pad Koi: map container or Leaflet library not available");
      return null;
    }

    const { defaultCenter, defaultZoom, tileLayerUrl, tileLayerAttribution } = PadKoiConfig.map;

    map = L.map(elementId, {
      center: [defaultCenter.lat, defaultCenter.lng],
      zoom: defaultZoom,
      scrollWheelZoom: true,
    });

    L.tileLayer(tileLayerUrl, {
      attribution: tileLayerAttribution,
      maxZoom: 19,
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
    return map;
  }

  function iconFor(store) {
    const color = store.isEmergencyPoint ? "#DC2626" : "#E83E8C";
    const html = `<span class="map-pin-dot" style="background:${color}"></span>`;
    return L.divIcon({
      html,
      className: "map-pin-wrapper",
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }

  function setMarkers(stores, onSelect) {
    if (!map) return;
    markersLayer.clearLayers();
    markerIndex = {};

    stores.forEach((store) => {
      const marker = L.marker([store.latitude, store.longitude], {
        icon: iconFor(store),
        title: store.name,
        keyboard: true,
        alt: store.name,
      });

      marker.bindPopup(
        `<strong>${escapeHtml(store.name)}</strong><br>${escapeHtml(store.address)}`
      );

      marker.on("click", () => {
        if (onSelect) onSelect(store.id);
      });

      marker.addTo(markersLayer);
      markerIndex[store.id] = marker;
    });

    if (stores.length > 0) {
      const bounds = L.latLngBounds(stores.map((s) => [s.latitude, s.longitude]));
      if (userMarker) bounds.extend(userMarker.getLatLng());
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }

  function setUserLocation(lat, lng) {
    if (!map) return;
    if (userMarker) {
      userMarker.setLatLng([lat, lng]);
    } else {
      userMarker = L.circleMarker([lat, lng], {
        radius: 8,
        color: "#B91C62",
        fillColor: "#E83E8C",
        fillOpacity: 0.9,
        weight: 2,
      }).addTo(map);
      userMarker.bindPopup("You are here");
    }
    map.setView([lat, lng], 14);
  }

  function highlightMarker(storeId) {
    const marker = markerIndex[storeId];
    if (!marker) return;
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15));
    marker.openPopup();
  }

  function invalidateSize() {
    if (map) map.invalidateSize();
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str ?? "");
    return div.innerHTML;
  }

  return { init, setMarkers, setUserLocation, highlightMarker, invalidateSize };
})();
