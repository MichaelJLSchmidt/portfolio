/**
 * Example values: invented figures, quotes, dates and lines in real content (the home page,
 * Basecamp) that show the intended storytelling until the real ones exist. Write each as
 * ex("…"). It renders as written, but `npm run check:content` lists it with its file, line and
 * field, a live build stops on it (like a [PLACEHOLDER]), and components can tell it apart
 * (isExample) to mark it, e.g. the "Example quote" tag on a field note.
 *
 * Not to be confused with flagged examples (src/content/examples): whole fictional case studies
 * that live builds leave out.
 */
const values = new Set<string>();

/** Marks an invented value; returns it unchanged. */
export function ex<T extends string>(value: T): T {
  values.add(value);
  return value;
}

/** Whether a value was written with ex(). */
export const isExample = (value: string | null | undefined): boolean => !!value && values.has(value);

/** Every example value registered so far (by the content modules imported). */
export const exampleValues = (): string[] => [...values];
