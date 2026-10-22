/** A field counts once it has a value. Placeholders such as "[#]" count too: they stay
 *  visible in preview builds, and npm run check:content stops production builds on them. */
export const hasValue = (value: string | null | undefined): value is string => !!value?.trim();

export const withValues = <T extends { value?: string | null }>(items: readonly T[] | undefined): (T & { value: string })[] =>
  (items ?? []).filter((item): item is T & { value: string } => hasValue(item.value));
