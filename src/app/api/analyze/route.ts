import { NextRequest, NextResponse } from 'next/server'
import { runAnalysis, PreviewAnalysis } from '@/lib/roast'

export const maxDuration = 60 // Vercel: allow up to 60s for OpenAI vision call

// Simple in-memory rate limiter (best-effort on serverless — no cross-instance guarantee)
// Limits per IP: max 3 requests per 10 minutes
const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 3
const RATE_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }

  if (entry.count >= RATE_LIMIT) return true

  entry.count++
  return false
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few minutes before trying again.' },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // URL validation
    let cleanUrl: string
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
      cleanUrl = parsed.toString()
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const full = await runAnalysis(cleanUrl)

    // Return only preview: 3 roast points, no quick_wins
    const preview: PreviewAnalysis = {
      score: full.score,
      verdict: full.verdict,
      biggest_problem: full.biggest_problem,
      roast_points: full.roast_points.slice(0, 3),
      total_issues: full.roast_points.length,
      screenshot_url: full.screenshot_url,
      analyzed_url: full.analyzed_url,
    }

    return NextResponse.json(preview)
  } catch (error) {
    console.error('Analysis error:', error)
    const errMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
