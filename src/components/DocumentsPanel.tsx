"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DocumentInfo } from "@/lib/types";
import { CheckIcon, FileIcon, ShieldIcon, TrashIcon, UploadIcon } from "./icons";

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

const KIND_STYLE: Record<DocumentInfo["kind"], { label: string; className: string }> = {
  pdf: { label: "PDF", className: "from-rose-500/25 to-rose-500/5 text-rose-300 ring-rose-400/25" },
  markdown: { label: "MD", className: "from-sky-500/25 to-sky-500/5 text-sky-300 ring-sky-400/25" },
  text: { label: "TXT", className: "from-zinc-400/25 to-zinc-400/5 text-zinc-300 ring-zinc-400/25" },
};

const PIPELINE = ["Parse", "Chunk", "Embed", "Retrieve", "Cite"];

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

  const totalChunks = documents?.reduce((sum, d) => sum + d.chunks, 0) ?? 0;

  return (
    <div className="scroll-thin flex h-full flex-col gap-5 overflow-y-auto p-4 sm:p-5">
      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-orange-300/80">Workspace</p>
            <h2 className="mt-0.5 text-base font-semibold tracking-tight text-white">Knowledge base</h2>
          </div>
          {documents && documents.length > 0 && (
            <p className="text-right text-[11px] leading-tight text-zinc-500">
              <span className="font-mono text-zinc-200">{documents.length}</span>{" "}
              {documents.length === 1 ? "document" : "documents"}
              <br />
              <span className="font-mono text-zinc-200">{totalChunks}</span> vectors
            </p>
          )}
        </div>

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
          className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-dashed p-5 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400/60 ${
            dragging
              ? "border-orange-400 bg-orange-500/10"
              : "border-white/15 bg-white/[0.02] hover:border-orange-400/60 hover:bg-orange-500/[0.04]"
          }`}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-16 mx-auto h-28 w-40 rounded-full bg-orange-500/20 opacity-0 blur-3xl transition group-hover:opacity-100"
          />
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
            <div className="relative text-sm">
              <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-orange-500/20 border-t-orange-400" />
              <p className="truncate text-zinc-200">
                Indexing <span className="font-medium text-white">{uploading}</span>
              </p>
              <p className="text-shimmer mt-1 text-xs">Parsing · chunking · embedding…</p>
            </div>
          ) : (
            <div className="relative">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-b from-white/10 to-white/[0.02] text-orange-300 ring-1 ring-white/10 transition group-hover:-translate-y-0.5 group-hover:text-orange-200">
                <UploadIcon width={20} height={20} />
              </div>
              <p className="text-sm font-medium text-white">
                Drop a file or <span className="text-orange-300">browse</span>
              </p>
              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] font-medium text-zinc-400">
                {["PDF", "MD", "TXT"].map((t) => (
                  <span key={t} className="rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5">
                    {t}
                  </span>
                ))}
                <span className="ml-1 text-zinc-500">up to {maxFileMb} MB</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>
      )}

      <div className="min-h-0 flex-1">
        <h3 className="mb-2.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
          Documents
          {documents && documents.length > 0 && (
            <span className="flex items-center gap-1 normal-case tracking-normal text-emerald-400/90">
              <CheckIcon width={11} height={11} /> All indexed
            </span>
          )}
        </h3>
        {documents === null ? (
          <ul className="space-y-2">
            {[0, 1].map((i) => (
              <li key={i} className="h-[62px] animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.03]" />
            ))}
          </ul>
        ) : documents.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-6 text-center text-xs text-zinc-500">
            <FileIcon width={20} height={20} className="mx-auto mb-2 text-zinc-600" />
            No documents yet. Upload one to get started.
          </div>
        ) : (
          <ul className="space-y-2">
            {documents.map((d, i) => {
              const kind = KIND_STYLE[d.kind];
              return (
                <li
                  key={d.id}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="group animate-fade-up flex items-center gap-3 rounded-xl border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-3 transition hover:border-white/15 hover:from-white/[0.07]"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b text-[10px] font-bold ring-1 ${kind.className}`}
                  >
                    {kind.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-100" title={d.name}>
                      {d.name}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <span>
                        {d.sections} {d.kind === "pdf" ? "pages" : "sections"}
                      </span>
                      <span className="h-0.5 w-0.5 rounded-full bg-zinc-600" />
                      <span>{d.chunks} chunks</span>
                      {d.isSample && (
                        <span className="rounded border border-orange-400/30 bg-orange-500/10 px-1 text-[10px] font-medium text-orange-300">
                          Sample
                        </span>
                      )}
                    </p>
                  </div>
                  {d.isSample ? (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.45)]" title="Indexed" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => remove(d.id)}
                      className="rounded-md p-1.5 text-zinc-500 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 focus:opacity-100 group-hover:opacity-100"
                      aria-label={`Delete ${d.name}`}
                    >
                      <TrashIcon width={14} height={14} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 md:block">
        <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">RAG pipeline</p>
        <div className="flex items-center justify-between">
          {PIPELINE.map((step, i) => (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-orange-400/30 bg-orange-500/10 font-mono text-[10px] text-orange-300">
                  {i + 1}
                </span>
                <span className="text-[10px] text-zinc-400">{step}</span>
              </div>
              {i < PIPELINE.length - 1 && (
                <span className="mx-0.5 mb-5 h-px w-2.5 bg-orange-400/30" />
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="flex gap-2 text-[11px] leading-snug text-zinc-500">
        <ShieldIcon width={14} height={14} className="mt-px shrink-0 text-zinc-400" />
        <span>
          Private to this browser and auto-deleted after 24 hours. Please don&apos;t upload confidential files.
        </span>
      </p>
    </div>
  );
}
