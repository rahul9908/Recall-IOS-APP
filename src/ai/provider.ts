// The one place the app picks its AI. Everything else imports `ai` and never knows which provider answered.
import type { AIProvider } from '../types'
import { local } from './local'

/**
 * Hosted provider seam: POSTs `{ fn, args }` to your own serverless endpoint (which holds the API key and
 * calls whichever model you like) and expects the same JSON shape the local provider returns.
 * Any failure falls back to the local engine, so the UI never sees an API error.
 * describeImage is left local here — a File does not survive JSON; send it as form data when wiring vision.
 */
function remote(endpoint: string): AIProvider {
  const call = (fn: keyof AIProvider) =>
    async (...args: unknown[]) => {
      try {
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fn, args }) })
        if (!res.ok) throw new Error(String(res.status))
        return await res.json()
      } catch {
        return (local[fn] as (...a: unknown[]) => unknown)(...args)
      }
    }
  return {
    ...local,
    name: 'Hosted model',
    extractMemory: call('extractMemory'),
    summarizePerson: call('summarizePerson'),
    answerFromMemories: call('answerFromMemories'),
    findRelatedMemories: call('findRelatedMemories'),
    generateEmbedding: call('generateEmbedding'),
  }
}

const endpoint = import.meta.env.VITE_AI_ENDPOINT as string | undefined
export const ai: AIProvider = endpoint ? remote(endpoint) : local
