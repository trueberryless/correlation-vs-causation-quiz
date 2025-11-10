import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../i18n/en.json";
import de from "../i18n/de.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  lng:
    typeof window !== "undefined"
      ? localStorage.getItem("language") || "en"
      : "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
