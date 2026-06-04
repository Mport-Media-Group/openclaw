// Material-event classifier — heuristic only.
// Returns a category string (M&A | funding | executive_move | partnership | regulatory | null).
// Pattern-matches on title (and optionally description) using narrow keyword sets.
// False positives are acceptable; false negatives less so — when in doubt, classify.

const PATTERNS = [
  {
    category: "M&A",
    rx: /\b(acquir(?:e|es|ed|ing|ition)|merg(?:e|er|ed|ing)|to buy|buyout|takeover|divest(?:s|ed|iture)?|sells? to)\b/i,
  },
  {
    category: "funding",
    rx: /\b(raises?|raised|series\s+[a-h]\b|seed\b|funding round|funding\b|investment|valuation|ipo\b|files? to go public)\b/i,
  },
  {
    category: "executive_move",
    rx: /\b(appoint(?:s|ed|ment)?|names?|hires?|joins?|steps? down|departs?|resign(?:s|ed|ation)?|new\s+(?:ceo|cfo|coo|cto|cmo|cio|president|chief|head of))\b/i,
  },
  {
    category: "partnership",
    rx: /\b(partners? with|partnership|integrat(?:e|es|ed|ion) with|collaborat(?:e|es|ed|ion)|deal with|alliance)\b/i,
  },
  {
    category: "regulatory",
    rx: /\b(fda\b|cms\b|hhs\b|sec\b|doj\b|ftc\b|antitrust|fine[ds]?\b|lawsuit|sued|settle(?:s|d|ment)?|class action|investigat(?:e|es|ed|ion)|subpoena)\b/i,
  },
];

export function classify(item) {
  const text = `${item.title || ""}  ${item.description || ""}`;
  for (const { category, rx } of PATTERNS) {
    if (rx.test(text)) return category;
  }
  return null;
}

export const CATEGORY_PRIORITY = {
  "M&A": 10,
  funding: 8,
  executive_move: 7,
  partnership: 6,
  regulatory: 9,
};
