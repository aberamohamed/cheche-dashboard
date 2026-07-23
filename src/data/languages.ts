export type LanguageId = 'en' | 'am' | 'om' | 'ti' | 'so';

export interface LanguageOption {
  id: LanguageId;
  /** Display name in the language itself. */
  label: string;
  /** Short code shown on the language trigger button. */
  code: string;
}

export const LANGUAGES: LanguageOption[] = [
  { id: 'en', label: 'English', code: 'EN' },
  { id: 'am', label: 'አማርኛ', code: 'አማ' },
  { id: 'om', label: 'Afaan Oromoo', code: 'ORO' },
  { id: 'ti', label: 'ትግርኛ', code: 'ትግ' },
  { id: 'so', label: 'Soomaali', code: 'SOM' },
];

export function getLanguageLabel(id: string): string {
  return LANGUAGES.find((l) => l.id === id)?.label ?? 'English';
}

export function getLanguageCode(id: string): string {
  return LANGUAGES.find((l) => l.id === id)?.code ?? 'EN';
}

export function resolveLanguageId(id: string): LanguageId {
  return LANGUAGES.some((l) => l.id === id) ? (id as LanguageId) : 'en';
}
