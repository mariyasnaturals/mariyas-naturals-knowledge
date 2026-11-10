import type { Locale } from '../i18n';
export type ContentKind =
  'product' | 'botanical' | 'hair-care' | 'heritage' | 'quality';
export interface EditorialSource {
  title: string;
  url: string;
  accessedOn: string;
}
export interface EditorialPage {
  kind: ContentKind;
  lang: Locale;
  title: string;
  titleLang?: Locale;
  description: string;
  sources: readonly EditorialSource[];
  reviewed: boolean;
  reviewedOn?: string;
  pageSchema?: Record<string, unknown>;
  socialImage?: { src: string; width: number; height: number; alt: string };
  // Supply verified dates and reviewers only; no automatic Article/Product claims.
}
