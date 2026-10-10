import ru from '../locales/ru.json';
import en from '../locales/en.json';
import kk from '../locales/kk.json';
import uz from '../locales/uz.json';
import zh from '../locales/zh.json';
import tr from '../locales/tr.json';
export const locales = ['ru', 'en', 'kk', 'uz', 'zh', 'tr'] as const;
export type Locale = typeof locales[number];
export type Dictionary = typeof ru;
export const dictionaries: Record<Locale, Dictionary> = { ru, en, kk, uz, zh, tr };
export const localeNames: Record<Locale, string> = { ru: 'Русский', en: 'English', kk: 'Қазақша', uz: 'Oʻzbekcha', zh: '中文', tr: 'Türkçe' };
export const localeLabels: Record<Locale, string> = { ru: 'RU', en: 'EN', kk: 'KZ', uz: 'UZ', zh: '中文', tr: 'TR' };
export function isLocale(x: string): x is Locale { return (locales as readonly string[]).includes(x); }
export function localizePath(path: string, locale: Locale): string {
  const parts = path.split('/');
  if (isLocale(parts[1] || '')) parts[1] = locale;
  else parts.splice(1, 0, locale);
  return parts.join('/') || `/${locale}/`;
}
export function format(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}
