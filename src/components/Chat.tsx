"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";
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

export default function Chat({ kb, suggestions = [], compact = false }: Props) {
  const [input, setInput] = useState("");
  const [active, setActive] = useState<{ messageId: string; n: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport<ChatMessage>({ api: "/api/chat", body: kb ? { kb } : undefined }),
    [kb],
  );
  const { messages, sendMessage, status, error, stop } = useChat<ChatMessage>({ transport });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  const ask = (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    setActive(null);
    sendMessage({ text: question });
    setInput("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`flex-1 space-y-6 overflow-y-auto ${compact ? "p-4" : "p-4 sm:p-6"}`}>
        {messages.length === 0 && (
          <div className="mx-auto max-w-xl pt-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-2xl text-white shadow-lg shadow-orange-500/30">
              ✦
            </div>
            <h2 className="text-lg font-semibold">Ask anything about your documents</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Answers come only from the uploaded files, with numbered citations you can click.
            </p>
            {suggestions.length > 0 && (
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm text-zinc-700 transition hover:border-orange-300 hover:bg-orange-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-orange-500/50 dark:hover:bg-zinc-800"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((m) => {
          const sources = m.metadata?.sources ?? [];
          const citable = new Set(sources.map((s) => s.n));
          const text = messageText(m);
          const activeSource =
            active?.messageId === m.id ? sources.find((s) => s.n === active.n) : undefined;
          const show = (n: number) => setActive({ messageId: m.id, n });

          if (m.role === "user") {
            return (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-zinc-900 px-4 py-2.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
                  {text}
                </div>
              </div>
            );
          }

          return (
            <div key={m.id} className="flex gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-sm text-white">
                ✦
              </div>
              <div className="min-w-0 flex-1 text-sm">
                {text ? (
                  <MessageText
                    text={text}
                    citable={citable}
                    onCite={show}
                  />
                ) : (
                  <span className="text-zinc-400">Thinking…</span>
                )}

                {sources.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {sources.map((s) => (
                      <button
                        key={s.n}
                        type="button"
                        onClick={() => show(s.n)}
                        className={`rounded-lg border px-2 py-1 text-left text-xs transition ${
                          activeSource?.n === s.n
                            ? "border-orange-400 bg-orange-50 dark:bg-orange-500/10"
                            : "border-zinc-200 hover:border-orange-300 dark:border-zinc-800"
                        }`}
                      >
                        <span className="font-semibold text-orange-600">[{s.n}]</span>{" "}
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {s.documentName.length > 28 ? `${s.documentName.slice(0, 28)}…` : s.documentName} ·{" "}
                          {s.location}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {activeSource && (
                  <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50/60 p-3 text-xs dark:border-orange-500/30 dark:bg-orange-500/5">
                    <div className="mb-1 flex items-center justify-between gap-2 font-semibold">
                      <span>
                        [{activeSource.n}] {activeSource.documentName} — {activeSource.location}
                      </span>
                      <span className="shrink-0 font-normal text-zinc-500">
                        match {Math.round(activeSource.score * 100)}%
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{activeSource.content}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {status === "submitted" && (
          <div className="flex items-center gap-2 pl-10 text-sm text-zinc-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" /> Searching your documents…
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
        className="border-t border-zinc-200 p-3 dark:border-zinc-800"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-zinc-300 bg-white p-2 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-400/20 dark:border-zinc-700 dark:bg-zinc-900">
          <textarea
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
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-zinc-400"
          />
          {busy ? (
            <button
              type="button"
              onClick={stop}
              className="rounded-xl bg-zinc-200 px-3 py-2 text-sm font-medium dark:bg-zinc-800"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40"
            >
              Ask
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
