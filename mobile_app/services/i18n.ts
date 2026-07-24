import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../locales/en.json';
import pl from '../locales/pl.json';

const LANG_KEY = 'rsvp-mobile-locale';

type Lang = 'en' | 'pl';

const getDeviceLang = (): Lang => {
  const code = Localization.getLocales()[0]?.languageCode ?? 'en';
  return code?.startsWith('pl') ? 'pl' : 'en';
};

const init = async () => {
  let saved: string | null = null;
  try {
    saved = await AsyncStorage.getItem(LANG_KEY);
  } catch {
    // storage unavailable — fall through to device/default
  }

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      pl: { translation: pl },
    },
    lng: saved ?? getDeviceLang(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

  i18n.on('languageChanged', (lng) => {
    AsyncStorage.setItem(LANG_KEY, lng).catch(() => {});
  });
};

init();

export default i18n;
