interface RoastPoint {
  id: number
  category: string
  emoji: string
  issue: string
  impact: 'high' | 'medium' | 'low'
  fix: string
}

const impactConfig = {
  high: { label: 'High Impact', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  medium: { label: 'Medium Impact', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  low: { label: 'Low Impact', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
}

export default function RoastReport({ point }: { point: RoastPoint }) {
  const impact = impactConfig[point.impact] || impactConfig.medium

  return (
    <div className="bg-[#161616] border border-[#222] rounded-xl p-5 animate-slide-up">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{point.emoji}</span>
          <span className="font-semibold text-white text-sm">{point.category}</span>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 ${impact.bg} ${impact.color}`}>
          {impact.label}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-gray-300 text-sm leading-relaxed">
          <span className="text-red-400 font-medium">Issue: </span>
          {point.issue}
        </p>
      </div>

      <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-lg p-3">
        <p className="text-sm text-gray-400 leading-relaxed">
          <span className="text-orange-400 font-medium">✅ Fix: </span>
          {point.fix}
        </p>
      </div>
    </div>
  )
}
