"use client";

import { Fragment, type ReactNode } from "react";

interface Props {
  text: string;
  onCite?: (n: number) => void;
  citable?: Set<number>;
}

/** Renders **bold** and [n] citation chips inside a line. */
function inline(line: string, props: Props, keyPrefix: string): ReactNode[] {
  return line.split(/(\*\*[^*]+\*\*|\[\d+\])/g).map((token, i) => {
    const key = `${keyPrefix}-${i}`;
    const cite = /^\[(\d+)\]$/.exec(token);
    if (cite) {
      const n = Number(cite[1]);
      if (props.citable && !props.citable.has(n)) return <Fragment key={key}>{token}</Fragment>;
      return (
        <button
          key={key}
          type="button"
          onClick={() => props.onCite?.(n)}
          className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-orange-100 px-1 align-text-top text-[11px] font-semibold text-orange-700 hover:bg-orange-200 dark:bg-orange-500/20 dark:text-orange-300"
          aria-label={`Show source ${n}`}
        >
          {n}
        </button>
      );
    }
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={key}>{token.slice(2, -2)}</strong>;
    }
    return <Fragment key={key}>{token}</Fragment>;
  });
}

/** Minimal Markdown: paragraphs, bullet/numbered lists, bold and citations. */
export default function MessageText(props: Props) {
  const blocks = props.text.trim().split(/\n{2,}/);

  return (
    <div className="space-y-3 leading-relaxed">
      {blocks.map((block, b) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^\s*([-*]|\d+\.)\s+/.test(l));
        if (isList) {
          const ordered = /^\s*\d+\./.test(lines[0]);
          const Tag = ordered ? "ol" : "ul";
          return (
            <Tag key={b} className={`space-y-1 pl-5 ${ordered ? "list-decimal" : "list-disc"}`}>
              {lines.map((l, i) => (
                <li key={i}>{inline(l.replace(/^\s*([-*]|\d+\.)\s+/, ""), props, `${b}-${i}`)}</li>
              ))}
            </Tag>
          );
        }
        return (
          <p key={b}>
            {lines.map((l, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {inline(l, props, `${b}-${i}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
