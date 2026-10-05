# Recall

**Your life has context. Recall remembers it.**

A mobile-first PWA that acts as a personal memory layer: capture something by text, voice, photo or link, let Recall extract the people, places, topics and intent, then browse it as profiles, a timeline and a graph, or ask questions that are answered only from what is stored.

It runs entirely in the browser. No account, no API key, no backend, so it hosts for $0.

## Run

```bash
npm install
npm run dev
```

`npm test` runs the engine checks, `npm run build` type-checks and builds to `dist/`.

## Deploy

Import the repo in Vercel (framework preset: Vite) or run `vercel --prod`. No environment variables are needed.

## Structure

| Path | What lives there |
| --- | --- |
| `src/types.ts` | Memory, Person and the `AIProvider` contract |
| `src/engine/memory.ts` | Embeddings, search, related memories, graph building and layout |
| `src/ai/local.ts` | Demo-safe provider: on-device extraction, summaries and grounded answers |
| `src/ai/provider.ts` | Picks the provider; hosted-model seam with automatic local fallback |
| `src/data/demo.ts` | The ten demo profiles and their memories |
| `src/store.tsx` | State, persistence (localStorage) and navigation |
| `src/components`, `src/screens` | UI |

## Connecting a real model

Set `VITE_AI_ENDPOINT` to a serverless function you own. The app POSTs `{ fn, args }` (for example `extractMemory`) and expects the same JSON the local provider returns. Any failure falls back to the local engine, so the UI never shows an API error. Keep the model API key on the server, never in the client.

## Honest limits of the demo engine

- Extraction is rule-based. It is precise for people it already knows and deliberately conservative about new names.
- Embeddings are sparse term vectors with concept expansion ("family" matches "father", "daughter"), not a neural model.
- Photos are not analysed on-device: the note you add is what gets understood, otherwise a labelled demo reading is used.
- Links are understood from the URL itself, because browsers cannot read other sites.

Demo profiles reference well-known game characters purely as recognisable sample data.
