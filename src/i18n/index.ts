import en from './en.json';
import ml from './ml.json';
import hi from './hi.json';
import ta from './ta.json';
export const languages = {
  en: 'English',
  ml: 'മലയാളം',
  hi: 'हिन्दी',
  ta: 'தமிழ்',
} as const;
export type Locale = keyof typeof languages;
export type Dictionary = typeof en;
export const dictionaries: Record<Locale, Dictionary> = { en, ml, hi, ta };
export const locales = Object.keys(languages) as Locale[];
export const fallbackLocale: Locale = 'en';
