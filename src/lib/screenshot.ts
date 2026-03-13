/**
 * Full-page screenshot capture.
 * Primary: Puppeteer via /api/screenshot (full-page, 1280px wide)
 * Fallback: microlink.io (free tier, no API key needed)
 */
export async function captureFullPage(url: string): Promise<{ dataUrl: string; screenshotUrl: string }> {
  // Try Puppeteer via internal API first
  try {
    const puppeteerResult = await captureViaPuppeteer(url)
    if (puppeteerResult) return puppeteerResult
  } catch (err) {
    console.warn('Puppeteer screenshot failed, falling back to microlink.io:', err)
  }

  // Fallback: microlink.io
  return captureFallback(url)
}

/**
 * Attempt full-page screenshot via Puppeteer API endpoint.
 */
async function captureViaPuppeteer(url: string): Promise<{ dataUrl: string; screenshotUrl: string } | null> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const apiUrl = `${appUrl}/api/screenshot?url=${encodeURIComponent(url)}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000)

  try {
    const res = await fetch(apiUrl, { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) return null

    const json = await res.json()

    if (json.imageBase64) {
      return {
        dataUrl: json.imageBase64,
        screenshotUrl: url, // we store the original page URL since base64 has no hosted URL
      }
    }

    return null
  } catch {
    clearTimeout(timeout)
    return null
  }
}

/**
 * Fallback: microlink.io free API (full page support).
 */
async function captureFallback(url: string): Promise<{ dataUrl: string; screenshotUrl: string }> {
  const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&fullPage=true`

  let screenshotImgUrl: string | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const res = await fetch(apiUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      clearTimeout(timeout)

      if (!res.ok) throw new Error(`Microlink API HTTP ${res.status}`)

      const json = await res.json()

      if (json.status === 'success' && json.data?.screenshot?.url) {
        screenshotImgUrl = json.data.screenshot.url
        break
      }

      // status may be 'queued' or 'processing' — wait and retry
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 3000))
    } catch (err) {
      if (attempt === 3) throw new Error(`Microlink screenshot failed after 3 attempts: ${err}`)
      await new Promise((r) => setTimeout(r, attempt * 2000))
    }
  }

  if (!screenshotImgUrl) {
    throw new Error('Could not obtain screenshot URL from microlink.io')
  }

  // Fetch the image and convert to base64
  const imgRes = await fetch(screenshotImgUrl)
  if (!imgRes.ok) throw new Error(`Failed to fetch screenshot image: HTTP ${imgRes.status}`)

  const buffer = await imgRes.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const contentType = imgRes.headers.get('content-type') || 'image/jpeg'

  return {
    dataUrl: `data:${contentType};base64,${base64}`,
    screenshotUrl: screenshotImgUrl,
  }
}
