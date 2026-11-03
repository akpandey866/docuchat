"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DocumentInfo } from "@/lib/types";

interface DocumentsResponse {
  documents: DocumentInfo[];
  limits: { maxFileMb: number };
}

async function fetchDocuments(): Promise<DocumentsResponse | null> {
  try {
    const res = await fetch("/api/documents", { cache: "no-store" });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

const KIND_ICON: Record<DocumentInfo["kind"], string> = { pdf: "PDF", markdown: "MD", text: "TXT" };

export default function DocumentsPanel() {
  const [documents, setDocuments] = useState<DocumentInfo[] | null>(null);
  const [maxFileMb, setMaxFileMb] = useState(4);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const apply = useCallback((data: DocumentsResponse | null) => {
    if (!data) {
      setError("Couldn't load documents. Check the server configuration.");
      setDocuments([]);
      return;
    }
    setDocuments(data.documents);
    setMaxFileMb(data.limits.maxFileMb);
  }, []);

  const load = useCallback(async () => apply(await fetchDocuments()), [apply]);

  useEffect(() => {
    let cancelled = false;
    fetchDocuments().then((data) => {
      if (!cancelled) apply(data);
    });
    return () => {
      cancelled = true;
    };
  }, [apply]);

  const upload = async (file: File) => {
    setError(null);
    if (file.size > maxFileMb * 1024 * 1024) {
      setError(`Files must be under ${maxFileMb} MB.`);
      return;
    }
    setUploading(file.name);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/documents", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  };

  const remove = async (id: string) => {
    setDocuments((docs) => docs?.filter((d) => d.id !== id) ?? null);
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) upload(file);
        }}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition ${
          dragging
            ? "border-orange-400 bg-orange-50 dark:bg-orange-500/10"
            : "border-zinc-300 hover:border-orange-300 dark:border-zinc-700"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.md,.markdown,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
        {uploading ? (
          <div className="text-sm">
            <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            Reading <span className="font-medium">{uploading}</span>…
            <p className="mt-1 text-xs text-zinc-500">Parsing, chunking and embedding</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium">Drop a file or click to upload</p>
            <p className="mt-1 text-xs text-zinc-500">PDF, Markdown or TXT · up to {maxFileMb} MB</p>
          </>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Documents</h3>
        {documents === null ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : (
          <ul className="space-y-2">
            {documents.map((d) => (
              <li
                key={d.id}
                className="group flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="mt-0.5 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {KIND_ICON[d.kind]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={d.name}>
                    {d.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {d.sections} {d.kind === "pdf" ? "pages" : "sections"} · {d.chunks} chunks
                    {d.isSample && <span className="ml-1 text-orange-600">· sample</span>}
                  </p>
                </div>
                {!d.isSample && (
                  <button
                    type="button"
                    onClick={() => remove(d.id)}
                    className="text-xs text-zinc-400 opacity-0 transition hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Delete ${d.name}`}
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-[11px] leading-snug text-zinc-400">
        Demo: your uploads are private to this browser and auto-deleted after 24 hours. Please don&apos;t upload
        confidential files.
      </p>
    </div>
  );
}
