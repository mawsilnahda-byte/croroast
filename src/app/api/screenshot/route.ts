import { NextRequest, NextResponse } from 'next/server'
import { getScreenshotUrl } from '@/lib/screenshot'

export const maxDuration = 10

/**
 * GET /api/screenshot?url=https://example.com
 * Returns the screenshot URL (via thum.io). Client can use it as <img src>.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'url parameter is required' }, { status: 400 })
  }

  let cleanUrl: string
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    cleanUrl = parsed.toString()
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const screenshotUrl = getScreenshotUrl(cleanUrl)

  return NextResponse.json({ screenshotUrl })
}
