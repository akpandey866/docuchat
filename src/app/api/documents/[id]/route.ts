import { sql } from "@/lib/db";
import { getWorkspaceId, isUuid } from "@/lib/workspace";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return Response.json({ error: "Invalid document id." }, { status: 400 });

  const workspaceId = await getWorkspaceId();

  // Scoped to the visitor's own workspace, so the shared sample can't be deleted
  const deleted = await sql`
    DELETE FROM documents WHERE id = ${id} AND workspace_id = ${workspaceId} RETURNING id`;

  if (deleted.length === 0) return Response.json({ error: "Document not found." }, { status: 404 });
  return new Response(null, { status: 204 });
}
