// The memory engine: pure, synchronous retrieval and graph logic over people + memories.
import { esc } from '../lib/util'
import type { Embedding, Memory, MemoryContext, Person, Relationship } from '../types'

const STOP = new Set(
  (
    'a an the and or but of to in on at for with from by about as is are was were be been it its this that these those ' +
    'i me my we our you your he she they them his her their him do does did what who whom which when where how know known ' +
    'recall remember remembered memory memories connected connection involve involves involving relationship has have had ' +
    'not no so if then than into over up out all any some tell show find anything everything there'
  ).split(' '),
)

/** Words that should match each other even when the exact term differs — this is what makes search "semantic-style". */
export const CONCEPTS: Record<string, string[]> = {
  family: 'family father mother mom dad son daughter brother sister parent wife husband child kid adopted uncle aunt raised raise'.split(' '),
  mentorship: 'mentor mentoring mentorship taught teach teaching trained train training lesson student teacher protege apprentice advisor'.split(' '),
  future: 'future plan planning dream dreamed hope someday goal want'.split(' '),
  loyalty: 'loyal loyalty betray betrayal trust faith rely'.split(' '),
  survival: 'survive survival survivor surviving danger dangerous infection outbreak'.split(' '),
  crime: 'crime criminal heist robbery outlaw drug gang prison penitentiary incarcerated grifter smuggling'.split(' '),
  exploration: 'explore exploration expedition journey travel travelled adventure quest'.split(' '),
  relationships: 'partner love romance girlfriend boyfriend'.split(' '),
  loss: 'grief loss lost died death mourn guilt regret ashes'.split(' '),
  conflict: 'war enemy battle villain rival rivalry fight'.split(' '),
}

const stem = (w: string) => w.replace(/ies$/, 'y').replace(/([^s])s$/, '$1')
const CONCEPT_OF = new Map(Object.entries(CONCEPTS).flatMap(([concept, words]) => words.map((w) => [stem(w), concept] as const)))

export const tokens = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map(stem)

// ponytail: sparse bag-of-words + concept expansion, exact and dependency-free. Swap for a real
// embedding model (behind AIProvider.generateEmbedding) when recall on paraphrases matters.
export function embed(text: string): Embedding {
  const v: Embedding = {}
  for (const t of tokens(text)) {
    v[t] = (v[t] ?? 0) + 1
    const concept = CONCEPT_OF.get(t)
    if (concept) v[`#${concept}`] = (v[`#${concept}`] ?? 0) + 1
  }
  return v
}

const norm = (v: Embedding) => Math.sqrt(Object.values(v).reduce((s, x) => s + x * x, 0))
export function cosine(a: Embedding, b: Embedding) {
  let dot = 0
  for (const k in a) if (b[k]) dot += a[k] * b[k]
  return dot ? dot / (norm(a) * norm(b)) : 0
}

const cache = new WeakMap<Memory, Embedding>()
export function memoryEmbedding(m: Memory, people: Person[]) {
  let e = cache.get(m)
  if (!e) {
    const names = people.filter((p) => m.people.includes(p.id)).map((p) => p.name)
    e = embed([m.rawText, m.category, ...m.places, ...m.topics, ...m.events, ...m.relationships, ...names].join(' '))
    cache.set(m, e)
  }
  return e
}

export function search(query: string, ctx: MemoryContext, limit = 30) {
  const q = embed(query)
  const prefixes = Object.keys(q).filter((k) => k[0] !== '#' && k.length >= 3)
  if (!Object.keys(q).length) return []
  return ctx.memories
    .map((memory) => {
      const e = memoryEmbedding(memory, ctx.people)
      // lets a half-typed word ("leon") still find its memories
      const partial = prefixes.some((t) => Object.keys(e).some((k) => k.startsWith(t))) ? 0.25 : 0
      return { memory, score: cosine(q, e) + partial }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function related(memory: Memory, ctx: MemoryContext, limit = 3) {
  const e = memoryEmbedding(memory, ctx.people)
  return ctx.memories
    .filter((m) => m.id !== memory.id)
    .map((m) => ({ m, score: cosine(e, memoryEmbedding(m, ctx.people)) + 0.3 * m.people.filter((id) => memory.people.includes(id)).length }))
    .filter((r) => r.score > 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.m)
}

/** Most frequent values first. */
export function top(values: string[], n: number) {
  const count = new Map<string, number>()
  for (const v of values) count.set(v, (count.get(v) ?? 0) + 1)
  return [...count].sort((a, b) => b[1] - a[1]).slice(0, n).map(([v]) => v)
}

const TITLES = new Set(['Princess', 'Aunt', 'Uncle', 'Lord', 'Master', 'Dr.'])
export const shortName = (name: string) => name.split(' ').find((w) => !TITLES.has(w)) ?? name
export const firstName = (p: Person) => p.aliases[0] ?? shortName(p.name)
export const personMemories = (id: string, memories: Memory[]) => memories.filter((m) => m.people.includes(id))
export const personTags = (p: Person, memories: Memory[]) => (p.tags.length ? p.tags : top(personMemories(p.id, memories).flatMap((m) => m.topics), 4))

export const findPeople = (text: string, people: Person[]) =>
  people.filter((p) => new RegExp(`\\b(${[p.name, ...p.aliases].map(esc).join('|')})\\b`, 'i').test(text))

/** Does the text mention this name, in full or by one of its distinctive words? */
export const mentions = (text: string, name: string) =>
  text.includes(name) || name.split(' ').some((w) => w.length >= 4 && !TITLES.has(w) && new RegExp(`\\b${esc(w)}\\b`).test(text))

export const sharedMemories = (person: Person, rel: Relationship, memories: Memory[]) =>
  personMemories(person.id, memories).filter((m) => (rel.personId ? m.people.includes(rel.personId) : m.relationships.includes(rel.name)))

// ── Graph ────────────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string
  type: 'person' | 'related' | 'place' | 'topic'
  label: string
  personId?: string
  r: number
  x: number
  y: number
}
export interface GraphEdge {
  a: string
  b: string
}
export interface Graph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  size: number
}

/** The whole memory graph, or one person's neighbourhood when focusId is given. */
export function buildGraph(ctx: MemoryContext, focusId?: string, size = 900): Graph {
  const nodes = new Map<string, GraphNode>()
  const edges = new Map<string, GraphEdge>()
  const add = (id: string, type: GraphNode['type'], label: string, r: number, personId?: string) => {
    if (!nodes.has(id)) nodes.set(id, { id, type, label, r, personId, x: 0, y: 0 })
    return id
  }
  const link = (a: string, b: string) => a !== b && edges.set([a, b].sort().join('|'), { a, b })
  const byId = new Map(ctx.people.map((p) => [p.id, p]))
  const topicOwners = new Map<string, Set<string>>()

  for (const p of focusId ? ctx.people.filter((x) => x.id === focusId) : ctx.people) {
    const me = add(`person:${p.id}`, 'person', p.name, 26, p.id)
    const mems = personMemories(p.id, ctx.memories)
    for (const r of p.relationships) {
      const other = r.personId ? byId.get(r.personId) : undefined
      link(me, other ? add(`person:${other.id}`, 'person', other.name, 26, other.id) : add(`rel:${r.name}`, 'related', r.name, 15))
    }
    for (const place of top(mems.flatMap((m) => m.places), focusId ? 4 : 2)) link(me, add(`place:${place}`, 'place', place, 9))
    const topics = mems.flatMap((m) => m.topics)
    if (focusId) for (const t of top(topics, 4)) link(me, add(`topic:${t}`, 'topic', t, 9))
    else for (const t of new Set(topics)) topicOwners.set(t, (topicOwners.get(t) ?? new Set()).add(me))
  }
  // Topics shared across people are what tie separate worlds into one graph.
  const shared = [...topicOwners].filter(([, owners]) => owners.size > 1).sort((a, b) => b[1].size - a[1].size).slice(0, 7)
  for (const [t, owners] of shared) for (const o of owners) link(o, add(`topic:${t}`, 'topic', t, 11))
  // People captured together in one memory are connected too.
  for (const m of ctx.memories)
    for (const a of m.people) for (const b of m.people) if (nodes.has(`person:${a}`) && nodes.has(`person:${b}`)) link(`person:${a}`, `person:${b}`)

  const graph = { nodes: [...nodes.values()], edges: [...edges.values()], size }
  if (focusId) {
    // One person's neighbourhood reads best as a simple star: the person in the middle, everything else around.
    graph.nodes.forEach((nd, i) => {
      const angle = ((i - 1) / Math.max(graph.nodes.length - 1, 1)) * Math.PI * 2 - Math.PI / 2
      const radius = i === 0 ? 0 : size * (i % 2 ? 0.36 : 0.3)
      nd.x = size / 2 + Math.cos(angle) * radius
      nd.y = size / 2 - 8 + Math.sin(angle) * radius
    })
  } else layout(graph)
  return graph
}

// ponytail: O(n²) Fruchterman–Reingold, deterministic and fine below ~150 nodes. Use d3-force if the graph outgrows that.
function layout({ nodes, edges, size }: Graph) {
  const n = nodes.length
  const c = size / 2
  const k = 0.6 * Math.sqrt((size * size) / Math.max(n, 1))
  // Pull toward the centre, scaled so it balances total repulsion at ~0.42 of the canvas: keeps nodes off the borders.
  const gravity = (n * k * k) / (size * 0.42) ** 2
  const index = new Map(nodes.map((nd, i) => [nd.id, i]))
  nodes.forEach((nd, i) => {
    const angle = (i / n) * Math.PI * 2
    const radius = n === 1 ? 0 : nd.type === 'topic' ? size * 0.1 : size * 0.36
    nd.x = c + Math.cos(angle) * radius
    nd.y = c + Math.sin(angle) * radius
  })
  const STEPS = 300
  for (let step = 0; step < STEPS; step++) {
    const temp = (size / 12) * (1 - step / STEPS)
    const move = nodes.map((nd) => ({ x: (c - nd.x) * gravity, y: (c - nd.y) * gravity }))
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const dx = nodes[i].x - nodes[j].x
        const dy = nodes[i].y - nodes[j].y
        const dist = Math.hypot(dx, dy) || 0.01
        const f = (k * k) / dist / dist
        move[i].x += dx * f
        move[i].y += dy * f
        move[j].x -= dx * f
        move[j].y -= dy * f
      }
    for (const e of edges) {
      const i = index.get(e.a)!
      const j = index.get(e.b)!
      const dx = nodes[i].x - nodes[j].x
      const dy = nodes[i].y - nodes[j].y
      const f = Math.hypot(dx, dy) / k
      move[i].x -= dx * f
      move[i].y -= dy * f
      move[j].x += dx * f
      move[j].y += dy * f
    }
    nodes.forEach((nd, i) => {
      const len = Math.hypot(move[i].x, move[i].y) || 1
      const scale = Math.min(len, temp) / len
      nd.x = Math.min(size - 50, Math.max(50, nd.x + move[i].x * scale))
      nd.y = Math.min(size - 40, Math.max(40, nd.y + move[i].y * scale))
    })
  }
}
