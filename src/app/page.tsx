import { Suspense } from "react";
import Chat from "@/components/Chat";
import DocumentsPanel from "@/components/DocumentsPanel";
import { ArrowRightIcon, GithubIcon, SparkleIcon } from "@/components/icons";
import { SAMPLE_QUESTIONS } from "@/data/sampleHandbook";
import { config } from "@/lib/config";

const REPO_URL = process.env.NEXT_PUBLIC_REPO_URL || "https://github.com/";

/** "gemini-3.5-flash" -> "Gemini 3.5 Flash" */
const prettyModel = (id: string) =>
  id
    .split("-")
    .map((w) => (/^\d/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");

export default function Home() {
  return (
    <div className="dark relative isolate flex h-dvh flex-col overflow-hidden bg-[#07070b] text-zinc-100">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0" />
        <div className="absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/3 rounded-full bg-orange-500/[0.13] blur-[120px]" />
        <div className="absolute -bottom-48 -left-24 h-[420px] w-[520px] rounded-full bg-fuchsia-600/[0.08] blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[380px] w-[420px] rounded-full bg-amber-400/[0.06] blur-[110px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between gap-4 border-b border-white/[0.06] bg-black/30 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30 ring-1 ring-white/20">
            <SparkleIcon width={18} height={18} />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <h1 className="text-[15px] font-semibold tracking-tight">DocuChat</h1>
              <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-2 py-px text-[10px] font-medium tracking-wide text-orange-300">
                AI
              </span>
            </div>
            <p className="hidden text-xs text-zinc-500 sm:block">Chat with your documents. Every answer is cited.</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <span className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-zinc-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Online
          </span>
          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
            Model <span className="text-zinc-200">{prettyModel(config.chatModel)}</span>
          </span>
          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
            Retrieval <span className="text-zinc-200">Top-{config.retrieval.topK} semantic</span>
          </span>
        </div>

        <nav className="flex items-center gap-2 text-xs sm:gap-3">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            <GithubIcon width={15} height={15} />
            <span className="hidden sm:inline">Source</span>
          </a>
          <a
            href="https://techgenisys.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-medium text-zinc-900 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_24px_-8px_rgba(249,115,22,0.6)] transition hover:bg-orange-50"
          >
            Built by TechGenisys
            <ArrowRightIcon width={13} height={13} className="transition group-hover:translate-x-0.5" />
          </a>
        </nav>
      </header>

      <main className="relative z-0 flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="max-h-[42vh] border-b border-white/[0.06] bg-black/20 backdrop-blur-sm md:max-h-none md:w-[340px] md:shrink-0 md:border-b-0 md:border-r">
          <DocumentsPanel />
        </aside>
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col">
            <Suspense fallback={null}>
              <Chat suggestions={SAMPLE_QUESTIONS} />
            </Suspense>
          </div>
        </section>
      </main>
    </div>
  );
}
