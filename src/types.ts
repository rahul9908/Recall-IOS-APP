export type SourceType = 'text' | 'voice' | 'image' | 'link'

/** Sparse term vector (token → weight). A hosted provider can swap in dense vectors behind generateEmbedding(). */
export type Embedding = Record<string, number>

export interface Relationship {
  name: string
  label: string
  /** Set when the related person has their own profile. */
  personId?: string
}

export interface Person {
  id: string
  name: string
  universe: string
  description: string
  aliases: string[]
  tags: string[]
  /** Gradient stops for the generated profile artwork. */
  colors: [string, string]
  relationships: Relationship[]
  createdAt: number
}

export interface Memory {
  id: string
  rawText: string
  summary: string
  createdAt: number
  sourceType: SourceType
  category: string
  /** Person ids. */
  people: string[]
  places: string[]
  topics: string[]
  events: string[]
  /** Names of related people who do not have their own profile. */
  relationships: string[]
  intent: string
  sentiment: string
  importance: number
  confidence: number
  pinned?: boolean
  image?: string
  url?: string
  /** True when the content came from a demo fallback instead of real analysis. */
  simulated?: boolean
}

export interface MemoryContext {
  people: Person[]
  memories: Memory[]
}

export type Extraction = Pick<
  Memory,
  'summary' | 'category' | 'people' | 'places' | 'topics' | 'events' | 'relationships' | 'intent' | 'sentiment' | 'importance' | 'confidence'
> & {
  /** Names that do not match an existing profile yet. */
  newPeople: string[]
}

export interface Answer {
  title: string
  countLine: string
  text: string
  sources: Memory[]
  total: number
}

export interface LinkInfo {
  url: string
  title: string
  domain: string
  text: string
}

export interface AIProvider {
  name: string
  extractMemory(text: string, ctx: MemoryContext): Promise<Extraction>
  summarizePerson(person: Person, ctx: MemoryContext): Promise<string>
  answerFromMemories(question: string, ctx: MemoryContext): Promise<Answer>
  findRelatedMemories(memory: Memory, ctx: MemoryContext): Promise<Memory[]>
  generateEmbedding(text: string): Promise<Embedding>
  /** Vision seam: turn an image into text that extractMemory can understand. */
  describeImage(file: File, note: string): Promise<{ text: string; simulated: boolean }>
  analyzeLink(url: string): Promise<LinkInfo>
}
