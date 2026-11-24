/**
 * Text anchoring for highlights inside a study guide's document.
 *
 * A highlight is stored as the exact quoted text + ~32 chars of context on
 * each side + its approximate offset in the page text. That survives the page
 * being re-rendered or the guide being re-imported with small edits, unlike a
 * DOM path. Marks are plain <mark> wrappers, so the page's text content (and
 * therefore every other highlight's offset) never changes.
 */

const CONTEXT = 32;
export const MAX_QUOTE = 4000;
export const MARK_ATTR = "data-guru-hl";

// Subtrees whose text is not readable content.
const SKIP = new Set(["script", "style", "noscript", "textarea", "template", "svg", "math", "head"]);

// NodeFilter constants as numbers: the iframe has its own NodeFilter global.
const SHOW_ELEMENT = 0x1;
const SHOW_TEXT = 0x4;
const FILTER_ACCEPT = 1;
const FILTER_REJECT = 2;
const FILTER_SKIP = 3;

export interface TextIndex {
  nodes: Text[];
  starts: number[];
  text: string;
}

export interface Anchor {
  quote: string;
  prefix: string;
  suffix: string;
  start: number;
}

export function indexText(doc: Document): TextIndex {
  const nodes: Text[] = [];
  const starts: number[] = [];
  const parts: string[] = [];
  let pos = 0;
  if (!doc.body) return { nodes, starts, text: "" };

  const walker = doc.createTreeWalker(doc.body, SHOW_ELEMENT | SHOW_TEXT, {
    acceptNode(n) {
      if (n.nodeType === 1) {
        return SKIP.has((n as Element).localName) ? FILTER_REJECT : FILTER_SKIP;
      }
      return FILTER_ACCEPT;
    },
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n as Text;
    if (!t.data.length) continue;
    nodes.push(t);
    starts.push(pos);
    parts.push(t.data);
    pos += t.data.length;
  }
  return { nodes, starts, text: parts.join("") };
}

/** Turn the user's current selection into a storable anchor. */
export function anchorFromRange(idx: TextIndex, range: Range): Anchor | null {
  let start = -1;
  let end = -1;
  for (let i = 0; i < idx.nodes.length; i++) {
    const node = idx.nodes[i];
    if (!range.intersectsNode(node)) {
      if (start >= 0) break; // past the end of a contiguous run
      continue;
    }
    const s = node === range.startContainer ? range.startOffset : 0;
    const e = node === range.endContainer ? range.endOffset : node.length;
    if (start < 0) start = idx.starts[i] + s;
    end = idx.starts[i] + e;
  }
  if (start < 0 || end <= start) return null;

  const { text } = idx;
  while (start < end && /\s/.test(text[start])) start++;
  while (end > start && /\s/.test(text[end - 1])) end--;
  if (end - start < 1) return null;
  if (end - start > MAX_QUOTE) end = start + MAX_QUOTE;

  return {
    quote: text.slice(start, end),
    prefix: text.slice(Math.max(0, start - CONTEXT), start),
    suffix: text.slice(end, end + CONTEXT),
    start,
  };
}

function commonSuffix(a: string, b: string) {
  let n = 0;
  while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) n++;
  return n;
}
function commonPrefix(a: string, b: string) {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

/** Find where a stored anchor sits in the current page text, or null. */
export function locate(
  idx: TextIndex,
  a: { quote: string | null; prefix: string | null; suffix: string | null; start_offset: number | null },
): { start: number; end: number } | null {
  const q = a.quote;
  if (!q) return null;
  const { text } = idx;
  let best = -1;
  let bestScore = -Infinity;
  for (let i = text.indexOf(q); i !== -1; i = text.indexOf(q, i + 1)) {
    const before = text.slice(Math.max(0, i - CONTEXT), i);
    const after = text.slice(i + q.length, i + q.length + CONTEXT);
    const score =
      commonSuffix(before, a.prefix ?? "") +
      commonPrefix(after, a.suffix ?? "") -
      Math.abs(i - (a.start_offset ?? i)) / 100000; // tie-break: nearest to old spot
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best < 0 ? null : { start: best, end: best + q.length };
}

/** Largest i with starts[i] <= pos. */
function firstNodeAt(idx: TextIndex, pos: number) {
  let lo = 0;
  let hi = idx.nodes.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (idx.starts[mid] <= pos) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}

/**
 * Wrap [start, end) of the page text in <mark> elements (one per text node it
 * spans). Mutates `idx` in place so it stays valid for further wraps.
 */
export function wrapRange(
  doc: Document,
  idx: TextIndex,
  start: number,
  end: number,
  attrs: { id: string; color: string; hasNote: boolean },
): HTMLElement[] {
  const marks: HTMLElement[] = [];
  for (let i = firstNodeAt(idx, start); i < idx.nodes.length && idx.starts[i] < end; i++) {
    let node = idx.nodes[i];
    const ns = idx.starts[i];
    const ne = ns + node.length;
    if (ne <= start) continue;
    const a = Math.max(start, ns) - ns;
    const b = Math.min(end, ne) - ns;
    if (b <= a) continue;

    if (b < node.length) {
      const tail = node.splitText(b);
      idx.nodes.splice(i + 1, 0, tail);
      idx.starts.splice(i + 1, 0, ns + b);
    }
    if (a > 0) {
      const mid = node.splitText(a);
      idx.nodes.splice(i + 1, 0, mid);
      idx.starts.splice(i + 1, 0, ns + a);
      i++;
      node = mid;
    }
    // Whitespace between block elements (e.g. between <li>s) isn't worth a mark.
    if (!node.data.trim() || !node.parentNode) continue;

    const mark = doc.createElement("mark");
    mark.className = "guru-hl";
    mark.setAttribute(MARK_ATTR, attrs.id);
    mark.dataset.c = attrs.color;
    if (attrs.hasNote) mark.classList.add("has-note");
    node.parentNode.insertBefore(mark, node);
    mark.appendChild(node);
    marks.push(mark);
  }
  if (marks.length) marks[marks.length - 1].classList.add("is-last");
  return marks;
}

export function marksFor(doc: Document, id: string): HTMLElement[] {
  return Array.from(doc.querySelectorAll<HTMLElement>(`mark[${MARK_ATTR}="${CSS.escape(id)}"]`));
}

/** Remove a highlight's marks, restoring the original text nodes. */
export function unwrap(doc: Document, id: string) {
  const parents = new Set<Node>();
  for (const mark of marksFor(doc, id)) {
    const parent = mark.parentNode;
    if (!parent) continue;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parents.add(parent);
  }
  parents.forEach((p) => p.normalize());
}

/** Styles injected into the guide so highlights look the same in every doc. */
export const HIGHLIGHT_CSS = `
mark.guru-hl{color:inherit;border-radius:3px;padding:0;cursor:pointer;
  -webkit-box-decoration-break:clone;box-decoration-break:clone;transition:background-color .15s,box-shadow .2s}
mark.guru-hl[data-c="yellow"]{background:rgba(255,213,79,.55)}
mark.guru-hl[data-c="green"]{background:rgba(110,231,183,.5)}
mark.guru-hl[data-c="pink"]{background:rgba(249,168,212,.58)}
mark.guru-hl[data-c="blue"]{background:rgba(147,197,253,.6)}
mark.guru-hl.has-note{text-decoration:underline dotted rgba(0,0,0,.55);text-underline-offset:3px}
mark.guru-hl.has-note.is-last::after{content:"\\270E";font-size:.75em;margin-left:2px;vertical-align:super;opacity:.75}
mark.guru-hl.guru-flash{box-shadow:0 0 0 3px #ff6a4d}
html.guru-erase mark.guru-hl{cursor:crosshair}
html.guru-erase mark.guru-hl:hover{background:rgba(255,106,77,.35);text-decoration:line-through}
html.guru-pen, html.guru-pen *{cursor:text}
`;
