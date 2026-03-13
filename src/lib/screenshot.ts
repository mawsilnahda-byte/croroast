/**
 * Full-page screenshot via microlink.io (free tier, no API key needed)
 * Returns a base64 data URL of the screenshot.
 */
export async function captureFullPage(url: string): Promise<{ dataUrl: string; screenshotUrl: string }> {
  const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&fullPage=true`

  let screenshotImgUrl: string | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const res = await fetch(apiUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
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
