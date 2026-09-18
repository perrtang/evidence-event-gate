import test from "node:test";
import assert from "node:assert/strict";
import { assessEventPublicationTrust, tokenOverlap } from "../src/index.js";

test("requires independently published, coherent evidence", () => {
  const result = assessEventPublicationTrust({ event: { title: "City recalls contaminated cooking oil products", summary: "The city ordered a contaminated cooking oil product recall while inspectors trace product distribution." }, articles: [article("agency", "Public Agency", "Recall notice for contaminated cooking oil products"), article("media", "Public Media", "Inspectors trace recalled cooking oil distribution")] });
  assert.equal(result.reviewStatus, "auto_approved"); assert.equal(result.independentSourceCount, 2);
});

test("does not count a single publisher twice", () => {
  const result = assessEventPublicationTrust({ event: { title: "City recalls contaminated cooking oil products", summary: "The city ordered a contaminated cooking oil product recall while inspectors trace product distribution." }, articles: [article("one", "Public Media", "Cooking oil recall notice"), article("two", "PUBLIC MEDIA", "Distribution records for recalled cooking oil")] });
  assert.equal(result.reviewStatus, "needs_review"); assert.deepEqual(result.reasons, ["insufficient_independent_publishers"]);
});

test("quarantines an openable but unrelated candidate", () => {
  const result = assessEventPublicationTrust({ event: { title: "City recalls contaminated cooking oil products", summary: "The city ordered a contaminated cooking oil product recall while inspectors trace product distribution." }, articles: [article("agency", "Public Agency", "Recall notice for contaminated cooking oil products"), article("media", "Public Media", "Inspectors trace recalled cooking oil distribution"), article("sports", "Sports Desk", "City baseball team recalls injured pitcher")] });
  assert.equal(result.reviewStatus, "needs_review"); assert.ok(result.quarantinedArticleIds.includes("sports"));
});

test("supports CJK character-bigram overlap without a segmentation dependency", () => assert.ok(tokenOverlap("中聯油脂污染產品啟動下架回收", "中聯油脂問題油品下架回收") >= 0.28));

function article(id, publisher, title) { return { id, publisher, url: `https://example.test/${id}`, title }; }
