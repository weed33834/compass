"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
  className?: string;
  /** inline 模式：去掉 prose 包裹，适合嵌入按钮等已有布局的元素内 */
  inline?: boolean;
}

export default function MarkdownRenderer({ content, className = "", inline = false }: Props) {
  const wrapper = inline
    ? `[&_p]:m-0 [&_p]:p-0 [&_p]:text-sm [&_img]:max-h-48 ${className}`
    : `prose prose-sm prose-invert max-w-none ${className}`;
  return (
    <div className={wrapper}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt ?? ""}
              className="my-3 max-h-96 rounded-lg border border-starlight/15 object-contain"
              loading="lazy"
            />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brass underline underline-offset-2 hover:text-brass-dark"
            >
              {children}
            </a>
          ),
          p: ({ children }) => (
            <p className="my-2 text-base leading-relaxed text-ivory">{children}</p>
          ),
          code: ({ children, className: codeClass }) => {
            const isInline = !codeClass;
            if (isInline) {
              return (
                <code className="rounded bg-abyss-700/60 px-1.5 py-0.5 font-mono text-sm text-brass">
                  {children}
                </code>
              );
            }
            return (
              <pre className="overflow-x-auto rounded-lg bg-abyss-800/80 p-4 text-sm">
                <code className={codeClass}>{children}</code>
              </pre>
            );
          },
          ul: ({ children }) => <ul className="my-2 list-disc pl-6 text-ivory">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal pl-6 text-ivory">{children}</ol>,
          li: ({ children }) => <li className="my-1 text-base leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-4 border-brass/50 pl-4 italic text-starlight/70">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
