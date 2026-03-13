'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import RoastReport from '@/components/RoastReport'

interface RoastPoint {
  id: number
  category: string
  emoji: string
  issue: string
  impact: 'high' | 'medium' | 'low'
  fix: string
}

interface PreviewAnalysis {
  score: number
  verdict: string
  biggest_problem: string
  roast_points: RoastPoint[]
  total_issues: number
  screenshot_url: string
  analyzed_url: string
}

const LOADING_STEPS = [
  { emoji: '📸', label: 'Capturing full-page screenshot...' },
  { emoji: '🧠', label: 'Analyzing with GPT-4o...' },
  { emoji: '📊', label: 'Preparing your report...' },
]

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [analysis, setAnalysis] = useState<PreviewAnalysis | null>(null)
  const [error, setError] = useState('')
  const [checkingOut, setCheckingOut] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)
  const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Cleanup step timers on unmount
  useEffect(() => {
    return () => stepTimersRef.current.forEach(clearTimeout)
  }, [])

  const startLoadingSteps = () => {
    stepTimersRef.current.forEach(clearTimeout)
    stepTimersRef.current = []
    setLoadingStep(0)
    const t1 = setTimeout(() => setLoadingStep(1), 8000)
    const t2 = setTimeout(() => setLoadingStep(2), 25000)
    stepTimersRef.current = [t1, t2]
  }

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError('')
    setAnalysis(null)
    startLoadingSteps()

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await res.json()

      if (res.status === 429) {
        throw new Error('⏱️ You\'ve analyzed 3 pages recently. Come back in a few minutes!')
      }

      if (!res.ok) throw new Error(data.error || 'Analysis failed')

      setAnalysis(data)
      // Store only the analyzed URL for the success page (NOT the full analysis)
      sessionStorage.setItem('croroast_url', data.analyzed_url)

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
      stepTimersRef.current.forEach(clearTimeout)
    }
  }

  const handleUnlock = async () => {
    if (!analysis) return
    setCheckingOut(true)
    setError('')

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analyzed_url: analysis.analyzed_url }),
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to start checkout. Please try again.')
      }

      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
      setCheckingOut(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    if (score >= 30) return 'text-orange-400'
    return 'text-red-500'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Pretty Good'
    if (score >= 65) return 'Needs Work'
    if (score >= 45) return 'Losing Money'
    if (score >= 25) return 'Conversion Disaster'
    return 'Start Over'
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">

      {/* Header */}
      <nav className="border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <span className="font-bold text-lg tracking-tight">CROroast</span>
        </div>
        <div className="text-sm text-gray-500">
          AI CRO Audit · $9 Full Report
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-sm text-orange-400 mb-8">
          <span>🔥</span>
          <span>Built for Shopify &amp; WooCommerce stores</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
          Your Store Is{' '}
          <span className="fire-text">Losing Money.</span>
          <br />
          Let&apos;s Find Out Why.
        </h1>

        <p className="text-xl text-gray-400 mb-12 max-w-xl mx-auto leading-relaxed">
          Paste your product page URL. Get a brutal, honest AI audit in 30 seconds.
          Fix your conversion killers. Make more money.
        </p>

        {/* Form */}
        <form onSubmit={handleAnalyze} className="relative max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourstore.com/products/your-product"
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all text-sm"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="sm:w-auto w-full fire-gradient hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap glow-fire"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Roasting...</span>
                </>
              ) : (
                <>
                  <span>🔥</span>
                  <span>Roast My Page</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {LOADING_STEPS.map((step, i) => {
                const isActive = i === loadingStep
                const isDone = i < loadingStep
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500 ${
                      isActive
                        ? 'bg-orange-500/15 border border-orange-500/30 text-orange-300'
                        : isDone
                        ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                        : 'bg-[#111] border border-[#1e1e1e] text-gray-600'
                    }`}
                  >
                    <span className="text-lg">{isDone ? '✅' : step.emoji}</span>
                    <span className="text-sm font-medium">{step.label}</span>
                    {isActive && (
                      <svg className="animate-spin h-3.5 w-3.5 ml-auto shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* Social Proof */}
      {!analysis && (
        <section className="max-w-3xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: '2,400+', label: 'Pages Roasted' },
              { value: '$9', label: 'Full Report' },
              { value: '30s', label: 'Analysis Time' },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
                <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4">
            {[
              { name: 'Alex P.', store: 'Shopify store owner', text: '"Found 3 critical issues I had no idea about. Fixed them in a day, conversion went up 18%."' },
              { name: 'Maria K.', store: 'WooCommerce seller', text: '"Brutal but fair. The AI caught exactly what our designer missed. Worth every penny."' },
            ].map((review) => (
              <div key={review.name} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
                <p className="text-gray-300 text-sm mb-3 italic">{review.text}</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-400">
                    {review.name[0]}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white">{review.name}</span>
                    <span className="text-xs text-gray-500 ml-2">· {review.store}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Results */}
      {analysis && (
        <div ref={resultsRef} className="animate-fade-in">
          <section className="max-w-4xl mx-auto px-6 pb-4">
            <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">

              {/* Score Header */}
              <div className="p-4 sm:p-8 border-b border-[#1e1e1e]">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                  {/* Screenshot */}
                  <div className="w-full md:w-64 shrink-0">
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[#2a2a2a]">
                      <Image
                        src={analysis.screenshot_url}
                        alt="Page screenshot"
                        fill
                        className="object-cover object-top"
                        unoptimized
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-2 truncate">{analysis.analyzed_url}</p>
                  </div>

                  {/* Score */}
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className={`text-7xl font-black tabular-nums ${getScoreColor(analysis.score)}`}>
                        {analysis.score}
                      </span>
                      <span className="text-gray-600 text-2xl font-light">/100</span>
                    </div>
                    <div className={`text-lg font-bold mb-4 ${getScoreColor(analysis.score)}`}>
                      {getScoreLabel(analysis.score)}
                    </div>
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                      <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">🔥 The Roast</p>
                      <p className="text-white font-medium">{analysis.verdict}</p>
                    </div>

                    <div className="mt-4 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                      <p className="text-sm text-red-400 uppercase tracking-wider mb-1">⚠️ Biggest Problem</p>
                      <p className="text-gray-300 text-sm">{analysis.biggest_problem}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Points (3 free) */}
              <div className="p-8">
                <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                  <span>🔍</span> CRO Issues Found ({analysis.total_issues})
                </h2>

                <div className="space-y-4">
                  {analysis.roast_points.map((point) => (
                    <RoastReport key={point.id} point={point} />
                  ))}
                </div>

                {/* Unlock CTA */}
                <div className="relative mt-6">
                  {/* Blurred fake cards for visual effect */}
                  <div className="space-y-4 blur-overlay select-none pointer-events-none">
                    {Array.from({ length: analysis.total_issues - 3 }).map((_, i) => (
                      <div key={i} className="bg-[#161616] border border-[#222] rounded-xl p-5 h-28" />
                    ))}
                  </div>

                  {/* Unlock overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center bg-[#0d0d0d]/95 border border-[#2a2a2a] rounded-2xl p-8 max-w-sm mx-4 backdrop-blur-sm">
                      <div className="text-4xl mb-3">🔒</div>
                      <h3 className="text-xl font-bold mb-2">
                        +{analysis.total_issues - 3} More Issues Found
                      </h3>
                      <p className="text-gray-400 text-sm mb-6">
                        Unlock the full report: all {analysis.total_issues} roast points, 3 quick wins,
                        and your complete fix list.
                      </p>
                      <button
                        onClick={handleUnlock}
                        disabled={checkingOut}
                        className="w-full fire-gradient hover:opacity-90 disabled:opacity-60 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 glow-fire"
                      >
                        {checkingOut ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Redirecting...
                          </>
                        ) : (
                          <>🔥 Unlock Full Report — $9</>
                        )}
                      </button>
                      <p className="text-xs text-gray-600 mt-3">One-time payment · No subscription</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA to analyze another */}
          <div className="max-w-4xl mx-auto px-6 pb-20 pt-6 text-center">
            <button
              onClick={() => { setAnalysis(null); setUrl(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="text-gray-500 hover:text-gray-300 text-sm underline underline-offset-2 transition-colors"
            >
              ↑ Analyze another page
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#111] px-6 py-8 text-center text-sm text-gray-700">
        <span>🔥 CROroast · AI-powered CRO audits for e-commerce stores</span>
      </footer>
    </main>
  )
}
