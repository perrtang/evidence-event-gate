/** @typedef {{id: string, publisher: string, url: string | null, title: string, snippet?: string | null}} EvidenceArticle */

/**
 * Assess structural evidence for an event draft without network access or AI.
 * @param {{event: {title: string, summary: string}, articles: EvidenceArticle[], seedArticleId?: string, minimumIndependentPublishers?: number, isOpenable?: (article: EvidenceArticle) => boolean, canonicalPublisher?: (publisher: string) => string, isRelevant?: (eventText: string, article: EvidenceArticle) => boolean}} input
 */
export function assessEventPublicationTrust(input) {
  const minimumIndependentPublishers = input.minimumIndependentPublishers ?? 2;
  const isOpenable = input.isOpenable ?? defaultIsOpenable;
  const canonicalPublisher = input.canonicalPublisher ?? defaultCanonicalPublisher;
  const isRelevant = input.isRelevant ?? defaultIsRelevant;
  const publicArticles = input.articles.filter(isOpenable);
  if (publicArticles.length === 0) return buildResult(["no_public_evidence"], [], [], input.articles.map((article) => article.id), 0);

  const titleRelevant = publicArticles.filter((article) => isRelevant(input.event.title, article));
  const seed = titleRelevant.find((article) => article.id === input.seedArticleId) ?? titleRelevant[0];
  const coherent = seed ? titleRelevant.filter((article) => isRelevant(seed.title, article)) : [];
  const coherentIds = new Set(coherent.map((article) => article.id));
  const quarantined = publicArticles.filter((article) => !coherentIds.has(article.id));
  const independent = selectIndependentArticles(coherent, canonicalPublisher);
  const reasons = [];
  if (!seed) reasons.push("event_title_missing_source_anchor");
  if (!summaryMatchesEvent(input.event.title, input.event.summary, isRelevant)) reasons.push("summary_event_identity_mismatch");
  if (quarantined.length > 0) reasons.push("ambiguous_article_candidates");
  if (independent.length < minimumIndependentPublishers) reasons.push("insufficient_independent_publishers");
  return buildResult(reasons, independent.map((article) => article.id), coherent.map((article) => article.id), quarantined.map((article) => article.id), independent.length);
}

/** @param {string} eventTitle @param {string} summary @param {(eventText: string, article: EvidenceArticle) => boolean} [isRelevant] */
export function summaryMatchesEvent(eventTitle, summary, isRelevant = defaultIsRelevant) {
  const cleaned = String(summary ?? "").replace(/\s+/g, " ").trim();
  return cleaned.length >= 8 && isRelevant(eventTitle, { id: "summary", publisher: "summary", url: null, title: cleaned });
}

/** @param {EvidenceArticle[]} articles @param {(publisher: string) => string} canonicalPublisher */
export function selectIndependentArticles(articles, canonicalPublisher = defaultCanonicalPublisher) {
  const seen = new Set();
  return articles.filter((article) => {
    const key = canonicalPublisher(article.publisher);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** @param {EvidenceArticle} article */
export function defaultIsOpenable(article) {
  try { const url = new URL(article.url ?? ""); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
}

/** @param {string} publisher */
export function defaultCanonicalPublisher(publisher) { return String(publisher ?? "").trim().toLocaleLowerCase(); }

/** @param {string} eventText @param {EvidenceArticle} article */
export function defaultIsRelevant(eventText, article) { return tokenOverlap(eventText, `${article.title} ${article.snippet ?? ""}`) >= 0.28; }

/** @param {string} left @param {string} right */
export function tokenOverlap(left, right) {
  const leftTokens = tokens(left); const rightTokens = new Set(tokens(right));
  if (leftTokens.length === 0 || rightTokens.size === 0) return 0;
  return leftTokens.filter((token) => rightTokens.has(token)).length / leftTokens.length;
}

function tokens(value) {
  const normalized = String(value ?? "").normalize("NFKC").toLocaleLowerCase();
  const words = normalized.match(/[\p{L}\p{N}]{2,}/gu) ?? [];
  const cjkBigrams = [];
  for (const sequence of normalized.match(/[\p{Script=Han}]{2,}/gu) ?? []) for (let index = 0; index < sequence.length - 1; index += 1) cjkBigrams.push(sequence.slice(index, index + 2));
  return [...new Set([...words, ...cjkBigrams])];
}

function buildResult(reasons, evidenceArticleIds, coherentArticleIds, quarantinedArticleIds, independentSourceCount) {
  const autoApproved = reasons.length === 0;
  return { reviewStatus: autoApproved ? "auto_approved" : "needs_review", confidence: autoApproved ? 0.94 : Math.max(0.35, 0.82 - reasons.length * 0.12), reasons, evidenceArticleIds, independentSourceCount, coherentArticleIds, quarantinedArticleIds };
}
