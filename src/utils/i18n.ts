import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../i18n/en.json";
import de from "../i18n/de.json";

// Only initialize if not already initialized (prevents SSR issues)
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      de: { translation: de },
    },
    lng: "en", // Default to 'en' on server
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // Disable suspense for SSR
    },
  });

  // On client side, set language from localStorage
  if (typeof window !== "undefined") {
    const savedLang = localStorage.getItem("language") || "en";
    i18n.changeLanguage(savedLang);
  }
}

export default i18n;
