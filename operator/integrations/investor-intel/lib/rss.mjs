// Minimal RSS 2.0 item extractor for Google News feeds.
// Zero deps. Sufficient for well-formed RSS — does not attempt full XML compliance.

const ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

function decodeEntities(s) {
  return s.replace(/&[a-zA-Z#0-9]+;/g, (m) => {
    if (m in ENTITIES) return ENTITIES[m];
    const hex = /^&#x([0-9a-fA-F]+);$/.exec(m);
    if (hex) return String.fromCodePoint(parseInt(hex[1], 16));
    const dec = /^&#([0-9]+);$/.exec(m);
    if (dec) return String.fromCodePoint(parseInt(dec[1], 10));
    return m;
  });
}

function stripCdata(s) {
  return s.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1");
}

function extractTag(xml, tag) {
  const rx = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const m = rx.exec(xml);
  if (!m) return null;
  return decodeEntities(stripCdata(m[1].trim())).trim();
}

function stripHtml(s) {
  if (s === null || s === undefined) return null;
  return decodeEntities(
    String(s)
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

export function parseRssItems(xml) {
  if (typeof xml !== "string" || !xml.includes("<item")) return [];
  const items = [];
  const itemRx = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRx.exec(xml)) !== null) {
    const block = m[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const pubDate = extractTag(block, "pubDate");
    const source = extractTag(block, "source");
    const description = stripHtml(extractTag(block, "description"));
    if (!title || !link) continue;
    items.push({ title, link, pubDate, source, description });
  }
  return items;
}

export function isoDateOf(pubDateStr) {
  if (!pubDateStr) return new Date().toISOString().slice(0, 10);
  const d = new Date(pubDateStr);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}
