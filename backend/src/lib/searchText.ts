const WORD_RE = /[a-z0-9]+/g;

function normalize(value: string): string {
  return value.toLowerCase();
}

export function tokenize(value: string): string[] {
  if (!value) return [];
  return normalize(value).match(WORD_RE) ?? [];
}
