/**
 * Pad Koi — Internationalisation (English / বাংলা)
 * A project of ScriptySphere
 */

const PadKoiI18n = (() => {
  let translations = {};
  let currentLang = localStorage.getItem("padkoi_lang") || "en";

  async function load() {
    try {
      const res = await fetch(PadKoiConfig.data.translationsUrl);
      if (!res.ok) throw new Error("Translations file could not be loaded");
      translations = await res.json();
    } catch (err) {
      console.error("Pad Koi: failed to load translations", err);
      translations = { en: {}, bn: {} };
    }
    applyLanguage(currentLang);
  }

  function t(key) {
    const dict = translations[currentLang] || {};
    return dict[key] || translations.en?.[key] || key;
  }

  function applyLanguage(lang) {
    currentLang = translations[lang] ? lang : "en";
    localStorage.setItem("padkoi_lang", currentLang);
    document.documentElement.lang = currentLang === "bn" ? "bn" : "en";
    document.documentElement.dir = "ltr";

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      el.textContent = t(key);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      el.setAttribute("placeholder", t(key));
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria-label");
      el.setAttribute("aria-label", t(key));
    });

    document.dispatchEvent(new CustomEvent("padkoi:languagechange", { detail: { lang: currentLang } }));
  }

  function toggle() {
    applyLanguage(currentLang === "en" ? "bn" : "en");
  }

  function getLang() {
    return currentLang;
  }

  return { load, t, applyLanguage, toggle, getLang };
})();
