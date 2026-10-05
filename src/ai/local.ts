// Demo-safe provider: runs entirely in the browser, needs no API key, never fails on the network.
import { cosine, embed, findPeople, firstName, memoryEmbedding, mentions, personMemories, related, search, tokens, top } from '../engine/memory'
import { cap, esc, list, plural, unique } from '../lib/util'
import type { AIProvider, Memory } from '../types'

const NON_NAMES = new Set(
  (
    'I The A An My We He She They It This That Today Yesterday Tomorrow Monday Tuesday Wednesday Thursday Friday Saturday Sunday ' +
    'January February March April June July August September October November December Recall When After Before If But And So Our ' +
    'His Her Their There Just Also Then Photo Screenshot Remember Note Maybe Last Next'
  ).split(' '),
)
const PERSON_VERBS = /^(?:'s|told|said|says|wants|is|was|likes|loves|has|had|mentioned|thinks|works|lives|will|went|asked|called|needs|hates|prefers)\b/
const PERSON_CUES = new Set(['with', 'met', 'told', 'saw', 'called', 'asked', 'friend', 'brother', 'sister', 'named', 'and'])
const PLACE_CUES = new Set(['in', 'at', 'near', 'around', 'outside', 'leave', 'leaving'])
const EVENTS = ['birthday', 'wedding', 'dinner', 'meeting', 'trip', 'graduation', 'interview', 'anniversary', 'party', 'funeral', 'concert', 'flight']

const INTENTS: [RegExp, string][] = [
  [/\b(remember to|don't forget|remind)\b/i, 'Reminder'],
  [/\b(idea|what if|could try)\b/i, 'Idea'],
  [/\b(wants?|plans?|hopes?|going to|will|intends?|decided to|someday|tomorrow|next (week|month|year))\b/i, 'Future plan'],
  [/\b(likes?|loves?|prefers?|hates?|favou?rite|enjoys?|allergic)\b/i, 'Preference'],
  [/\b(met|went|visited|happened|yesterday|today|last (night|week))\b/i, 'Event'],
]
const SENTIMENTS: [RegExp, string][] = [
  [/\b(maybe|might|not sure|unsure|wonder|for a while|someday|settles?|questioning|doubt)\b/i, 'Uncertain · reflective'],
  [/\b(worried|afraid|angry|sad|upset|danger|dangerous|hurt|regret|guilt|tired|stress)/i, 'Concerned'],
  [/\b(happy|excited|loves?|great|proud|glad|hope|better|fun)\b/i, 'Positive'],
]
const CATEGORY: Record<string, string> = { 'Future plan': 'Plans', Preference: 'Preferences', Event: 'Events', Idea: 'Ideas', Reminder: 'Reminders' }

// ponytail: naive gerund ("leave" → "Leaving"); wrong for consonant-doubling verbs ("run"). A real model replaces this.
const gerund = (v: string) => (/ing$/.test(v) ? v : v.length <= 2 || /ee$/.test(v) ? v + 'ing' : v.replace(/e$/, '') + 'ing')

/** "wants to leave Vice City for a while" → "Leaving Vice City" */
function planTopic(text: string) {
  const match = text.match(
    /\b(?:wants?|plans?|hopes?|needs?|going|decided|trying)\s+to\s+((?:[\w'-]+\s?){1,4}?)(?=\s+(?:for|after|before|when|because|with|so|and|but|once|if|by|in|on|at)\b|[.,!?;]|$)/i,
  )
  if (!match) return
  const [verb, ...rest] = match[1].trim().split(' ')
  return cap([gerund(verb.toLowerCase()), ...rest].join(' '))
}

export const local: AIProvider = {
  name: 'On-device demo engine',

  // ponytail: rule-based entity extraction. Precise on names it already knows, conservative on new ones.
  async extractMemory(text, ctx) {
    const raw = text.trim().replace(/\s+/g, ' ')
    if (raw.length < 3) throw new Error('Nothing to understand')

    const knownPlaces = unique(ctx.memories.flatMap((m) => m.places))
    const matched = knownPlaces.filter((p) => raw.toLowerCase().includes(p.toLowerCase()))
    const places = matched.filter((p) => !matched.some((o) => o !== p && o.includes(p)))
    const relNames = unique(ctx.people.flatMap((p) => p.relationships.filter((r) => !r.personId).map((r) => r.name)))
    const relationships = relNames.filter((n) => mentions(raw, n))
    // Mentioning someone's known connection ("Ciri") files the memory under that person ("Geralt") too.
    const people = unique([...findPeople(raw, ctx.people), ...ctx.people.filter((p) => p.relationships.some((r) => relationships.includes(r.name)))])

    const taken = [...ctx.people.flatMap((p) => [p.name, ...p.aliases]), ...relNames, ...knownPlaces].join(' | ').toLowerCase()
    const newPeople: string[] = []
    for (const hit of raw.matchAll(/\b[A-Z][a-z]+(?: [A-Z][a-z]+)*/g)) {
      const name = hit[0].split(' ').filter((w) => !NON_NAMES.has(w)).join(' ')
      if (!name || taken.includes(name.toLowerCase())) continue
      const prev = raw.slice(0, hit.index).trimEnd().split(' ').pop()!.toLowerCase()
      const next = raw.slice(hit.index + hit[0].length).trimStart()
      if (PLACE_CUES.has(prev)) places.push(name)
      else if (prev !== 'the' && (PERSON_VERBS.test(next) || PERSON_CUES.has(prev))) newPeople.push(name)
    }

    const concepts = Object.keys(embed(raw)).filter((k) => k[0] === '#').map((k) => cap(k.slice(1)))
    const plan = planTopic(raw)
    const topics = unique([...(plan ? [plan] : []), ...concepts]).slice(0, 3)
    const events = EVENTS.filter((e) => new RegExp(`\\b${e}\\b`, 'i').test(raw)).map(cap)
    const intent = INTENTS.find(([re]) => re.test(raw))?.[1] ?? (events.length ? 'Event' : 'Fact')
    const sentiment = SENTIMENTS.find(([re]) => re.test(raw))?.[1] ?? 'Neutral'
    const who = people.length + newPeople.length

    const summary = raw.replace(/\b(?:told me|mentioned|said|says)(?: that)? (?:he|she|they) /i, '')
    return {
      summary: /[.!?]$/.test(summary) ? summary : summary + '.',
      category: CATEGORY[intent] ?? concepts[0] ?? (who ? 'People' : places.length ? 'Places' : 'Notes'),
      people: people.map((p) => p.id),
      newPeople: unique(newPeople),
      places: unique(places),
      topics,
      events,
      relationships,
      intent,
      sentiment,
      importance: Math.min(1, 0.45 + 0.1 * who + (intent === 'Fact' ? 0 : 0.1) + 0.05 * concepts.length),
      confidence: Math.min(0.96, 0.55 + 0.12 * Math.min(who, 2) + 0.06 * Math.min(places.length, 2) + 0.05 * topics.length),
    }
  },

  async summarizePerson(person, ctx) {
    const mems = personMemories(person.id, ctx.memories)
    const name = firstName(person)
    if (!mems.length) return `Recall has not remembered anything about ${name} yet.`
    const key = [...mems].sort((a, b) => b.importance - a.importance).slice(0, 2).map((m) => m.summary)
    const themes = top(mems.flatMap((m) => m.topics), 3)
    const closest = person.relationships[0]
    return [
      person.description,
      ...key,
      themes.length && `Across ${plural(mems.length, 'memory')}, the themes that keep returning are ${list(themes.map((t) => t.toLowerCase()))}.`,
      closest && `The closest connection is ${closest.name} (${closest.label.toLowerCase()}).`,
    ]
      .filter(Boolean)
      .join(' ')
  },

  // Grounded by construction: the answer is assembled only from retrieved memories, and says so when there are none.
  async answerFromMemories(question, ctx) {
    const people = findPeople(question, ctx.people)
    const ids = new Set(people.map((p) => p.id))
    let rest = question
    for (const p of people) for (const n of [p.name, ...p.aliases]) rest = rest.replace(new RegExp(`\\b${esc(n)}\\b`, 'gi'), ' ')
    const terms = tokens(rest)
    const termVector = embed(rest)

    let ranked: { memory: Memory; score: number }[]
    if (people.length) {
      let pool = ctx.memories
        .filter((m) => m.people.some((id) => ids.has(id)))
        .map((memory) => ({ memory, match: terms.length ? cosine(termVector, memoryEmbedding(memory, ctx.people)) : 0 }))
      if (pool.some((x) => x.match > 0)) pool = pool.filter((x) => x.match > 0)
      ranked = pool
        .map(({ memory, match }) => ({ memory, score: 2 * memory.people.filter((id) => ids.has(id)).length + 2 * match + memory.importance }))
        .sort((a, b) => b.score - a.score)
    } else ranked = search(rest, ctx, 100)

    const link = people
      .flatMap((p) => p.relationships.map((r) => ({ p, r })))
      .find(({ r }) => (r.personId ? ids.has(r.personId) : tokens(r.name).some((t) => terms.includes(t))))
    const words = rest.split(/[^\p{L}\p{N}-]+/u).filter((w) => tokens(w).length)
    const parts = [...people.map(firstName), ...(link && !link.r.personId ? [link.r.name.split(' ').find((w) => terms.includes(tokens(w)[0])) ?? link.r.name] : [])]
    const title = people.length ? list(parts) : words.slice(0, 3).map(cap).join(' ') || 'Your memories'
    const total = ranked.length
    const sources = ranked.slice(0, 6).map((r) => r.memory)

    if (!total)
      return {
        title,
        countLine: 'Recall has nothing stored about this yet.',
        text: 'Answers only come from memories you have captured, so there is nothing to say here yet. Capture something about it and ask again.',
        sources,
        total,
      }

    const involved = top(ranked.flatMap((r) => r.memory.people), 5).map((id) => ctx.people.find((p) => p.id === id)).filter((p) => !!p).map(firstName)
    const lead = people.length
      ? link && `Recall knows ${link.r.name} as ${firstName(link.p)}'s ${link.r.label.toLowerCase()}.`
      : `${title} comes up in ${plural(total, 'memory')}${involved.length ? `, most often with ${list(involved)}` : ''}.`
    return {
      title,
      countLine: people.length
        ? `Recall has ${plural(total, 'memory')} involving ${parts.length > 1 ? 'them' : parts[0]}.`
        : `Recall found ${plural(total, 'memory')} connected to ${title}.`,
      text: [lead, sources.slice(0, people.length ? 5 : 3).map((m) => m.summary).join(' ')].filter(Boolean).join('\n\n'),
      sources,
      total,
    }
  },

  findRelatedMemories: async (memory, ctx) => related(memory, ctx),
  generateEmbedding: async (text) => embed(text),

  // No on-device vision: use the user's note when there is one, otherwise a clearly-labelled demo reading.
  async describeImage(_file, note) {
    return note.trim()
      ? { text: note.trim(), simulated: false }
      : { text: 'Photo of a handwritten note: dinner with Jason and Lucia in Vice City on Friday.', simulated: true }
  },

  // Browsers cannot read other sites (CORS), so the title and topic are inferred from the URL itself.
  async analyzeLink(input) {
    const url = new URL(/^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`)
    if (!/^https?:$/.test(url.protocol) || !url.hostname.includes('.')) throw new Error('Not a link')
    const domain = url.hostname.replace(/^www\./, '')
    const slug = decodeURIComponent(url.pathname).split('/').filter((s) => /[a-z]{3}/i.test(s)).pop() ?? ''
    const title = cap(slug.replace(/\.\w+$/, '').replace(/[-_+]+/g, ' ').trim()) || domain
    return { url: url.href, title, domain, text: title === domain ? `Saved a link from ${domain}.` : `${title} — saved from ${domain}.` }
  },
}
