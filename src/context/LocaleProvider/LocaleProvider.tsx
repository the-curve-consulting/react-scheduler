import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { localeContext } from "./localeContext";
import { locales } from "./locales";
import { LocaleProviderProps, LocaleType } from "./types";

const getInitialLanguage = (lang?: string) => {
  if (typeof window === "undefined") {
    return lang ?? "en";
  }

  return lang ?? localStorage.getItem("locale") ?? "en";
};

const LocaleProvider = ({ children, lang, translations }: LocaleProviderProps) => {
  const [localLang, setLocalLang] = useState<string>(() => getInitialLanguage(lang));
  const localesData = locales.getLocales();
  const effectiveLang = lang ?? localLang;

  const currentLocale = useMemo(() => {
    const locale = localesData.find((l) => l.id === effectiveLang) ?? localesData[0];

    if (typeof locale?.dayjsTranslations === "object") {
      dayjs.locale(locale.dayjsTranslations);
    }

    return locale;
  }, [effectiveLang, localesData]);

  useEffect(() => {
    translations?.forEach((translation) => {
      const localeData = localesData.find((el) => el.id === translation.id);
      if (!localeData) {
        locales.addLocales(translation);
      }
    });
  }, [localesData, translations]);

  const saveCurrentLocale = useCallback((locale: LocaleType) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", locale.id);
    }

    setLocalLang(locale.id);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", effectiveLang);
    }
  }, [effectiveLang]);

  const { Provider } = localeContext;

  return (
    <Provider value={{ currentLocale, localesData, setCurrentLocale: saveCurrentLocale }}>
      {children}
    </Provider>
  );
};

const useLanguage = () => {
  const context = useContext(localeContext);
  return context.currentLocale.lang;
};

const useLocales = () => {
  const context = useContext(localeContext);
  return context.localesData;
};

const useSetLocale = () => {
  const context = useContext(localeContext);
  return context.setCurrentLocale;
};

export default LocaleProvider;
export { useLanguage, useLocales, useSetLocale };
