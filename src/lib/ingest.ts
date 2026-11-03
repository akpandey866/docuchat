import { extractText, getDocumentProxy } from "unpdf";
import { embedDocuments } from "./ai";
import { chunkSections, markdownSections, type Section } from "./chunk";
import { config } from "./config";
import { sql, toVector } from "./db";

export class IngestError extends Error {}

export type DocKind = "pdf" | "markdown" | "text";

export function detectKind(fileName: string): DocKind | null {
  const ext = fileName.toLowerCase().split(".").pop();
  if (ext === "pdf") return "pdf";
  if (ext === "md" || ext === "markdown") return "markdown";
  if (ext === "txt") return "text";
  return null;
}

async function pdfSections(bytes: Uint8Array): Promise<Section[]> {
  const pdf = await getDocumentProxy(bytes);
  if (pdf.numPages > config.limits.maxPdfPages) {
    throw new IngestError(`PDF has ${pdf.numPages} pages — the limit is ${config.limits.maxPdfPages}.`);
  }
  const { text } = await extractText(pdf, { mergePages: false });
  return text
    .map((pageText, i) => ({ location: `Page ${i + 1}`, text: pageText }))
    .filter((s) => s.text.trim().length > 0);
}

export async function parseFile(bytes: Uint8Array, kind: DocKind): Promise<Section[]> {
  if (kind === "pdf") return pdfSections(bytes);
  const text = new TextDecoder().decode(bytes);
  return kind === "markdown" ? markdownSections(text) : [{ location: "Text", text }];
}

/** Parses, chunks, embeds and stores a document. Returns the new document id. */
export async function ingestDocument(opts: {
  workspaceId: string;
  name: string;
  kind: DocKind;
  bytes: Uint8Array;
}): Promise<{ id: string; chunks: number; sections: number }> {
  const sections = await parseFile(opts.bytes, opts.kind);
  const chunks = chunkSections(sections);

  if (chunks.length === 0) {
    throw new IngestError(
      opts.kind === "pdf"
        ? "No text found in this PDF. Scanned/image-only PDFs need OCR, which this demo doesn't include."
        : "The file is empty.",
    );
  }

  const embeddings = await embedDocuments(chunks.map((c) => c.content));

  return sql.begin(async (tx) => {
    const [doc] = await tx<{ id: string }[]>`
      INSERT INTO documents (workspace_id, name, kind, sections, chunks)
      VALUES (${opts.workspaceId}, ${opts.name}, ${opts.kind}, ${sections.length}, ${chunks.length})
      RETURNING id`;

    const rows = chunks.map((c, i) => ({
      document_id: doc.id,
      workspace_id: opts.workspaceId,
      location: c.location,
      content: c.content,
      embedding: toVector(embeddings[i]),
    }));

    // Insert in batches to stay well under Postgres' parameter limit
    for (let i = 0; i < rows.length; i += 200) {
      await tx`INSERT INTO chunks ${tx(rows.slice(i, i + 200))}`;
    }

    return { id: doc.id, chunks: chunks.length, sections: sections.length };
  });
}
