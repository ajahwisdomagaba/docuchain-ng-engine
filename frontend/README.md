# ContractAI — Contract Intelligence Vault

A Next.js (App Router) + Tailwind + shadcn/ui interface for managing, querying,
and de-risking contracts.

## Views

- **Contract Vault** (`/vault`) — filterable table (counterparty, status,
  jurisdiction) with a drag-and-drop upload panel.
- **Contract Detail & Q&A** (`/contracts/[id]`) — split screen: a mock PDF
  viewer on the left (page nav, zoom, highlighted clause anchors) and a right
  panel that toggles between extracted **Metadata** and an interactive
  **Q&A chat drawer**. Chat answers cite clauses as clickable chips that jump
  the PDF viewer to the right page and highlight the clause ("clause
  deep-linking").
- **Obligation Tracker** (`/obligations`) — Kanban (Overdue / Due Soon /
  Upcoming / Completed) or List view, auto-populated from extracted payment
  milestones, expiry dates, and notice triggers.
- **Risk Report** (`/risk`) — severity-bucketed red-flag clauses, each with
  the original clause text and a plain-English translation plus a
  recommendation.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 — it redirects to `/vault`.

## Data

All content in `lib/mock-data.ts` is illustrative sample data (six contracts,
obligations, and risk flags) so every view is fully populated out of the box.
Swap this out for real extraction/API results:

- `lib/types.ts` — the shape every view expects (`Contract`, `Obligation`,
  `RiskFlag`, `ClauseRef`).
- `components/detail/chat-drawer.tsx` — `answerFor()` is a stand-in for a
  real LLM call; replace it with a request to your Q&A backend, keeping the
  `{ text, clauseIds }` return shape so citation deep-linking keeps working.
- `components/detail/pdf-viewer.tsx` — swap the mock page renderer for a real
  PDF renderer (e.g. `react-pdf` / `pdf.js`) and keep the `id="clause-{id}"`
  anchors so scroll-to-clause continues to work.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui (Radix
primitives) · lucide-react icons.
