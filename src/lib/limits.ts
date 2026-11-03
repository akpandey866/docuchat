import { config } from "./config";
import { sql } from "./db";

export type UsageKind = "uploads" | "questions";

const LIMITS: Record<UsageKind, number> = {
  uploads: config.limits.uploadsPerIpPerDay,
  questions: config.limits.questionsPerIpPerDay,
};

/**
 * Atomically counts one use for this IP today. Returns false (and counts
 * nothing extra) once the daily limit is reached — this is what keeps the
 * public demo's Gemini bill bounded.
 */
export async function consume(ip: string, kind: UsageKind): Promise<boolean> {
  const column = sql(kind);
  const [row] = await sql<{ count: number }[]>`
    INSERT INTO usage (ip, ${column}) VALUES (${ip}, 1)
    ON CONFLICT (ip, day) DO UPDATE
      SET ${column} = usage.${column} + 1
      WHERE usage.${column} < ${LIMITS[kind]}
    RETURNING ${column} AS count`;
  return Boolean(row);
}
