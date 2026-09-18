# evidence-event-gate

Deterministic publication checks for source-backed event summaries.

`evidence-event-gate` helps an editorial, research, or civic-information system answer a deliberately narrow question: **does this summary have enough coherent, independently published, openable evidence to be released without human review?**

It does not fact-check a claim, rank media organisations, scrape pages, or replace editorial judgement. It returns its reasons and keeps the final decision with the caller.

## What it checks

- At least a caller-defined number of independent publishers.
- A readable public URL for each counted source.
- Whether the event title, summary, and source titles point to the same event.
- Candidate articles that appear to belong to a different event and should be quarantined.

The package has no network, database, AI-provider, or framework dependency.

## Install

```bash
npm install evidence-event-gate
```

Until the package is published to npm, use a GitHub dependency or copy the small module into a reviewed internal package.

## Example

```js
import { assessEventPublicationTrust } from "evidence-event-gate";

const result = assessEventPublicationTrust({
  event: {
    title: "City recalls contaminated cooking oil products",
    summary: "The city ordered a contaminated cooking oil product recall while inspectors trace distribution records.",
  },
  articles: [
    { id: "agency", publisher: "Public Agency", url: "https://agency.example/recall", title: "Recall notice for contaminated cooking oil products" },
    { id: "public-media", publisher: "Public Media", url: "https://public-media.example/oil-recall", title: "Inspectors trace recalled cooking oil distribution" },
  ],
});

console.log(result.reviewStatus); // "auto_approved"
```

## Output boundary

`auto_approved` means the supplied records meet configured structural checks. It is not a statement that the event is true, complete, safe to publish in every jurisdiction, or free of legal risk. Consumers should retain their own review, correction, removal, and attribution policies.

## Development

```bash
npm test
```

## License

[MIT](LICENSE)
Deterministic evidence and publication gates for source-backed event summaries.
