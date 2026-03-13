'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import RoastReport from '@/components/RoastReport'
import ScreenshotLightbox from '@/components/ScreenshotLightbox'

interface RoastPoint {
  id: number
  category: string
  emoji: string
  issue: string
  impact: 'high' | 'medium' | 'low'
  fix: string
}

interface FullAnalysis {
  score: number
  verdict: string
  biggest_problem: string
  roast_points: RoastPoint[]
  quick_wins: string[]
  screenshot_url: string
  analyzed_url: string
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      setError('No payment session found.')
      setLoading(false)
      return
    }

    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/unlock?session_id=${encodeURIComponent(sessionId)}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to retrieve report.')
        }

        setAnalysis(data)
        // Clear the stored URL now that we have the full report
        sessionStorage.removeItem('croroast_url')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load your report.')
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [sessionId])

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    if (score >= 30) return 'text-orange-400'
    return 'text-red-500'
  }

  const handleCopyReport = async () => {
    if (!analysis) return
    const lines: string[] = []
    lines.push(`🔥 CROroast Report — ${analysis.analyzed_url}`)
    lines.push(`Score: ${analysis.score}/100`)
    lines.push(`Verdict: ${analysis.verdict}`)
    lines.push(`#1 Conversion Killer: ${analysis.biggest_problem}`)
    lines.push('')
    lines.push('--- ISSUES ---')
    analysis.roast_points.forEach((p, i) => {
      lines.push(`${i + 1}. [${p.impact.toUpperCase()}] ${p.emoji} ${p.category}`)
      lines.push(`   Issue: ${p.issue}`)
      lines.push(`   Fix: ${p.fix}`)
    })
    if (analysis.quick_wins && analysis.quick_wins.length > 0) {
      lines.push('')
      lines.push('--- QUICK WINS ---')
      analysis.quick_wins.forEach((w, i) => lines.push(`${i + 1}. ${w}`))
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback: create a text area and copy
      const ta = document.createElement('textarea')
      ta.value = lines.join('\n')
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-pulse">🔥</div>
          <h1 className="text-2xl font-bold mb-3">Payment confirmed!</h1>
          <p className="text-gray-400 text-sm mb-6">Generating your full report...</p>
          <div className="flex gap-1.5 justify-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-orange-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (error || !analysis) {
    return (
      <main className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="text-5xl mb-4">😬</div>
          <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
          <p className="text-gray-400 text-sm mb-6">
            {error || 'We could not load your report.'}
          </p>
          <p className="text-gray-500 text-xs mb-6">
            Your payment was processed. If this issue persists, contact us with your session ID:
            <br />
            <code className="text-orange-400 text-xs mt-1 block">{sessionId}</code>
          </p>
          <a
            href="/"
            className="inline-block fire-gradient text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Back to Home
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <nav className="border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <span className="font-bold text-lg">CROroast</span>
        </div>
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <span>✅</span>
          <span>Payment confirmed</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Success Banner */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 mb-8 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <h1 className="text-xl font-bold text-green-400">Full Report Unlocked</h1>
          <p className="text-gray-400 text-sm mt-1">Here&apos;s everything we found. Time to fix your store.</p>
        </div>

        {/* Score + Verdict */}
        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start mb-4">
            {/* Screenshot thumbnail */}
            {analysis.screenshot_url && (
              <button
                onClick={() => setLightboxOpen(true)}
                className="w-full md:w-52 shrink-0 aspect-video rounded-xl overflow-hidden border border-[#2a2a2a] group cursor-zoom-in relative block"
                title="Click to view full page"
              >
                <img
                  src={analysis.screenshot_url}
                  alt="Page screenshot"
                  className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium bg-black/70 px-3 py-1.5 rounded-full">
                    🔍 View full page
                  </span>
                </div>
              </button>
            )}
            <div className="flex-1">
              <div className="flex items-baseline gap-3 mb-4">
                <span className={`text-7xl font-black ${getScoreColor(analysis.score)}`}>{analysis.score}</span>
                <span className="text-gray-600 text-2xl">/100</span>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-500 mb-1">🔥 The Roast</p>
                <p className="text-white font-medium">{analysis.verdict}</p>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <p className="text-sm text-red-400 mb-1">⚠️ #1 Conversion Killer</p>
                <p className="text-gray-300 text-sm">{analysis.biggest_problem}</p>
              </div>
            </div>
          </div>
        </div>

        {/* All roast points */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
            <span>🔍</span> All {analysis.roast_points.length} Issues
          </h2>
          <div className="space-y-4">
            {analysis.roast_points.map((point) => (
              <RoastReport key={point.id} point={point} />
            ))}
          </div>
        </div>

        {/* Quick Wins */}
        {analysis.quick_wins && analysis.quick_wins.length > 0 && (
          <div className="bg-[#111] border border-[#222] rounded-2xl p-8">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
              <span>⚡</span> Quick Wins (Do These Today)
            </h2>
            <div className="space-y-3">
              {analysis.quick_wins.map((win, i) => (
                <div key={i} className="flex items-start gap-3 bg-orange-500/5 border border-orange-500/10 rounded-xl p-4">
                  <span className="text-orange-400 font-bold text-sm shrink-0">#{i + 1}</span>
                  <p className="text-gray-300 text-sm leading-relaxed">{win}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Copy Report Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-2 bg-[#111] border border-[#2a2a2a] hover:border-orange-500/40 text-gray-300 hover:text-white font-medium px-6 py-3 rounded-xl transition-all text-sm"
          >
            {copied ? (
              <>✅ Copied to clipboard!</>
            ) : (
              <>📋 Copy Report</>
            )}
          </button>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <p className="text-gray-500 text-sm mb-4">Want to audit another page?</p>
          <a
            href="/"
            className="inline-block fire-gradient text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity glow-fire"
          >
            🔥 Roast Another Page
          </a>
        </div>
      </div>

      {/* Screenshot Lightbox */}
      {lightboxOpen && analysis?.screenshot_url && (
        <ScreenshotLightbox
          src={analysis.screenshot_url}
          analyzedUrl={analysis.analyzed_url}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-orange-500 animate-pulse text-4xl">🔥</div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  )
}
