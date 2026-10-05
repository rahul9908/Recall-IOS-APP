import { motion } from 'framer-motion'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { MemoryCard } from '../components/cards'
import { GraphView } from '../components/GraphView'
import { Page, Press, Sheet } from '../components/ui'
import { buildGraph, type GraphNode } from '../engine/memory'
import { plural } from '../lib/util'
import { useApp } from '../store'

const LEGEND = [['People', 'linear-gradient(140deg,#ff9a6c,#e0457b)'], ['Connections', 'var(--color-sub)'], ['Places', '#34b89a'], ['Topics', 'var(--color-accent)']]
const clamp = (v: number, min: number) => Math.min(0, Math.max(min, v))

export function GraphPage({ focus }: { focus?: string }) {
  const { ctx, people, memories, pop, push } = useApp()
  const graph = useMemo(() => buildGraph(ctx), [ctx])
  const box = useRef<HTMLDivElement>(null)
  const dragged = useRef(false)
  const [view, setView] = useState<{ w: number; h: number }>()
  const [node, setNode] = useState<GraphNode>()

  useLayoutEffect(() => {
    const { width, height } = box.current!.getBoundingClientRect()
    setView({ w: width, h: height })
  }, [])

  const center = graph.nodes.find((n) => n.personId === (focus ?? people[0]?.id))
  const person = people.find((p) => p.id === node?.personId)
  const context = !node
    ? []
    : memories.filter((m) =>
        node.type === 'person' ? m.people.includes(node.personId!) : node.type === 'related' ? m.relationships.includes(node.label) : (node.type === 'place' ? m.places : m.topics).includes(node.label),
      )

  return (
    <Page title="Memory graph" onBack={pop}>
      <div className="absolute inset-0 flex flex-col">
        <div className="flex shrink-0 justify-center gap-4 pb-2">
          {LEGEND.map(([label, background]) => (
            <span key={label} className="flex items-center gap-1.5 text-xs font-medium text-sub">
              <span className="size-2.5 rounded-full" style={{ background }} />
              {label}
            </span>
          ))}
        </div>
        <div ref={box} className="relative flex-1 overflow-hidden">
          {view && (
            <motion.div
              drag
              dragElastic={0.08}
              dragConstraints={{ left: view.w - graph.size, right: 0, top: view.h - graph.size, bottom: 0 }}
              initial={{ opacity: 0, x: clamp(view.w / 2 - (center?.x ?? graph.size / 2), view.w - graph.size), y: clamp(view.h / 2 - (center?.y ?? graph.size / 2), view.h - graph.size) }}
              animate={{ opacity: 1 }}
              onDragStart={() => (dragged.current = true)}
              onDragEnd={() => setTimeout(() => (dragged.current = false), 50)}
              className="cursor-grab touch-none active:cursor-grabbing"
              style={{ width: graph.size, height: graph.size }}
            >
              <GraphView graph={graph} onNode={(n) => !dragged.current && setNode(n)} />
            </motion.div>
          )}
          <p className="pointer-events-none absolute bottom-[calc(var(--sab)+0.75rem)] left-1/2 -translate-x-1/2 rounded-full bg-card/80 px-3.5 py-1.5 text-xs whitespace-nowrap text-sub shadow-sm backdrop-blur-md">
            Drag to explore · tap a node for its context
          </p>
        </div>
      </div>

      <Sheet open={!!node} onClose={() => setNode(undefined)} title={node?.label ?? ''}>
        <p className="text-sub">
          {person?.description ?? { person: 'Person', related: 'Connection', place: 'Place', topic: 'Topic' }[node?.type ?? 'topic']} · {plural(context.length, 'memory')}
        </p>
        {person && (
          <Press
            className="btn mt-4"
            onClick={() => {
              setNode(undefined)
              push({ type: 'person', id: person.id })
            }}
          >
            Open profile
          </Press>
        )}
        <div className="mt-4 space-y-2">
          {context.slice(0, 6).map((m) => (
            <MemoryCard key={m.id} memory={m} compact />
          ))}
        </div>
      </Sheet>
    </Page>
  )
}
