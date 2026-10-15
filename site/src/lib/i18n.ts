import story from "../data/story.json";

export type Dict = typeof import("../i18n/en.json");
export type Story = typeof story;
export type SectionDef = Story["sections"][number] & {
  style?: string;
  images?: { src: string; caption: boolean }[];
  timeline?: [number, string][];
  illustration?: string;
  beforeAfter?: { before: string; after: string; caption: boolean };
  quiz?: boolean;
  list?: boolean;
  diagram?: boolean;
  box?: boolean;
};

// Every src/i18n/<code>.json is a language. Adding a file is all it takes to add one.
const files = import.meta.glob<Dict>("../i18n/*.json", { eager: true, import: "default" });

export const languages = Object.entries(files)
  .map(([path, dict]) => ({ code: path.replace(/^.*\/(.+)\.json$/, "$1"), dict }))
  // English first, then alphabetical by code.
  .sort((a, b) => (a.code === "en" ? -1 : b.code === "en" ? 1 : a.code.localeCompare(b.code)));

export const defaultLang = "en";

export function dictFor(code: string): Dict {
  const lang = languages.find((l) => l.code === code);
  if (!lang) throw new Error(`Unknown language ${code}`);
  return lang.dict;
}

export const sections = story.sections as SectionDef[];

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escape HTML, then turn **bold** into <strong>. Translations can't inject any other markup. */
export function inline(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ESCAPES[c]!).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
