import { embedQuery } from "./ai";
import { config } from "./config";
import { sql, toVector } from "./db";
import type { Source } from "./types";

/** Finds the chunks most relevant to `question` within the given workspaces. */
export async function retrieve(question: string, workspaceIds: string[]): Promise<Source[]> {
  const vector = toVector(await embedQuery(question));

  const rows = await sql<
    { document_id: string; name: string; location: string; content: string; distance: number }[]
  >`
    SELECT c.document_id, d.name, c.location, c.content,
           c.embedding <=> ${vector}::vector AS distance
    FROM chunks c
    JOIN documents d ON d.id = c.document_id
    WHERE c.workspace_id IN ${sql(workspaceIds)}
    ORDER BY c.embedding <=> ${vector}::vector
    LIMIT ${config.retrieval.topK}`;

  return rows
    .filter((r) => r.distance <= config.retrieval.maxDistance)
    .map((r, i) => ({
      n: i + 1,
      documentId: r.document_id,
      documentName: r.name,
      location: r.location,
      content: r.content,
      score: Number((1 - r.distance).toFixed(3)),
    }));
}
