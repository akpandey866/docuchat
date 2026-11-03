import type { UIMessage } from "ai";

// Shared between server and browser — keep free of server-only imports.

export interface Source {
  /** 1-based number the model uses in citations, e.g. [1] */
  n: number;
  documentId: string;
  documentName: string;
  location: string;
  content: string;
  score: number;
}

export interface ChatMetadata {
  sources?: Source[];
}

export type ChatMessage = UIMessage<ChatMetadata>;

export interface DocumentInfo {
  id: string;
  name: string;
  kind: "pdf" | "markdown" | "text";
  sections: number;
  chunks: number;
  isSample: boolean;
  createdAt: string;
}
