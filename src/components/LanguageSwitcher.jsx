import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "de" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  // Prevent hydration mismatch by not rendering language until mounted
  if (!mounted) {
    return (
      <button
        className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-purple-800/80 backdrop-blur-lg px-4 py-2 rounded-full border border-purple-500/30 shadow-xl"
        aria-label="Switch language"
      >
        <Globe className="w-5 h-5" />
        <span className="font-semibold w-6"></span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleLanguage}
      className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-purple-800/80 backdrop-blur-lg px-4 py-2 rounded-full border border-purple-500/30 hover:bg-purple-700/80 transition-all hover:scale-105 shadow-xl"
      aria-label="Switch language"
    >
      <Globe className="w-5 h-5" />
      <span className="font-semibold">{i18n.language.toUpperCase()}</span>
    </button>
  );
};

export default LanguageSwitcher;
