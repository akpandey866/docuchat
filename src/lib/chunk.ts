import { config } from "./config";

export interface Section {
  /** Human-readable location used in citations, e.g. "Page 3" or "Remote Work" */
  location: string;
  text: string;
}

export interface Chunk {
  location: string;
  content: string;
}

const normalize = (text: string) =>
  text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/**
 * Splits text into ~`size` character chunks, preferring paragraph and
 * sentence boundaries, with `overlap` characters carried between chunks so
 * an answer that straddles a boundary is still retrievable.
 */
export function splitText(
  text: string,
  size = config.chunking.size,
  overlap = config.chunking.overlap,
): string[] {
  const clean = normalize(text);
  if (clean.length <= size) return clean ? [clean] : [];

  const chunks: string[] = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);

    if (end < clean.length) {
      const window = clean.slice(start, end);
      // Best break point in the second half of the window
      const breaks = [window.lastIndexOf("\n\n"), window.lastIndexOf(". "), window.lastIndexOf("\n")];
      const best = breaks.find((i) => i > size / 2);
      if (best !== undefined) end = start + best + 1;
    }

    const piece = clean.slice(start, end).trim();
    if (piece) chunks.push(piece);
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

export function chunkSections(sections: Section[]): Chunk[] {
  return sections.flatMap((section) =>
    splitText(section.text).map((content) => ({ location: section.location, content })),
  );
}

/** Splits Markdown on headings so citations point at a named section. */
export function markdownSections(markdown: string): Section[] {
  const sections: Section[] = [];
  let heading = "Introduction";
  let buffer: string[] = [];

  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text) sections.push({ location: heading, text });
    buffer = [];
  };

  for (const line of markdown.split(/\r?\n/)) {
    const match = /^#{1,3}\s+(.+)$/.exec(line);
    if (match) {
      flush();
      heading = match[1].trim();
    } else {
      buffer.push(line);
    }
  }
  flush();
  return sections;
}
