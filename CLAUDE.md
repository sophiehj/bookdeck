# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (Vite)
npm run build        # tsc -b && vite build
npm run lint         # ESLint
npm run test         # Vitest (single run)
npm run test:watch   # Vitest watch mode
npm run test:coverage
```

Run a single test file: `npx vitest run src/services/ai.test.ts`

## Architecture

**Bookdeck** is a Korean shorts-style book discovery SPA. Users swipe through AI-summarized book cards by category — no login required.

### Stack
- React 19 + TypeScript, Vite, Tailwind CSS v4, React Router v7
- Zustand for global card state
- Firebase Firestore (cache only — no auth, no user data)
- Claude Haiku (via `@anthropic-ai/sdk`) for 2-sentence AI summaries — invoked in `src/services/ai.ts`
- Kakao Book API for book metadata — abstracted in `src/services/bookApi.ts`

### Key layers

| Layer | Location | Notes |
|---|---|---|
| Pages | `src/pages/` | `HomePage` (card deck), `BookDetailPage`, `SearchPage` |
| Global state | `src/store/cardStore.ts` | Zustand; card queue, swipe, seen ISBNs |
| Firestore | `src/services/firestore.ts` | AI summary cache only: `getCachedSummary`, `saveCachedSummary` |
| AI | `src/services/ai.ts` | Single entry point; 2-sentence summary; caches in Firestore `books/{isbn}/aiSummary` |
| Types | `src/types/index.ts` | `BookItem`, `AISummary` (`line1`, `line2`), `CardItem` |

### Firestore collections

```
books/{isbn}   aiSummary: { line1, line2, cachedAt }
```

No auth, no user collections.

### Design system

Pastel palette: primary `#C3B1E1` (lavender), secondary `#B5EAD7` (mint), background `#FAFAF7`, text `#2D2D2D` / `#6B7280`. All UI uses `rounded-2xl`, `border-[#E5E7EB]`, white cards on ivory background.

### Global type declarations

Third-party browser globals (Kakao SDK) are declared in `src/types/kakao.d.ts` via `declare global { interface Window { … } }`.
