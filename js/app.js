/**
 * Pad Koi — Application entry point
 * A project of ScriptySphere
 */

(function () {
  const state = {
    emergencyMode: false,
  };

  document.addEventListener("DOMContentLoaded", async () => {
    setupNav();
    setupLanguageToggle();
    setupYear();

    await PadKoiI18n.load();
    await PadKoiStores.load();

    initReducedMotion();
    renderStoreOwnerLinks();
    renderAddStoreForm();

    if (document.getElementById("padkoi-map")) {
      await initFindPadsExperience();
    }

    if (document.getElementById("knowledge-hub-full")) {
      renderKnowledgeHub("knowledge-hub-full");
    }
    if (document.getElementById("knowledge-hub-preview")) {
      renderKnowledgeHub("knowledge-hub-preview", 3);
    }

    if (document.getElementById("impact-stats")) {
      renderImpact();
    }

    document.addEventListener("padkoi:languagechange", () => {
      if (document.getElementById("padkoi-map")) {
        refreshResults();
      }
    });

    lucideRefresh();
  });

  // -----------------------------------------------------------------
  // Navigation
  // -----------------------------------------------------------------
  function setupNav() {
    const toggle = document.querySelector(".nav-toggle");
    const menu = document.querySelector(".nav-menu");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("nav-menu--open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    menu.querySelectorAll("a").forEach((link) =>
      link.addEventListener("click", () => {
        menu.classList.remove("nav-menu--open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  function setupLanguageToggle() {
    document.querySelectorAll("[data-lang-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => PadKoiI18n.toggle());
    });
  }

  function setupYear() {
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }

  function initReducedMotion() {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) document.documentElement.classList.add("reduced-motion");
  }

  function lucideRefresh() {
    if (window.lucide) window.lucide.createIcons();
  }

  // -----------------------------------------------------------------
  // Find Pads experience (home + stores + emergency pages)
  // -----------------------------------------------------------------
  async function initFindPadsExperience() {
    state.emergencyMode = document.body.hasAttribute("data-emergency-page");
    if (state.emergencyMode) {
      PadKoiFilters.set({ openNow: true, sort: "nearest" });
    }

    PadKoiMap.init("padkoi-map");

    bindSearchControls();
    bindFilterControls();
    bindLocationButton();
    bindResultsInteractions();

    // Attempt automatic geolocation only on the homepage's primary CTA flow.
    refreshResults();
  }

  function bindLocationButton() {
    const btn = document.querySelector("[data-action='find-near-me']");
    if (!btn) return;
    btn.addEventListener("click", requestGeolocation);
  }

  function requestGeolocation() {
    const statusEl = document.getElementById("location-status");
    if (!("geolocation" in navigator)) {
      showLocationStatus(PadKoiI18n.t("location.unavailable"), "warning");
      return;
    }
    showLocationStatus(PadKoiI18n.t("location.locating"), "info");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        PadKoiStores.setUserLocation(latitude, longitude);
        PadKoiMap.setUserLocation(latitude, longitude);
        showLocationStatus(PadKoiI18n.t("location.found"), "success");
        PadKoiFilters.set({ sort: "nearest" });
        refreshResults();
        document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
      () => {
        showLocationStatus(PadKoiI18n.t("location.denied"), "warning");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }

  function showLocationStatus(message, tone) {
    const statusEl = document.getElementById("location-status");
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `location-status location-status--${tone}`;
    statusEl.hidden = false;
  }

  function bindSearchControls() {
    const searchInput = document.getElementById("store-search-input");
    const manualInput = document.getElementById("manual-area-input");
    const manualBtn = document.getElementById("manual-search-btn");

    if (searchInput) {
      searchInput.addEventListener("input", debounce(() => {
        PadKoiFilters.set({ query: searchInput.value });
        refreshResults();
      }, 200));
    }

    if (manualBtn && manualInput) {
      manualBtn.addEventListener("click", () => {
        PadKoiFilters.set({ query: manualInput.value });
        refreshResults();
        document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      manualInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") manualBtn.click();
      });
    }
  }

  function bindFilterControls() {
    const panel = document.getElementById("filters-panel");
    if (!panel) return;

    panel.querySelectorAll("[data-filter-type]").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        PadKoiFilters.toggleType(checkbox.value);
        refreshResults();
      });
    });

    const openNow = document.getElementById("filter-open-now");
    if (openNow) openNow.addEventListener("change", () => {
      PadKoiFilters.set({ openNow: openNow.checked });
      refreshResults();
    });

    const verifiedOnly = document.getElementById("filter-verified-only");
    if (verifiedOnly) verifiedOnly.addEventListener("change", () => {
      PadKoiFilters.set({ verifiedOnly: verifiedOnly.checked });
      refreshResults();
    });

    const availableNow = document.getElementById("filter-available-now");
    if (availableNow) availableNow.addEventListener("change", () => {
      PadKoiFilters.set({ availableNow: availableNow.checked });
      refreshResults();
    });

    const distanceSelect = document.getElementById("filter-distance");
    if (distanceSelect) distanceSelect.addEventListener("change", () => {
      const value = distanceSelect.value ? Number(distanceSelect.value) : null;
      PadKoiFilters.set({ maxDistanceMeters: value });
      refreshResults();
    });

    const clearBtn = document.getElementById("filters-clear");
    if (clearBtn) clearBtn.addEventListener("click", () => {
      PadKoiFilters.reset();
      panel.querySelectorAll("input[type='checkbox']").forEach((cb) => (cb.checked = false));
      if (distanceSelect) distanceSelect.value = "";
      refreshResults();
    });

    const toggleBtn = document.getElementById("filters-toggle");
    if (toggleBtn) toggleBtn.addEventListener("click", () => {
      const isOpen = panel.classList.toggle("filters-panel--open");
      toggleBtn.setAttribute("aria-expanded", String(isOpen));
    });
  }

  function bindResultsInteractions() {
    const container = document.getElementById("results-list");
    if (!container) return;
    container.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action='view-on-map']");
      if (btn) {
        PadKoiMap.highlightMarker(btn.getAttribute("data-store-id"));
        document.getElementById("padkoi-map")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  function refreshResults() {
    let stores = PadKoiStores.getAllStores();
    stores = PadKoiStores.withDistances(stores);

    if (state.emergencyMode) {
      stores = stores.filter(
        (s) => s.isEmergencyPoint || s.is24Hours || PadKoiStores.isOpenNow(s) === true
      );
    }

    const filtered = PadKoiFilters.apply(stores);
    renderResults(filtered);
    PadKoiMap.setMarkers(filtered, (storeId) => PadKoiMap.highlightMarker(storeId));
    lucideRefresh();
  }

  function renderResults(stores) {
    const container = document.getElementById("results-list");
    const emptyState = document.getElementById("results-empty");
    const countEl = document.getElementById("results-count");
    if (!container) return;

    if (stores.length === 0) {
      container.innerHTML = "";
      if (emptyState) emptyState.hidden = false;
      if (countEl) countEl.textContent = "0";
      return;
    }

    if (emptyState) emptyState.hidden = true;
    if (countEl) countEl.textContent = String(stores.length);

    const limited = stores.slice(0, PadKoiConfig.search.maxResults);
    container.innerHTML = limited.map((s) => PadKoiStores.renderCard(s)).join("");
  }

  // -----------------------------------------------------------------
  // Knowledge hub
  // -----------------------------------------------------------------
  const KNOWLEDGE_ARTICLES = [
    { icon: "droplets", key: "basics" },
    { icon: "ruler", key: "absorbency" },
    { icon: "shield-check", key: "hygiene" },
    { icon: "trash-2", key: "disposal" },
    { icon: "message-circle-question", key: "misconceptions" },
    { icon: "heart-handshake", key: "supporting" },
    { icon: "school", key: "schools" },
  ];

  const KNOWLEDGE_CONTENT = {
    en: {
      basics: ["Menstrual hygiene basics", "What menstrual health means day-to-day, and why access to clean products and facilities matters."],
      absorbency: ["Choosing suitable pad absorbency", "How flow, activity level and overnight use can guide which pad type may suit a person best."],
      hygiene: ["Safe and hygienic use", "General good practice for changing pads regularly and looking after personal hygiene during a period."],
      disposal: ["Responsible disposal", "Simple, respectful ways to dispose of used menstrual products where facilities are available."],
      misconceptions: ["Common misconceptions", "Addressing a few widespread myths about menstruation with clear, factual information."],
      supporting: ["Supporting someone during menstruation", "Practical, non-judgemental ways friends, family and colleagues can help."],
      schools: ["Menstrual hygiene in schools", "Why access to products and information at school affects attendance and wellbeing."],
    },
    bn: {
      basics: ["মাসিক স্বাস্থ্যবিধির মূল বিষয়", "মাসিক স্বাস্থ্য দৈনন্দিন জীবনে কী বোঝায় এবং পরিষ্কার পণ্য ও সুবিধার সহজলভ্যতা কেন গুরুত্বপূর্ণ।"],
      absorbency: ["উপযুক্ত প্যাড শোষণ ক্ষমতা বেছে নেওয়া", "প্রবাহ, কর্মক্ষমতা এবং রাতের ব্যবহার কীভাবে সঠিক প্যাড বেছে নিতে সাহায্য করে।"],
      hygiene: ["নিরাপদ ও স্বাস্থ্যকর ব্যবহার", "নিয়মিত প্যাড পরিবর্তন এবং ব্যক্তিগত স্বাস্থ্যবিধির সাধারণ ভালো অনুশীলন।"],
      disposal: ["দায়িত্বশীল নিষ্পত্তি", "সুযোগ থাকলে ব্যবহৃত মাসিক পণ্য সম্মানজনকভাবে নিষ্পত্তির সহজ উপায়।"],
      misconceptions: ["সাধারণ ভুল ধারণা", "মাসিক নিয়ে কিছু প্রচলিত ভুল ধারণা স্পষ্ট ও তথ্যভিত্তিক তথ্য দিয়ে দূর করা।"],
      supporting: ["মাসিকের সময় কাউকে সহায়তা করা", "বন্ধু, পরিবার এবং সহকর্মীরা কীভাবে বাস্তবসম্মতভাবে সাহায্য করতে পারেন।"],
      schools: ["স্কুলে মাসিক স্বাস্থ্যবিধি", "স্কুলে পণ্য ও তথ্যের সহজলভ্যতা কীভাবে উপস্থিতি ও সুস্থতাকে প্রভাবিত করে।"],
    },
  };

  function renderKnowledgeHub(containerId, limit) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const lang = PadKoiI18n.getLang();
    const content = KNOWLEDGE_CONTENT[lang] || KNOWLEDGE_CONTENT.en;
    const items = limit ? KNOWLEDGE_ARTICLES.slice(0, limit) : KNOWLEDGE_ARTICLES;

    container.innerHTML = items
      .map((item) => {
        const [title, body] = content[item.key];
        return `
        <article class="knowledge-card">
          <div class="knowledge-card__icon"><i data-lucide="${item.icon}"></i></div>
          <h3>${title}</h3>
          <p>${body}</p>
        </article>`;
      })
      .join("");

    lucideRefresh();
  }

  document.addEventListener("padkoi:languagechange", () => {
    if (document.getElementById("knowledge-hub-full")) renderKnowledgeHub("knowledge-hub-full");
    if (document.getElementById("knowledge-hub-preview")) renderKnowledgeHub("knowledge-hub-preview", 3);
  });

  // -----------------------------------------------------------------
  // Impact section (clearly labelled demo data)
  // -----------------------------------------------------------------
  function renderImpact() {
    const map = {
      "impact-stat-stores": PadKoiConfig.impactDemo.storesListed,
      "impact-stat-districts": PadKoiConfig.impactDemo.districtsCovered,
      "impact-stat-emergency": PadKoiConfig.impactDemo.emergencyPoints,
      "impact-stat-reports": PadKoiConfig.impactDemo.communityReports,
    };
    Object.entries(map).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `${value}+`;
    });
  }

  // -----------------------------------------------------------------
  // Add a Store form + Store owner CTA (config-driven, no fake backend)
  // -----------------------------------------------------------------
  function renderStoreOwnerLinks() {
    document.querySelectorAll("[data-config='claimStoreFormUrl']").forEach((el) => {
      el.setAttribute("href", PadKoiConfig.submissions.claimStoreFormUrl);
    });
    document.querySelectorAll("[data-config='contactEmail']").forEach((el) => {
      el.setAttribute("href", `mailto:${PadKoiConfig.submissions.contactEmail}`);
      if (el.dataset.fillText === "true") el.textContent = PadKoiConfig.submissions.contactEmail;
    });
  }

  function renderAddStoreForm() {
    const form = document.getElementById("add-store-form");
    if (!form) return;

    const productList = document.getElementById("add-store-products");
    if (productList) {
      const catalog = PadKoiStores.getProductCatalog().length
        ? PadKoiStores.getProductCatalog()
        : ["Regular Pad", "Heavy Flow Pad", "Overnight Pad", "Pantyliner", "Reusable Pad"];
      productList.innerHTML = catalog
        .map(
          (p, i) => `
        <label class="checkbox-pill">
          <input type="checkbox" name="products" value="${p}" id="product-${i}" />
          <span>${p}</span>
        </label>`
        )
        .join("");
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const formUrl = PadKoiConfig.submissions.addStoreFormUrl;
      const confirmationEl = document.getElementById("add-store-confirmation");

      if (formUrl && formUrl !== "YOUR_GOOGLE_FORM_URL_HERE") {
        window.open(formUrl, "_blank", "noopener");
      }

      if (confirmationEl) {
        confirmationEl.hidden = false;
        confirmationEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      form.reset();
    });
  }

  // -----------------------------------------------------------------
  // Utilities
  // -----------------------------------------------------------------
  function debounce(fn, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  }

  window.addEventListener("resize", debounce(() => PadKoiMap.invalidateSize(), 200));
})();
