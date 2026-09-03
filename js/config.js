/**
 * Pad Koi — Configuration
 * A project of ScriptySphere
 *
 * Every value that a future maintainer needs to change to relaunch,
 * rebrand or reconnect Pad Koi lives in this single file.
 */

const PadKoiConfig = {
  // ---------------------------------------------------------------------
  // Brand
  // ---------------------------------------------------------------------
  brand: {
    name: "Pad Koi",
    organisation: "ScriptySphere",
    tagline: "Find sanitary pads near you.",
  },

  // ---------------------------------------------------------------------
  // Data sources
  // ---------------------------------------------------------------------
  data: {
    storesUrl: "data/stores.json",
    translationsUrl: "data/translations.json",
  },

  // ---------------------------------------------------------------------
  // Map
  // ---------------------------------------------------------------------
  // Pad Koi ships with Leaflet + OpenStreetMap (no API key required).
  // To switch to Google Maps later, set provider to "google" and supply
  // an API key. map.js is written so only the initialisation function
  // needs to change — rendering logic (markers, popups, fit-bounds)
  // is provider-agnostic where possible.
  map: {
    provider: "leaflet", // "leaflet" | "google"
    defaultCenter: { lat: 23.8103, lng: 90.4125 }, // Dhaka
    defaultZoom: 12,
    tileLayerUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    tileLayerAttribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    // Only required if map.provider === "google". Never commit a real
    // key to a public repository — use environment-specific injection.
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY_HERE",
  },

  // ---------------------------------------------------------------------
  // Community submissions
  // ---------------------------------------------------------------------
  // Pad Koi is a static site with no backend. Point these at a Google
  // Form (recommended) or a contact email/WhatsApp until a backend
  // exists. See README.md → "How to configure submissions".
  submissions: {
    addStoreFormUrl: "YOUR_GOOGLE_FORM_URL_HERE",
    claimStoreFormUrl: "YOUR_STORE_OWNER_FORM_URL_HERE",
    contactEmail: "hello@scriptysphere.example",
  },

  // ---------------------------------------------------------------------
  // Search behaviour
  // ---------------------------------------------------------------------
  search: {
    defaultRadiusMeters: 5000,
    maxResults: 50,
  },

  // ---------------------------------------------------------------------
  // Impact numbers shown on the homepage — CLEARLY LABELLED AS DEMO DATA
  // in the UI. Replace with real, verified figures before launch.
  // ---------------------------------------------------------------------
  impactDemo: {
    storesListed: 8,
    districtsCovered: 1,
    emergencyPoints: 1,
    communityReports: 2,
  },
};
