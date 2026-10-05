import type { Graph, GraphNode } from '../engine/memory'
import { useApp } from '../store'

const initials = (label: string) => label.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
const FILL = { related: 'var(--color-card)', place: '#34b89a', topic: 'var(--color-accent)' }

/** Renders a laid-out memory graph. Nodes are keyboard-focusable buttons; lines drift subtly. */
export function GraphView({ graph, onNode }: { graph: Graph; onNode: (node: GraphNode) => void }) {
  const { people } = useApp()
  const at = new Map(graph.nodes.map((n) => [n.id, n]))
  return (
    <svg width={graph.size} height={graph.size} viewBox={`0 0 ${graph.size} ${graph.size}`} role="group" aria-label="Memory graph" className="block select-none">
      <defs>
        {people.map((p) => (
          <linearGradient key={p.id} id={`avatar-${p.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={p.colors[0]} />
            <stop offset="1" stopColor={p.colors[1]} />
          </linearGradient>
        ))}
      </defs>
      {graph.edges.map((e) => {
        const a = at.get(e.a)!
        const b = at.get(e.b)!
        return <line key={e.a + e.b} className="graph-edge" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
      })}
      {graph.nodes.map((n, i) => (
        <g
          key={n.id}
          role="button"
          tabIndex={0}
          aria-label={`${n.label}, ${n.type}`}
          className="graph-node"
          style={{ animationDelay: `${-(i % 7) * 0.85}s` }}
          onClick={() => onNode(n)}
          onKeyDown={(e) => e.key === 'Enter' && onNode(n)}
        >
          {/* generous invisible hit target for small nodes */}
          <circle cx={n.x} cy={n.y} r={Math.max(n.r, 22)} fill="transparent" />
          <circle
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={n.type === 'person' ? `url(#avatar-${n.personId})` : FILL[n.type]}
            fillOpacity={n.type === 'topic' ? 0.85 : 1}
            stroke={n.type === 'related' ? 'var(--color-sub)' : 'var(--color-card)'}
            strokeOpacity={n.type === 'related' ? 0.5 : 1}
            strokeWidth={n.type === 'person' ? 3 : 1.5}
          />
          {(n.type === 'person' || n.type === 'related') && (
            <text x={n.x} y={n.y} dy="0.36em" textAnchor="middle" fontSize={n.r * 0.72} fontWeight={600} fill={n.type === 'person' ? '#fff' : 'var(--color-sub)'}>
              {initials(n.label)}
            </text>
          )}
          <text x={n.x} y={n.y + n.r + 14} textAnchor="middle" className="graph-label" fill={n.type === 'person' ? 'var(--color-ink)' : undefined} style={n.type === 'person' ? { fill: 'var(--color-ink)', fontWeight: 600 } : undefined}>
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
