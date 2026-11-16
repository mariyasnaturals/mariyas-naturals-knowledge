/**
 * Typed accessors for the Living Gallery copy.
 *
 * `dict` picks the right locale out of a `{ en, ml, hi, ta, kn }` literal, with a
 * guaranteed English fallback so a missing translation can never blank a control.
 */
import type { Locale } from './index';
import type { Localized } from '../data/living-copy';

export const dict = (value: Localized, lang: Locale): string =>
  value[lang] ?? value.en;

/** Substitutes `{language}` and any other `{token}` in a template. */
export const fill = (
  template: string,
  tokens: Record<string, string>,
): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => tokens[key] ?? match);
