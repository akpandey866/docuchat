import { cookies, headers } from "next/headers";
import { config, DEMO_WORKSPACE_ID } from "./config";
import { ensureSchema, sql } from "./db";
import { ensureSampleDocument } from "./sample";

const COOKIE = "docuchat_ws";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID.test(value);

/**
 * Every visitor gets a private, temporary workspace tied to a cookie.
 * Returns its id, creating it (and the shared sample document) if needed.
 */
export async function getWorkspaceId(): Promise<string> {
  await ensureSchema();
  await ensureSampleDocument();

  const store = await cookies();
  const existing = store.get(COOKIE)?.value;

  if (isUuid(existing)) {
    const [row] = await sql`SELECT id FROM workspaces WHERE id = ${existing}`;
    if (row) return existing;
  }

  const id = crypto.randomUUID();
  await sql`INSERT INTO workspaces (id) VALUES (${id})`;
  store.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: config.limits.workspaceTtlHours * 3600,
    path: "/",
  });
  return id;
}

/** Workspaces a visitor can search: their own plus the shared sample. */
export const searchableWorkspaces = (workspaceId: string) =>
  workspaceId === DEMO_WORKSPACE_ID ? [DEMO_WORKSPACE_ID] : [workspaceId, DEMO_WORKSPACE_ID];

/** Deletes expired visitor workspaces; documents and chunks cascade. */
export async function cleanupExpiredWorkspaces() {
  await sql`
    DELETE FROM workspaces
    WHERE id <> ${DEMO_WORKSPACE_ID}
      AND created_at < now() - make_interval(hours => ${config.limits.workspaceTtlHours})`;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}
