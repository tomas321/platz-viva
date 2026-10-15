import type { ImageMetadata } from "astro";

const files = import.meta.glob<ImageMetadata>("../assets/img/*.{jpg,png}", { eager: true, import: "default" });

export function image(name: string): ImageMetadata {
  const entry = Object.entries(files).find(([path]) => path.replace(/^.*\/(.+)\.\w+$/, "$1") === name);
  if (!entry) throw new Error(`Missing image src/assets/img/${name}.jpg`);
  return entry[1];
}
