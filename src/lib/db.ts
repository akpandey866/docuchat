import postgres from "postgres";
import { config } from "./config";

declare global {
  var __docuchatSql: postgres.Sql | undefined;
  var __docuchatSchema: Promise<void> | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return postgres(url, {
    max: 5,
    // Neon and most hosted Postgres require TLS; local Docker does not
    ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : "require",
  });
}

// Reuse one pool across hot reloads / warm serverless invocations
const client = () => (globalThis.__docuchatSql ??= createClient());

/**
 * Lazily-connected client: importing this module (e.g. during `next build`
 * or in CI) doesn't require DATABASE_URL — only running a query does.
 */
export const sql = new Proxy(function () {} as unknown as postgres.Sql, {
  apply: (_target, _this, args: Parameters<postgres.Sql>) => client()(...args),
  get: (_target, prop) => Reflect.get(client(), prop),
});

/**
 * Creates tables on first use, so a fresh deployment only needs a
 * DATABASE_URL — no separate migration step.
 */
export function ensureSchema() {
  globalThis.__docuchatSchema ??= (async () => {
    await sql`CREATE EXTENSION IF NOT EXISTS vector`;
    await sql`
      CREATE TABLE IF NOT EXISTS workspaces (
        id uuid PRIMARY KEY,
        created_at timestamptz NOT NULL DEFAULT now()
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS documents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        name text NOT NULL,
        kind text NOT NULL,
        sections int NOT NULL DEFAULT 0,
        chunks int NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      )`;
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS chunks (
        id bigserial PRIMARY KEY,
        document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        location text NOT NULL,
        content text NOT NULL,
        embedding vector(${config.embeddingDimensions}) NOT NULL
      )`);
    await sql`CREATE INDEX IF NOT EXISTS chunks_workspace_idx ON chunks (workspace_id)`;
    await sql`
      CREATE INDEX IF NOT EXISTS chunks_embedding_idx
      ON chunks USING hnsw (embedding vector_cosine_ops)`;
    await sql`
      CREATE TABLE IF NOT EXISTS usage (
        ip text NOT NULL,
        day date NOT NULL DEFAULT current_date,
        uploads int NOT NULL DEFAULT 0,
        questions int NOT NULL DEFAULT 0,
        PRIMARY KEY (ip, day)
      )`;
  })().catch((err) => {
    globalThis.__docuchatSchema = undefined; // retry on next request
    throw err;
  });
  return globalThis.__docuchatSchema;
}

/** pgvector literal, e.g. "[0.1,0.2,...]" */
export const toVector = (embedding: number[]) => `[${embedding.join(",")}]`;
