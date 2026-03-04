'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface MarkdownRendererProps {
  content: string
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-slate-800 mt-6 mb-4 pb-2 border-b border-slate-200">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-slate-800 mt-5 mb-3 pb-1 border-b border-slate-100">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-slate-700 mt-4 mb-2">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-slate-700 mt-3 mb-2">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="text-slate-700 leading-relaxed mb-4">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-1 text-slate-700">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1 text-slate-700">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-slate-700">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-slate-50 rounded-r-lg">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-200 bg-white">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-50">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-slate-700">{children}</td>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !className || !className.includes('language-')
            if (!isInline && match) {
              return (
                <div className="rounded-lg overflow-hidden my-4 shadow-sm">
                  <div className="bg-slate-800 px-4 py-2 text-xs text-slate-300 flex items-center justify-between">
                    <span className="font-mono">{match[1]}</span>
                  </div>
                  <pre className="bg-slate-800 text-slate-100 p-4 overflow-x-auto text-sm font-mono">
                    <code {...props}>{children}</code>
                  </pre>
                </div>
              )
            }
            return (
              <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => <>{children}</>,
          hr: () => <hr className="my-6 border-slate-200" />,
          strong: ({ children }) => <strong className="font-bold text-slate-800">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
