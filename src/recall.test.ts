import { expect, it } from 'vitest'
import { local } from './ai/local'
import { seedDemo } from './data/demo'
import { buildGraph, search } from './engine/memory'

const ctx = seedDemo()
const peopleIn = (query: string) => new Set(search(query, ctx).flatMap((r) => r.memory.people))

it('extracts context from a captured sentence', async () => {
  const ex = await local.extractMemory('Jason told me he wants to leave Vice City for a while after everything settles down.', ctx)
  expect(ex.people).toEqual(['jason'])
  expect(ex.newPeople).toEqual([])
  expect(ex.places).toEqual(['Vice City'])
  expect(ex.topics[0]).toBe('Leaving Vice City')
  expect(ex.intent).toBe('Future plan')
  expect(ex.sentiment).toMatch(/Uncertain/)
  expect(ex.summary).toMatch(/^Jason wants to leave/)
})

it('finds new people and places when starting fresh', async () => {
  const ex = await local.extractMemory('Sarah told me she is moving in Berlin after the Army.', { people: [], memories: [] })
  expect(ex.newPeople).toEqual(['Sarah'])
  expect(ex.places).toEqual(['Berlin'])
})

it('files a memory under the person whose connection is mentioned', async () => {
  expect((await local.extractMemory('Ciri wrote a letter from the road.', ctx)).people).toEqual(['geralt'])
})

it('searches by meaning, not just exact words', () => {
  for (const id of ['lucia', 'kratos', 'ellie', 'geralt']) expect(peopleIn('family')).toContain(id)
  expect([...peopleIn('Leonida')].sort()).toEqual(['jason', 'lucia'])
  expect(peopleIn('mentor').size).toBeGreaterThanOrEqual(4)
})

it('answers only from stored memories', async () => {
  const a = await local.answerFromMemories('What do I know about Jason and Lucia?', ctx)
  expect(a.title).toBe('Jason and Lucia')
  expect(a.total).toBe(13)
  expect(a.sources.length).toBe(6)
  expect(a.sources.every((m) => m.people.includes('jason') || m.people.includes('lucia'))).toBe(true)

  const dutch = await local.answerFromMemories("What does Recall know about Arthur's relationship with Dutch?", ctx)
  expect(dutch.title).toBe('Arthur and Dutch')
  expect(dutch.sources.every((m) => m.rawText.includes('Dutch'))).toBe(true)

  expect((await local.answerFromMemories('Who is connected to Ciri?', ctx)).text).toMatch(/Geralt/)
  expect((await local.answerFromMemories('What is the capital of France?', ctx)).sources).toEqual([])
})

it('builds a connected graph that stays on the canvas', () => {
  const g = buildGraph(ctx)
  expect(g.edges.some((e) => [e.a, e.b].sort().join() === 'person:jason,person:lucia')).toBe(true)
  const onBorder = g.nodes.filter((n) => n.x <= 51 || n.x >= g.size - 51 || n.y <= 41 || n.y >= g.size - 41).length
  let overlaps = 0
  for (const a of g.nodes) for (const b of g.nodes) if (a.id < b.id && Math.hypot(a.x - b.x, a.y - b.y) < 40) overlaps++
  expect(onBorder).toBeLessThan(g.nodes.length / 10)
  expect(overlaps).toBeLessThan(3)
})
