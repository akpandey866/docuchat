import { Suspense } from "react";
import Chat from "@/components/Chat";
import { SparkleIcon } from "@/components/icons";
import { SAMPLE_QUESTIONS } from "@/data/sampleHandbook";

export const metadata = { title: "DocuChat Widget" };

type SearchParams = PageProps<"/embed">["searchParams"];

/**
 * Chat-only page loaded inside the website widget iframe.
 * `?kb=<workspace id>` pins the chat to one knowledge base; without it the
 * shared sample document is used.
 */
export default function EmbedPage({ searchParams }: PageProps<"/embed">) {
  return (
    <div className="flex h-dvh flex-col bg-white dark:bg-zinc-900">
      <Suspense fallback={<div className="h-14 bg-gradient-to-r from-orange-500 to-rose-500" />}>
        <Widget searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Widget({ searchParams }: { searchParams: SearchParams }) {
  const { kb, title } = await searchParams;
  const kbId = typeof kb === "string" ? kb : undefined;

  return (
    <>
      <header className="flex items-center gap-2.5 bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-3 text-white">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 ring-1 ring-white/30">
          <SparkleIcon width={14} height={14} />
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">
            {typeof title === "string" ? title.slice(0, 60) : "Ask our assistant"}
          </p>
          <p className="text-[11px] text-orange-100">Answers from our documentation</p>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <Chat kb={kbId} compact suggestions={kbId ? [] : SAMPLE_QUESTIONS.slice(0, 2)} />
      </div>
    </>
  );
}
