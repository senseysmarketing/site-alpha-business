import React, { type ReactNode } from "react";

function parseInline(text: string): ReactNode[] {
  const result: ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_|~~(.+?)~~|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }
    const key = `i${match.index}`;
    if (match[2]) result.push(<strong key={key}>{match[2]}</strong>);
    else if (match[3]) result.push(<em key={key}>{match[3]}</em>);
    else if (match[4]) result.push(<em key={key}>{match[4]}</em>);
    else if (match[5]) result.push(<del key={key}>{match[5]}</del>);
    else if (match[6]) result.push(<code key={key} className="bg-muted px-1.5 py-0.5 rounded text-sm">{match[6]}</code>);
    else if (match[7] && match[8]) result.push(<a key={key} href={match[8]} className="text-primary underline" target="_blank" rel="noopener noreferrer">{match[7]}</a>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) result.push(text.slice(lastIndex));
  return result;
}

interface RenderOptions {
  headingClass?: string;
  paragraphClass?: string;
  h1Class?: string;
  h2Class?: string;
  h3Class?: string;
  wrapper?: (node: ReactNode, index: number) => ReactNode;
}

export function renderMarkdownContent(content: string, options: RenderOptions = {}): ReactNode[] {
  const {
    h1Class = "text-display text-3xl md:text-4xl font-light text-foreground mt-10 mb-5",
    h2Class = "text-display text-2xl md:text-3xl font-light text-foreground mt-10 mb-5",
    h3Class = "text-display text-xl md:text-2xl font-light text-foreground mt-8 mb-4",
    paragraphClass = "text-body text-base leading-relaxed text-muted-foreground mb-5",
    wrapper,
  } = options;

  const lines = content.split("\n");
  const elements: ReactNode[] = [];
  let i = 0;

  const wrap = (node: ReactNode, idx: number) => wrapper ? wrapper(node, idx) : node;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) { i++; continue; }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(wrap(<hr key={elements.length} className="my-8 border-border" />, elements.length));
      i++; continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      elements.push(wrap(<h3 key={elements.length} className={h3Class}>{parseInline(line.slice(4))}</h3>, elements.length));
      i++; continue;
    }
    if (line.startsWith("## ")) {
      elements.push(wrap(<h2 key={elements.length} className={h2Class}>{parseInline(line.slice(3))}</h2>, elements.length));
      i++; continue;
    }
    if (line.startsWith("# ")) {
      elements.push(wrap(<h1 key={elements.length} className={h1Class}>{parseInline(line.slice(2))}</h1>, elements.length));
      i++; continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(wrap(
        <blockquote key={elements.length} className="border-l-2 border-primary/30 pl-4 my-5 italic text-muted-foreground">
          {parseInline(quoteLines.join(" "))}
        </blockquote>, elements.length
      ));
      continue;
    }

    // Unordered list
    if (/^[-*] /.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(<li key={items.length}>{parseInline(lines[i].replace(/^[-*] /, ""))}</li>);
        i++;
      }
      elements.push(wrap(
        <ul key={elements.length} className={`list-disc list-inside space-y-1 mb-5 ${paragraphClass}`}>{items}</ul>, elements.length
      ));
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(<li key={items.length}>{parseInline(lines[i].replace(/^\d+\. /, ""))}</li>);
        i++;
      }
      elements.push(wrap(
        <ol key={elements.length} className={`list-decimal list-inside space-y-1 mb-5 ${paragraphClass}`}>{items}</ol>, elements.length
      ));
      continue;
    }

    // Paragraph — collect consecutive non-special lines
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3} |[-*] |\d+\. |> |---+$)/.test(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) {
      elements.push(wrap(
        <p key={elements.length} className={paragraphClass}>{parseInline(paraLines.join(" "))}</p>, elements.length
      ));
    }
  }

  return elements;
}
