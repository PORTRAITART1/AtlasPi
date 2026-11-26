/* AtlasPi internationalisation EN/FR/AR */
(function () {
  "use strict";

  const STORAGE_KEY = "atlaspi-lang";
  const translations = {
    en: {
      discover: "Discover", map: "Map", payments: "Payments", vip: "VIP",
      support: "Support", subscriptions: "Subscriptions", plans: "Plans",
      profile: "Profile", go_vip: "Go VIP", pay_with_pi: "Pay with Pi",
      loading: "Loading...", no_results: "No results found.",
      search_merchants: "Search merchants...", accepts_pi: "Accepts Pi",
      verified: "Verified", trusted: "Trusted", network: "Testnet"
    },
    fr: {
      discover: "Découvrir", map: "Carte", payments: "Paiements", vip: "VIP",
      support: "Assistance", subscriptions: "Abonnements", plans: "Offres",
      profile: "Profil", go_vip: "Devenir VIP", pay_with_pi: "Payer avec Pi",
      loading: "Chargement...", no_results: "Aucun résultat.",
      search_merchants: "Rechercher un marchand...", accepts_pi: "Accepte Pi",
      verified: "Vérifié", trusted: "Fiable", network: "Testnet"
    },
    ar: {
      discover: "اكتشف", map: "الخريطة", payments: "المدفوعات", vip: "VIP",
      support: "الدعم", subscriptions: "الاشتراكات", plans: "الخطط",
      profile: "الملف الشخصي", go_vip: "اشترك VIP", pay_with_pi: "ادفع بـ Pi",
      loading: "جارٍ التحميل...", no_results: "لا توجد نتائج.",
      search_merchants: "ابحث عن تاجر...", accepts_pi: "يقبل Pi",
      verified: "موثق", trusted: "موثوق", network: "شبكة الاختبار"
    }
  };

  function detectLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && translations[saved]) return saved;
    } catch (_) {}
    const browserLang = (navigator.language || "en").slice(0, 2).toLowerCase();
    return translations[browserLang] ? browserLang : "en";
  }

  function applyDirection(lang) {
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }

  function applyTranslations(lang) {
    const dictionary = translations[lang] || translations.en;
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      if (dictionary[key]) element.textContent = dictionary[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const key = element.getAttribute("data-i18n-placeholder");
      if (dictionary[key]) element.placeholder = dictionary[key];
    });
  }

  function setLang(lang) {
    if (!translations[lang]) return;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
    applyDirection(lang);
    applyTranslations(lang);
  }

  function addSwitcher() {
    document.querySelectorAll(".menu-panel").forEach((menu) => {
      if (menu.querySelector(".lang-switcher")) return;
      const switcher = document.createElement("div");
      switcher.className = "lang-switcher";
      switcher.style.cssText = "display:flex;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.1);";
      ["en", "fr", "ar"].forEach((lang) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = lang.toUpperCase();
        button.setAttribute("aria-label", lang === "fr" ? "Français" : lang === "ar" ? "العربية" : "English");
        button.style.cssText = "padding:6px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:inherit;cursor:pointer;font-size:.8rem;font-weight:600;";
        button.addEventListener("click", () => setLang(lang));
        switcher.appendChild(button);
      });
      menu.appendChild(switcher);
    });
  }

  function init() {
    const lang = detectLang();
    applyDirection(lang);
    applyTranslations(lang);
    addSwitcher();
  }

  window.AtlasPiI18n = { setLang, detectLang, t: (key) => (translations[detectLang()] || translations.en)[key] || key };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
