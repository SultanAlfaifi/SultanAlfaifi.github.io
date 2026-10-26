// Console lines mix English tags and names with Arabic. Each line takes the direction of the script most
// of it is written in, and a leading [tag] is isolated so it stays at the line's start instead of jumping.
const ARABIC_LETTERS = /\p{Script=Arabic}/gu;
const LATIN_LETTERS = /\p{Script=Latin}/gu;
export const LEADING_TAG = /^\[[a-z]+\]\s*/i;

export function textDir(text: string): "rtl" | "ltr" | "auto" {
  const arabic = text.match(ARABIC_LETTERS)?.length ?? 0;
  const latin = text.match(LATIN_LETTERS)?.length ?? 0;
  if (!arabic && !latin) return "auto";
  return arabic * 2 >= latin ? "rtl" : "ltr";
}
