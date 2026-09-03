/**
 * Pad Koi — Store data, distance calculation and card rendering
 * A project of ScriptySphere
 */

const PadKoiStores = (() => {
  let allStores = [];
  let productCatalog = [];
  let userLocation = null; // { lat, lng } | null

  const TYPE_ICONS = {
    pharmacy: "cross",
    supermarket: "shopping-cart",
    convenience: "store",
    shop: "store",
    emergency: "life-buoy",
    vending: "package",
  };

  async function load() {
    try {
      const res = await fetch(PadKoiConfig.data.storesUrl);
      if (!res.ok) throw new Error("Store data could not be loaded");
      const json = await res.json();
      allStores = validateStores(json.stores || []);
      productCatalog = json.productCatalog || [];
      return allStores;
    } catch (err) {
      console.error("Pad Koi: failed to load store data", err);
      allStores = [];
      productCatalog = [];
      return [];
    }
  }

  function validateStores(rawStores) {
    return rawStores.filter((s) => {
      const validCoords =
        typeof s.latitude === "number" &&
        typeof s.longitude === "number" &&
        Math.abs(s.latitude) <= 90 &&
        Math.abs(s.longitude) <= 180;
      if (!validCoords) {
        console.warn("Pad Koi: skipping store with invalid coordinates", s.id);
      }
      return validCoords && s.name;
    });
  }

  // Haversine formula — distance in metres between two lat/lng points
  function distanceMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function formatDistance(metres) {
    if (metres < 1000) return `${Math.round(metres)} m`;
    return `${(metres / 1000).toFixed(1)} km`;
  }

  function setUserLocation(lat, lng) {
    userLocation = { lat, lng };
  }

  function getUserLocation() {
    return userLocation;
  }

  function getAllStores() {
    return allStores;
  }

  function getProductCatalog() {
    return productCatalog;
  }

  function withDistances(stores) {
    if (!userLocation) return stores.map((s) => ({ ...s, distanceMeters: null }));
    return stores.map((s) => ({
      ...s,
      distanceMeters: distanceMeters(userLocation.lat, userLocation.lng, s.latitude, s.longitude),
    }));
  }

  function isOpenNow(store) {
    if (store.is24Hours) return true;
    if (!store.openingHours || !store.openingHours.includes("-")) return null;
    const [openStr, closeStr] = store.openingHours.split("-");
    const now = new Date();
    const [oh, om] = openStr.split(":").map(Number);
    const [ch, cm] = closeStr.split(":").map(Number);
    const openMinutes = oh * 60 + om;
    const closeMinutes = ch * 60 + cm;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (closeMinutes <= openMinutes) {
      // overnight window, e.g. 20:00-06:00
      return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
    }
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  }

  function timeAgo(isoString) {
    const then = new Date(isoString).getTime();
    if (Number.isNaN(then)) return "";
    const diffMs = Date.now() - then;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  function directionsUrl(store) {
    return `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
  }

  function availabilityLabel(store) {
    const t = PadKoiI18n.t;
    switch (store.availabilityStatus) {
      case "verified":
        return { text: `${t("results.available")} \u00b7 ${t("results.verified")} ${timeAgo(store.lastVerified)}`, cls: "badge--success" };
      case "community":
        return { text: `${t("results.available")} \u00b7 ${t("results.communityReported")} \u00b7 ${timeAgo(store.lastVerified)}`, cls: "badge--warning" };
      default:
        return { text: `${t("results.unknown")} \u00b7 ${t("results.lastChecked")} ${timeAgo(store.lastVerified)}`, cls: "badge--neutral" };
    }
  }

  function iconFor(type) {
    return TYPE_ICONS[type] || "map-pin";
  }

  function renderCard(store, { compact = false } = {}) {
    const t = PadKoiI18n.t;
    const open = isOpenNow(store);
    const openLabel =
      open === null ? "" : open ? `<span class="pill pill--open">${t("results.openNow")}</span>` : `<span class="pill pill--closed">${t("results.closed")}</span>`;
    const distanceLabel =
      store.distanceMeters != null
        ? `<span class="card-distance">${formatDistance(store.distanceMeters)} ${t("results.away")}</span>`
        : "";
    const avail = availabilityLabel(store);
    const emergencyTag = store.isEmergencyPoint
      ? `<span class="pill pill--emergency">${t("results.emergencyPoint")}</span>`
      : "";
    const demoTag = store.isDemo ? `<span class="pill pill--demo">${t("results.demoLabel")}</span>` : "";
    const verifiedTag = store.verified
      ? `<span class="verified-tick" title="${t('results.verified')}"><i data-lucide="badge-check"></i> ${t("results.verified")}</span>`
      : "";
    const products = (store.products || [])
      .map((p) => `<span class="chip">${escapeHtml(p)}</span>`)
      .join("");
    const phoneBtn = store.phone
      ? `<a class="btn btn--ghost btn--sm" href="tel:${escapeHtml(store.phone)}" data-i18n-aria-label="results.call"><i data-lucide="phone"></i> ${t("results.call")}</a>`
      : "";

    return `
      <article class="store-card ${store.isEmergencyPoint ? "store-card--emergency" : ""}" data-store-id="${store.id}" tabindex="0">
        <div class="store-card__icon" aria-hidden="true"><i data-lucide="${iconFor(store.type)}"></i></div>
        <div class="store-card__body">
          <div class="store-card__top">
            <h3 class="store-card__name">${escapeHtml(store.name)}</h3>
            ${distanceLabel}
          </div>
          <div class="store-card__tags">
            ${openLabel}${emergencyTag}${demoTag}
          </div>
          <p class="store-card__address"><i data-lucide="map-pin" aria-hidden="true"></i> ${escapeHtml(store.address)}</p>
          <p class="badge ${avail.cls}">${avail.text}</p>
          ${!compact ? `<div class="store-card__chips">${products}</div>` : ""}
          <div class="store-card__footer">
            ${verifiedTag}
            <div class="store-card__actions">
              ${phoneBtn}
              <button class="btn btn--ghost btn--sm" data-action="view-on-map" data-store-id="${store.id}">
                <i data-lucide="map"></i> ${t("results.viewOnMap")}
              </button>
              <a class="btn btn--primary btn--sm" href="${directionsUrl(store)}" target="_blank" rel="noopener">
                <i data-lucide="navigation"></i> ${t("results.directions")}
              </a>
            </div>
          </div>
        </div>
      </article>`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str ?? "");
    return div.innerHTML;
  }

  return {
    load,
    getAllStores,
    getProductCatalog,
    setUserLocation,
    getUserLocation,
    withDistances,
    isOpenNow,
    timeAgo,
    directionsUrl,
    availabilityLabel,
    renderCard,
    formatDistance,
  };
})();
