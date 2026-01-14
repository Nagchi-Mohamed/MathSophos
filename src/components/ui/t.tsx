"use client";

import { useLanguage } from "@/contexts/language-context";
import { dictionary } from "@/lib/i18n";

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
  ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
  : `${Key}`;
}[keyof ObjectType & (string | number)];

type HelperType = typeof dictionary.fr;
type DictionaryKeys = NestedKeyOf<HelperType>;

interface TProps {
  k: DictionaryKeys;
  fallback?: string;
  className?: string;
}

export function T({ k, fallback, className }: TProps) {
  const { t } = useLanguage();

  // Resolve value from nested key (e.g. "nav.home")
  const value = k.split('.').reduce((obj: any, key) => obj?.[key], t);

  return (
    <span className={className}>
      {value || fallback || k}
    </span>
  );
}
