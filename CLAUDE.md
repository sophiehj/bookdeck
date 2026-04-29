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

Run a single test file: `npx vitest run src/components/StarRating.test.tsx`

## Architecture

**Booklip** is a Korean book-recommendation SPA. Users swipe through AI-generated book cards (읽을래요 / 패스), then land on a detail page with AI summary, reviews, and a reading-group matcher.

### Stack
- React 19 + TypeScript, Vite, Tailwind CSS v4, React Router v7
- Zustand for global state, Firebase (Auth + Firestore) as backend
- Claude Haiku (via `@anthropic-ai/sdk`) for AI summaries — invoked in `src/services/ai.ts`
- Kakao Book API for book metadata — abstracted in `src/services/bookApi.ts`

### Key layers

| Layer | Location | Notes |
|---|---|---|
| Pages | `src/pages/` | `HomePage` (card deck), `BookDetailPage`, `SearchPage`, `MyPage` |
| Global state | `src/store/authStore.ts`, `cardStore.ts` | Zustand; `authStore` holds the Firebase `AuthUser` |
| Server state | `src/hooks/useReviews.ts`, `useBookSearch.ts` | Direct Firestore / API calls (no React Query wrapper yet) |
| Firestore | `src/services/firestore.ts` | All reads/writes — reviews, reactions, feedback, AI summary cache |
| AI | `src/services/ai.ts` | Single entry point; caches results in Firestore `books/{isbn}/aiSummary` |
| Types | `src/types/index.ts` | Shared interfaces (`BookItem`, `Review`, `AISummary`, etc.) |
| Auth | `src/hooks/useAuth.ts` | Firebase `onAuthStateChanged` → `authStore`; supports Google + Kakao |

### Firestore collections

```
books/{isbn}            aiSummary: { hook, plot, message, recommend, reason, cachedAt }
reviews/{reviewId}      userId, isbn, content, rating, isPublic, reactions
userFeedbacks/{uid}_{isbn}  type: 'want'|'pass', title, authors, timestamp
userReactions/{reviewId}_{userId}  type: ReactionType | null
users/{uid}             wantToRead: { [isbn]: true }
```

### Design system

Pastel palette: primary `#C3B1E1` (lavender), secondary `#B5EAD7` (mint), background `#FAFAF7`, text `#2D2D2D` / `#6B7280`. All UI uses `rounded-2xl`, `border-[#E5E7EB]`, white cards on ivory background.

### Global type declarations

Third-party browser globals (Kakao SDK, Disqus) are declared in `src/types/kakao.d.ts` and `src/types/disqus.d.ts` via `declare global { interface Window { … } }`.
