import { config, DEMO_WORKSPACE_ID } from "@/lib/config";
import { sql } from "@/lib/db";
import { detectKind, ingestDocument, IngestError } from "@/lib/ingest";
import { consume } from "@/lib/limits";
import type { DocumentInfo } from "@/lib/types";
import {
  cleanupExpiredWorkspaces,
  clientIp,
  getWorkspaceId,
  searchableWorkspaces,
} from "@/lib/workspace";

export const maxDuration = 60;

export async function GET() {
  const workspaceId = await getWorkspaceId();

  const rows = await sql<
    { id: string; name: string; kind: DocumentInfo["kind"]; sections: number; chunks: number; workspace_id: string; created_at: Date }[]
  >`
    SELECT id, name, kind, sections, chunks, workspace_id, created_at
    FROM documents
    WHERE workspace_id IN ${sql(searchableWorkspaces(workspaceId))}
    ORDER BY (workspace_id = ${DEMO_WORKSPACE_ID}) DESC, created_at DESC`;

  const documents: DocumentInfo[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    kind: r.kind,
    sections: r.sections,
    chunks: r.chunks,
    isSample: r.workspace_id === DEMO_WORKSPACE_ID,
    createdAt: r.created_at.toISOString(),
  }));

  return Response.json({ workspaceId, documents, limits: config.limits });
}

export async function POST(req: Request) {
  const workspaceId = await getWorkspaceId();
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "No file uploaded." }, { status: 400 });
  }

  const kind = detectKind(file.name);
  if (!kind) {
    return Response.json({ error: "Only PDF, Markdown (.md) and text (.txt) files are supported." }, { status: 400 });
  }
  if (file.size > config.limits.maxFileMb * 1024 * 1024) {
    return Response.json({ error: `Files must be under ${config.limits.maxFileMb} MB.` }, { status: 413 });
  }

  const [{ count }] = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count FROM documents WHERE workspace_id = ${workspaceId}`;
  if (count >= config.limits.maxDocsPerWorkspace) {
    return Response.json(
      { error: `This demo allows ${config.limits.maxDocsPerWorkspace} documents. Delete one to upload another.` },
      { status: 400 },
    );
  }

  if (!(await consume(await clientIp(), "uploads"))) {
    return Response.json({ error: "Daily upload limit reached for this demo. Please try again tomorrow." }, { status: 429 });
  }

  // Opportunistic cleanup keeps the demo database small without a cron job
  cleanupExpiredWorkspaces().catch(() => {});

  try {
    const doc = await ingestDocument({
      workspaceId,
      name: file.name.slice(0, 200),
      kind,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
    return Response.json({ document: doc }, { status: 201 });
  } catch (err) {
    if (err instanceof IngestError) {
      return Response.json({ error: err.message }, { status: 422 });
    }
    console.error("Ingest failed", err);
    return Response.json({ error: "Could not process this file. Please try another one." }, { status: 500 });
  }
}
