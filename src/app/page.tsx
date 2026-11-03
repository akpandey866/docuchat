import { Suspense } from "react";
import Chat from "@/components/Chat";
import DocumentsPanel from "@/components/DocumentsPanel";
import { SAMPLE_QUESTIONS } from "@/data/sampleHandbook";

const REPO_URL = process.env.NEXT_PUBLIC_REPO_URL || "https://github.com/";

export default function Home() {
  return (
    <div className="flex h-dvh flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 font-bold text-white">D</div>
          <div>
            <h1 className="text-sm font-semibold leading-tight">DocuChat</h1>
            <p className="hidden text-xs text-zinc-500 sm:block">Chat with your documents — answers with citations</p>
          </div>
        </div>
        <nav className="flex items-center gap-4 text-xs">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            Source code
          </a>
          <a
            href="https://techgenisys.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-zinc-900 px-3 py-1.5 font-medium text-white dark:bg-white dark:text-zinc-900"
          >
            Built by TechGenisys
          </a>
        </nav>
      </header>

      <main className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="max-h-[40vh] border-b border-zinc-200 md:max-h-none md:w-80 md:border-b-0 md:border-r dark:border-zinc-800">
          <DocumentsPanel />
        </aside>
        <section className="flex min-h-0 flex-1 flex-col bg-white dark:bg-zinc-900/40">
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
