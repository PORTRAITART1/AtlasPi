/**
 * AtlasPi — i18n System
 * Supports: EN / FR / AR
 * v1.0 Mainnet
 */

(function () {
  const STORAGE_KEY = "atlaspi-lang";

  const translations = {
    en: {
      discover: "Discover",
      map: "Map",
      payments: "Payments",
      vip: "VIP",
      support: "Support",
      subscriptions: "Subscriptions",
      plans: "Plans",
      profile: "Profile",
      go_vip: "Go VIP",
      pay_with_pi: "Pay with Pi",
      loading: "Loading...",
      no_results: "No results found.",
      search_merchants: "Search merchants...",
      accepts_pi: "Accepts Pi",
      verified: "Verified",
      trusted: "Trusted",
      network: "Mainnet",
    },
    fr: {
      discover: "Découvrir",
      map: "Carte",
      payments: "Paiements",
      vip: "VIP",
      support: "Support",
      subscriptions: "Abonnements",
      plans: "Plans",
      profile: "Profil",
      go_vip: "Devenir VIP",
      pay_with_pi: "Payer avec Pi",
      loading: "Chargement...",
      no_results: "Aucun résultat.",
      search_merchants: "Rechercher un marchand...",
      accepts_pi: "Accepte Pi",
      verified: "Vérifié",
      trusted: "Fiable",
      network: "Réseau Principal",
    },
    ar: {
      discover: "اكتشف",
      map: "الخريطة",
      payments: "المدفوعات",
      vip: "VIP",
      support: "الدعم",
      subscriptions: "الاشتراكات",
      plans: "الخطط",
      profile: "الملف الشخصي",
      go_vip: "اشترك VIP",
      pay_with_pi: "ادفع بـ Pi",
      loading: "جارٍ التحميل...",
      no_results: "لا توجد نتائج.",
      search_merchants: "ابحث عن تاجر...",
      accepts_pi: "يقبل Pi",
      verified: "موثق",
      trusted: "موثوق",
      network: "الشبكة الرئيسية",
    },
  };

  function detectLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) return saved;
    const browser = navigator.language?.slice(0, 2).toLowerCase();
    if (translations[browser]) return browser;
    return "en";
  }

  function applyDirection(lang) {
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }

  function applyTranslations(lang) {
    const t = translations[lang] || translations.en;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (t[key]) el.textContent = t[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (t[key]) el.placeholder = t[key];
    });
  }

  function addSwitcher() {
    const menus = document.querySelectorAll(".menu-panel");
    menus.forEach((menu) => {
      if (menu.querySelector(".lang-switcher")) return;
      const switcher = document.createElement("div");
      switcher.className = "lang-switcher";
      switcher.style.cssText = `
        display:flex; gap:6px; margin-top:8px;
        padding-top:8px;
        border-top:1px solid rgba(255,255,255,0.1);
      `;
      ["en", "fr", "ar"].forEach((lang) => {
        const btn = document.createElement("button");
        btn.textContent = lang.toUpperCase();
        btn.style.cssText = `
          padding:6px 12px; border-radius:8px;
          border:1px solid rgba(255,255,255,0.15);
          background:rgba(255,255,255,0.05);
          color:inherit; cursor:pointer;
          font-size:0.8rem; font-weight:600;
        `;
        btn.addEventListener("click", () => setLang(lang));
        switcher.appendChild(btn);
      });
      menu.appendChild(switcher);
    });
  }

  function
cat > /Users/abdrahim/Desktop/AtlasPi/frontend/i18n.js << 'JSEOF'
/**
 * AtlasPi — i18n System
 * Supports: EN / FR / AR
 * v1.0 Mainnet
 */

(function () {
  const STORAGE_KEY = "atlaspi-lang";

  const translations = {
    en: {
      discover: "Discover",
      map: "Map",
      payments: "Payments",
      vip: "VIP",
      support: "Support",
      subscriptions: "Subscriptions",
      plans: "Plans",
      profile: "Profile",
      go_vip: "Go VIP",
      pay_with_pi: "Pay with Pi",
      loading: "Loading...",
      no_results: "No results found.",
      search_merchants: "Search merchants...",
      accepts_pi: "Accepts Pi",
      verified: "Verified",
      trusted: "Trusted",
      network: "Mainnet",
    },
    fr: {
      discover: "Découvrir",
      map: "Carte",
      payments: "Paiements",
      vip: "VIP",
      support: "Support",
      subscriptions: "Abonnements",
      plans: "Plans",
      profile: "Profil",
      go_vip: "Devenir VIP",
      pay_with_pi: "Payer avec Pi",
      loading: "Chargement...",
      no_results: "Aucun résultat.",
      search_merchants: "Rechercher un marchand...",
      accepts_pi: "Accepte Pi",
      verified: "Vérifié",
      trusted: "Fiable",
      network: "Réseau Principal",
    },
    ar: {
      discover: "اكتشف",
      map: "الخريطة",
      payments: "المدفوعات",
      vip: "VIP",
      support: "الدعم",
      subscriptions: "الاشتراكات",
      plans: "الخطط",
      profile: "الملف الشخصي",
      go_vip: "اشترك VIP",
      pay_with_pi: "ادفع بـ Pi",
      loading: "جارٍ التحميل...",
      no_results: "لا توجد نتائج.",
      search_merchants: "ابحث عن تاجر...",
      accepts_pi: "يقبل Pi",
      verified: "موثق",
      trusted: "موثوق",
      network: "الشبكة الرئيسية",
    },
  };

  function detectLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) return saved;
    const browser = navigator.language?.slice(0, 2).toLowerCase();
    if (translations[browser]) return browser;
    return "en";
  }

  function applyDirection(lang) {
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }

  function applyTranslations(lang) {
    const t = translations[lang] || translations.en;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (t[key]) el.textContent = t[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (t[key]) el.placeholder = t[key];
    });
  }

  function addSwitcher() {
    const menus = document.querySelectorAll(".menu-panel");
    menus.forEach((menu) => {
      if (menu.querySelector(".lang-switcher")) return;
      const switcher = document.createElement("div");
      switcher.className = "lang-switcher";
      switcher.style.cssText = `
        display:flex; gap:6px; margin-top:8px;
        padding-top:8px;
        border-top:1px solid rgba(255,255,255,0.1);
      `;
      ["en", "fr", "ar"].forEach((lang) => {
        const btn = document.createElement("button");
        btn.textContent = lang.toUpperCase();
        btn.style.cssText = `
          padding:6px 12px; border-radius:8px;
          border:1px solid rgba(255,255,255,0.15);
          background:rgba(255,255,255,0.05);
          color:inherit; cursor:pointer;
          font-size:0.8rem; font-weight:600;
        `;
        btn.addEventListener("click", () => setLang(lang));
        switcher.appendChild(btn);
      });
      menu.appendChild(switcher);
    });
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    applyDirection(lang);
    applyTranslations(lang);
    if (window.AtlasPiNotify) {
      const labels = { en: "English", fr: "Français", ar: "العربية" };
      window.AtlasPiNotify.info(`🌍 Language: ${labels[lang]}`, 2000);
    }
  }

  function init() {
    const lang = detectLang();
    applyDirection(lang);
    applyTranslations(lang);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", addSwitcher);
    } else {
      addSwitcher();
    }
    console.log(`[AtlasPi i18n] lang: ${lang}`);
  }

  window.AtlasPiI18n = {
    setLang,
    detectLang,
    t: (key) => {
      const lang = detectLang();
      return (translations[lang] || translations.en)[key] || key;
    },
  };

  init();
})();
