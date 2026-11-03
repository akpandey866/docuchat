"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { ArrowRightIcon, LayersIcon, QuoteIcon, SearchIcon, SendIcon, SparkleIcon, StopIcon } from "./icons";
import MessageText from "./MessageText";

interface Props {
  /** Fixed knowledge base id (used by the embeddable widget) */
  kb?: string;
  suggestions?: string[];
  compact?: boolean;
}

const errorText = (error: Error) => {
  try {
    return JSON.parse(error.message).error ?? error.message;
  } catch {
    return error.message || "Something went wrong. Please try again.";
  }
};

const messageText = (m: ChatMessage) =>
  m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

const FEATURES = [
  { icon: LayersIcon, label: "Grounded in your files" },
  { icon: QuoteIcon, label: "Clickable citations" },
  { icon: SearchIcon, label: "Semantic search" },
];

function Avatar({ size = "md" }: { size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-7 w-7 rounded-lg" : "h-8 w-8 rounded-xl";
  return (
    <div
      className={`${dims} flex shrink-0 items-center justify-center bg-gradient-to-br from-orange-400 via-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/25 ring-1 ring-white/20`}
    >
      <SparkleIcon width={size === "sm" ? 14 : 16} height={size === "sm" ? 14 : 16} />
    </div>
  );
}

export default function Chat({ kb, suggestions = [], compact = false }: Props) {
  const [input, setInput] = useState("");
  const [active, setActive] = useState<{ messageId: string; n: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport<ChatMessage>({ api: "/api/chat", body: kb ? { kb } : undefined }),
    [kb],
  );
  const { messages, sendMessage, status, error, stop } = useChat<ChatMessage>({ transport });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  // Grow the textarea with its content
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const ask = (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    setActive(null);
    sendMessage({ text: question });
    setInput("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`scroll-thin flex-1 space-y-7 overflow-y-auto ${compact ? "p-4" : "px-4 py-6 sm:px-6 sm:py-8"}`}>
        {messages.length === 0 &&
          (compact ? (
            <div className="mx-auto max-w-xl pt-4 text-center">
              <div className="mx-auto mb-3 w-fit">
                <Avatar />
              </div>
              <h2 className="text-base font-semibold">How can I help?</h2>
              <p className="mt-1 text-xs text-zinc-500">Answers come from our documentation, with sources.</p>
              {suggestions.length > 0 && (
                <div className="mt-4 grid gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => ask(s)}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left text-sm text-zinc-700 transition hover:border-orange-300 hover:bg-orange-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-orange-400/40 dark:hover:bg-orange-500/[0.06]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mx-auto flex max-w-2xl flex-col items-center pt-4 text-center sm:pt-10">
              {/* Glowing orb */}
              <div className="relative mb-7 animate-float">
                <div className="absolute inset-0 -m-6 rounded-full bg-orange-500/25 blur-2xl" />
                <div className="absolute -inset-3 rounded-[24px] border border-orange-400/20" />
                <div className="absolute -inset-6 rounded-[30px] border border-orange-400/[0.08]" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-rose-500 text-white shadow-2xl shadow-orange-500/40 ring-1 ring-white/30">
                  <SparkleIcon width={30} height={30} />
                </div>
              </div>

              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[11px] font-medium text-orange-700 dark:border-orange-400/20 dark:bg-orange-500/[0.08] dark:text-orange-200">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 dark:bg-orange-400" />
                Retrieval-augmented AI assistant
              </span>

              <h2 className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-600 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-[40px] sm:leading-[1.1] dark:from-white dark:via-orange-50 dark:to-orange-300">
                Ask anything about
                <br />
                your documents
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                Answers come only from the files you upload, with numbered citations that point to the exact
                passage.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {FEATURES.map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-300"
                  >
                    <Icon width={13} height={13} className="text-orange-500 dark:text-orange-300" />
                    {label}
                  </span>
                ))}
              </div>

              {suggestions.length > 0 && (
                <div className="mt-10 w-full">
                  <p className="mb-3 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                    Try asking
                  </p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => ask(s)}
                        style={{ animationDelay: `${120 + i * 70}ms` }}
                        className="group animate-fade-up relative flex items-start gap-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 text-left text-sm text-zinc-700 transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/10 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-200 dark:hover:border-orange-400/40 dark:hover:bg-orange-500/[0.05]"
                      >
                        <span className="mt-px font-mono text-[11px] text-orange-500/80 dark:text-orange-300/70">
                          0{i + 1}
                        </span>
                        <span className="flex-1 leading-snug">{s}</span>
                        <ArrowRightIcon
                          width={15}
                          height={15}
                          className="mt-0.5 shrink-0 -translate-x-1 text-zinc-400 opacity-0 transition group-hover:translate-x-0 group-hover:text-orange-400 group-hover:opacity-100"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

        {messages.map((m) => {
          const sources = m.metadata?.sources ?? [];
          const citable = new Set(sources.map((s) => s.n));
          const text = messageText(m);
          const activeSource =
            active?.messageId === m.id ? sources.find((s) => s.n === active.n) : undefined;
          const show = (n: number) => setActive({ messageId: m.id, n });

          if (m.role === "user") {
            return (
              <div key={m.id} className="animate-fade-up flex justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-gradient-to-br from-zinc-800 to-zinc-900 px-4 py-2.5 text-sm text-white shadow-sm ring-1 ring-black/5 dark:from-white/[0.12] dark:to-white/[0.06] dark:ring-white/10">
                  {text}
                </div>
              </div>
            );
          }

          return (
            <div key={m.id} className="animate-fade-up flex gap-3">
              <Avatar size="sm" />
              <div className="min-w-0 flex-1 pt-0.5 text-sm text-zinc-800 dark:text-zinc-200">
                {text ? (
                  <MessageText text={text} citable={citable} onCite={show} />
                ) : (
                  <span className="text-shimmer font-medium">Thinking…</span>
                )}

                {sources.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                      <QuoteIcon width={12} height={12} /> Sources
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {sources.map((s) => (
                        <button
                          key={s.n}
                          type="button"
                          onClick={() => show(s.n)}
                          className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition ${
                            activeSource?.n === s.n
                              ? "border-orange-400 bg-orange-50 dark:border-orange-400/60 dark:bg-orange-500/10"
                              : "border-zinc-200 bg-white hover:border-orange-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-orange-400/40"
                          }`}
                        >
                          <span className="flex h-4 min-w-4 items-center justify-center rounded bg-orange-100 px-1 text-[10px] font-semibold text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
                            {s.n}
                          </span>
                          <span className="text-zinc-600 dark:text-zinc-400">
                            {s.documentName.length > 28 ? `${s.documentName.slice(0, 28)}…` : s.documentName}
                            <span className="text-zinc-400 dark:text-zinc-600"> · </span>
                            {s.location}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeSource && (
                  <div className="animate-fade-up mt-3 overflow-hidden rounded-xl border border-orange-200 bg-orange-50/60 text-xs dark:border-orange-400/25 dark:bg-orange-500/[0.06]">
                    <div className="flex items-center justify-between gap-2 border-b border-orange-200/70 px-3 py-2 font-semibold dark:border-orange-400/15">
                      <span className="truncate">
                        <span className="text-orange-600 dark:text-orange-300">[{activeSource.n}]</span>{" "}
                        {activeSource.documentName} — {activeSource.location}
                      </span>
                      <span className="flex shrink-0 items-center gap-2 font-normal text-zinc-500">
                        <span className="hidden h-1 w-14 overflow-hidden rounded-full bg-zinc-200 sm:block dark:bg-white/10">
                          <span
                            className="block h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-400"
                            style={{ width: `${Math.round(activeSource.score * 100)}%` }}
                          />
                        </span>
                        {Math.round(activeSource.score * 100)}% match
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap p-3 leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {activeSource.content}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {status === "submitted" && (
          <div className="animate-fade-up flex items-center gap-3">
            <Avatar size="sm" />
            <div className="flex items-center gap-2 text-sm">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-400"
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </span>
              <span className="text-shimmer font-medium">Searching your documents…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {errorText(error)}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className={compact ? "border-t border-zinc-200 p-3 dark:border-white/10" : "px-4 pb-4 pt-2 sm:px-6 sm:pb-6"}
      >
        <div className="group relative rounded-2xl bg-gradient-to-r from-zinc-200 via-zinc-200 to-zinc-200 p-px transition focus-within:from-orange-400 focus-within:via-rose-400 focus-within:to-amber-300 dark:from-white/10 dark:via-white/10 dark:to-white/10 dark:focus-within:from-orange-500/80 dark:focus-within:via-rose-500/60 dark:focus-within:to-amber-400/70">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-orange-500/20 opacity-0 blur-xl transition group-focus-within:opacity-100"
          />
          <div className="flex items-end gap-2 rounded-[15px] bg-white p-2 dark:bg-[#0e0e13]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              rows={1}
              maxLength={1000}
              placeholder="Ask a question about your documents…"
              className="max-h-40 flex-1 resize-none bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
            {busy ? (
              <button
                type="button"
                onClick={stop}
                aria-label="Stop generating"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-200 text-zinc-700 transition hover:bg-zinc-300 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
              >
                <StopIcon width={14} height={14} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Ask"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-lg shadow-orange-500/30 transition hover:brightness-110 disabled:from-zinc-300 disabled:to-zinc-300 disabled:shadow-none dark:disabled:from-white/10 dark:disabled:to-white/10 dark:disabled:text-zinc-500"
              >
                <SendIcon width={16} height={16} />
              </button>
            )}
          </div>
        </div>
        {!compact && (
          <p className="mt-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
            <span>
              <kbd className="rounded border border-zinc-300 px-1 font-sans dark:border-white/10">Enter</kbd> to send
            </span>
            <span>
              <kbd className="rounded border border-zinc-300 px-1 font-sans dark:border-white/10">Shift + Enter</kbd> new
              line
            </span>
            <span className="hidden sm:inline">Answers are generated from your documents only</span>
          </p>
        )}
      </form>
    </div>
  );
}
