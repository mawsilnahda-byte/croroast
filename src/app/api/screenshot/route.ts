import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

/**
 * Full-page screenshot endpoint using Puppeteer + @sparticuz/chromium-min
 * GET /api/screenshot?url=https://example.com
 * Returns JSON: { imageBase64: string, contentType: string }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'url parameter is required' }, { status: 400 })
  }

  // Validate URL
  let cleanUrl: string
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    cleanUrl = parsed.toString()
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  let browser = null
  try {
    // Dynamically import to avoid bundling issues
    const chromium = (await import('@sparticuz/chromium-min')).default
    const puppeteer = (await import('puppeteer-core')).default

    // chromium-min downloads the binary on first run
    const executablePath = await chromium.executablePath(
      'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
    )

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 900 },
      executablePath,
      headless: true,
    })

    const page = await browser.newPage()

    // Set viewport for 1280px wide capture
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 })

    // Block heavy resources to speed up load
    await page.setRequestInterception(true)
    page.on('request', (req) => {
      const type = req.resourceType()
      if (['font', 'media'].includes(type)) req.abort()
      else req.continue()
    })

    // Navigate
    await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 20000 })

    // Wait for initial render
    await new Promise((r) => setTimeout(r, 3000))

    // Scroll to bottom slowly to trigger lazy-loaded images
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        const distance = 400
        const delay = 120
        const timer = setInterval(() => {
          window.scrollBy(0, distance)
          if ((window.scrollY + window.innerHeight) >= document.body.scrollHeight) {
            clearInterval(timer)
            resolve()
          }
        }, delay)
      })
    })

    // Wait for lazy content to load
    await new Promise((r) => setTimeout(r, 2000))

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0))
    await new Promise((r) => setTimeout(r, 500))

    // Take full-page screenshot
    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      type: 'jpeg',
      quality: 82,
    })

    const base64 = Buffer.from(screenshotBuffer).toString('base64')

    return NextResponse.json({
      imageBase64: `data:image/jpeg;base64,${base64}`,
      screenshotUrl: null, // no hosted URL, using base64 directly
    })
  } catch (error) {
    console.error('Puppeteer screenshot error:', error)
    return NextResponse.json(
      { error: `Screenshot failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  } finally {
    if (browser) {
      try {
        await browser.close()
      } catch {
        // ignore cleanup errors
      }
    }
  }
}
