import React from "react";

const URL_RE = /(https?:\/\/[^\s<>()"']+|www\.[^\s<>()"']+)/gi;

/**
 * Turns any http(s)/www URLs inside a plain-text string into clickable
 * <a> tags, leaving the rest of the text untouched. Safe to drop straight
 * into JSX: {linkify(item.description)}
 */
export function linkify(text: string | null | undefined): React.ReactNode {
  if (!text) return null;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  URL_RE.lastIndex = 0;
  while ((match = URL_RE.exec(text)) !== null) {
    const raw = match[0];

    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    // Don't let trailing punctuation (like a period ending a sentence,
    // or a closing bracket) get swallowed into the link.
    const trailingMatch = raw.match(/[),.!?;:'"]+$/);
    let url = raw;
    let trailing = "";
    if (trailingMatch) {
      trailing = trailingMatch[0];
      url = raw.slice(0, raw.length - trailing.length);
    }

    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;

    nodes.push(
      <a
        key={key++}
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="break-all text-indigo underline decoration-indigo/40 underline-offset-2 hover:decoration-indigo"
      >
        {url}
      </a>,
    );
    if (trailing) nodes.push(trailing);

    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}
