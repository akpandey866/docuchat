/**
 * Central configuration. Everything a client deployment might want to tune
 * lives here and can be overridden with environment variables.
 */
const num = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const config = {
  chatModel: process.env.GEMINI_CHAT_MODEL || "gemini-flash-latest",
  embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
  // Must match the vector(...) size in the database schema
  embeddingDimensions: 768,

  retrieval: {
    topK: num(process.env.RETRIEVAL_TOP_K, 6),
    // Chunks less similar than this (cosine distance) are ignored
    maxDistance: 0.6,
  },

  chunking: {
    size: 1000,
    overlap: 150,
  },

  limits: {
    maxFileMb: num(process.env.MAX_FILE_MB, 4),
    maxPdfPages: num(process.env.MAX_PDF_PAGES, 60),
    maxDocsPerWorkspace: num(process.env.MAX_DOCS_PER_WORKSPACE, 5),
    uploadsPerIpPerDay: num(process.env.UPLOADS_PER_IP_PER_DAY, 10),
    questionsPerIpPerDay: num(process.env.QUESTIONS_PER_IP_PER_DAY, 40),
    // Visitor workspaces (and their documents) are deleted after this
    workspaceTtlHours: num(process.env.WORKSPACE_TTL_HOURS, 24),
  },
} as const;

// Shared, read-only workspace holding the sample document every visitor can try
export const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";
