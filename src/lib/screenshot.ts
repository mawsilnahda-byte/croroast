/**
 * Screenshot utilities — kept for potential future use.
 * Primary analysis flow now uses thum.io URLs directly (see roast.ts).
 */

/**
 * Returns a full-page screenshot URL for a given page.
 * Uses thum.io: free, synchronous, no API key required, full-page support.
 * OpenAI can fetch this URL directly — no base64 download needed.
 */
export function getScreenshotUrl(url: string): string {
  return `https://image.thum.io/get/width/1280/fullpage/noanimate/${url}`
}
