import OpenAI from 'openai'

export interface RoastPoint {
  id: number
  category: string
  emoji: string
  issue: string
  impact: 'high' | 'medium' | 'low'
  fix: string
}

export interface FullAnalysis {
  score: number
  verdict: string
  biggest_problem: string
  roast_points: RoastPoint[]
  quick_wins: string[]
  screenshot_url: string
  analyzed_url: string
}

export interface PreviewAnalysis {
  score: number
  verdict: string
  biggest_problem: string
  roast_points: RoastPoint[] // only first 3
  total_issues: number
  screenshot_url: string
  analyzed_url: string
}

const ROAST_PROMPT = (url: string, htmlContent: string) =>
  `You are a ruthlessly honest CRO (Conversion Rate Optimization) expert who "roasts" e-commerce pages.

Analyze this e-commerce page (${url}) based on its HTML content below. Focus on conversion optimization for Shopify and WooCommerce stores.

HTML CONTENT:
---
${htmlContent}
---

Return ONLY a valid JSON object with this exact structure:
{
  "score": <number 0-100, be harsh and realistic>,
  "verdict": "<one punchy, brutal but constructive sentence — max 20 words>",
  "biggest_problem": "<the single #1 thing killing their conversion rate>",
  "roast_points": [
    {
      "id": 1,
      "category": "<category: CTA | Social Proof | Trust Signals | Product Images | Copy | Pricing | Urgency | Mobile | Page Speed | Checkout>",
      "emoji": "<relevant emoji>",
      "issue": "<specific, concrete problem observed on THIS page>",
      "impact": "high|medium|low",
      "fix": "<specific, actionable recommendation — what exactly to change>"
    }
  ],
  "quick_wins": [
    "<quick win 1 — can be done in under 1 hour>",
    "<quick win 2>",
    "<quick win 3>"
  ]
}

Provide exactly 10 roast_points. Cover all 10 categories. Be specific to what you see, not generic advice.
Score harshly: average stores get 40-60. Great stores get 70-85. Only legendary stores get 85+.`

/**
 * Fetches and extracts meaningful text content from a URL.
 * Strips scripts, styles, and boilerplate to keep only relevant HTML.
 */
async function fetchPageContent(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(7000),
  })

  if (!res.ok) throw new Error(`Failed to fetch page: HTTP ${res.status}`)

  const html = await res.text()

  // Strip scripts, styles, SVGs, comments
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  // Limit to ~8000 chars to stay within GPT token budget
  return stripped.slice(0, 8000)
}

/**
 * Returns a screenshot URL for display purposes only (loaded async by browser).
 * Not used for OpenAI analysis — thum.io can be slow on first render.
 */
function getScreenshotUrl(url: string): string {
  return `https://image.thum.io/get/width/1280/fullpage/noanimate/${url}`
}

export async function runAnalysis(url: string): Promise<FullAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  const openai = new OpenAI({ apiKey })

  // Fetch page content for analysis (fast, <7s)
  const htmlContent = await fetchPageContent(url)

  // Screenshot URL for display only — browser loads this async after analysis
  const screenshotUrl = getScreenshotUrl(url)

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: ROAST_PROMPT(url, htmlContent),
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 2000,
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error('No response from OpenAI')

  const analysis = JSON.parse(content)

  if (!Array.isArray(analysis.roast_points)) analysis.roast_points = []
  if (!Array.isArray(analysis.quick_wins)) analysis.quick_wins = []

  return {
    score: typeof analysis.score === 'number' ? analysis.score : 50,
    verdict: analysis.verdict || 'No verdict available.',
    biggest_problem: analysis.biggest_problem || 'Could not determine.',
    roast_points: analysis.roast_points.slice(0, 10),
    quick_wins: analysis.quick_wins.slice(0, 5),
    screenshot_url: screenshotUrl,
    analyzed_url: url,
  }
}
