import en from './en.json';
import ml from './ml.json';
import hi from './hi.json';
import ta from './ta.json';
import kn from './kn.json';

export const languages = {
  en: 'English',
  ml: 'മലയാളം',
  hi: 'हिन्दी',
  ta: 'தமிழ்',
  kn: 'ಕನ್ನಡ',
} as const;
/** Endonyms for the language-choice page, where the script should speak for itself. */
export const languageHints = {
  en: 'English',
  ml: 'Malayalam',
  hi: 'Hindi',
  ta: 'Tamil',
  kn: 'Kannada',
} as const;
export type Locale = keyof typeof languages;
export type Dictionary = typeof en;
export const dictionaries: Record<Locale, Dictionary> = { en, ml, hi, ta, kn };
export const locales = Object.keys(languages) as Locale[];
export const fallbackLocale: Locale = 'en';
