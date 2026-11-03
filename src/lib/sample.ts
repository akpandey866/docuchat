import { SAMPLE_DOC_NAME, SAMPLE_HANDBOOK } from "@/data/sampleHandbook";
import { DEMO_WORKSPACE_ID } from "./config";
import { sql } from "./db";
import { ingestDocument } from "./ingest";

declare global {
  var __docuchatSample: Promise<void> | undefined;
}

/** Ingests the shared sample document once per database. */
export function ensureSampleDocument() {
  globalThis.__docuchatSample ??= (async () => {
    await sql`INSERT INTO workspaces (id) VALUES (${DEMO_WORKSPACE_ID}) ON CONFLICT DO NOTHING`;
    const [existing] = await sql`SELECT id FROM documents WHERE workspace_id = ${DEMO_WORKSPACE_ID} LIMIT 1`;
    if (existing) return;

    await ingestDocument({
      workspaceId: DEMO_WORKSPACE_ID,
      name: SAMPLE_DOC_NAME,
      kind: "markdown",
      bytes: new TextEncoder().encode(SAMPLE_HANDBOOK),
    });
  })().catch((err) => {
    globalThis.__docuchatSample = undefined;
    throw err;
  });
  return globalThis.__docuchatSample;
}
