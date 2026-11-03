import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed, embedMany } from "ai";
import { config } from "./config";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const chatModel = google(config.chatModel);
const embeddingModel = google.embedding(config.embeddingModel);

const providerOptions = (taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY") => ({
  google: { outputDimensionality: config.embeddingDimensions, taskType },
});

/**
 * Gemini returns unit-length vectors only at full size; truncated
 * (768-dim) vectors must be re-normalised for cosine distance to be accurate.
 */
const normalize = (v: number[]) => {
  const norm = Math.hypot(...v) || 1;
  return v.map((x) => x / norm);
};

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
    providerOptions: providerOptions("RETRIEVAL_DOCUMENT"),
  });
  return embeddings.map(normalize);
}

export async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
    providerOptions: providerOptions("RETRIEVAL_QUERY"),
  });
  return normalize(embedding);
}
