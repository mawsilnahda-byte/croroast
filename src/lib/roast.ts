import OpenAI from 'openai'
import { captureFullPage } from './screenshot'

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

const ROAST_PROMPT = (url: string) => `You are a ruthlessly honest CRO (Conversion Rate Optimization) expert who "roasts" e-commerce pages.

Analyze this e-commerce page (${url}) from the screenshot and provide a detailed roast focused on conversion optimization for Shopify and WooCommerce stores.

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

export async function runAnalysis(url: string): Promise<FullAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  const openai = new OpenAI({ apiKey })

  // Capture full-page screenshot via microlink.io
  const { dataUrl: imageDataUrl, screenshotUrl } = await captureFullPage(url)

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: ROAST_PROMPT(url) },
          {
            type: 'image_url',
            image_url: { url: imageDataUrl, detail: 'high' },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 2000,
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error('No response from OpenAI')

  const analysis = JSON.parse(content)

  // Ensure roast_points is an array and limit to 10
  if (!Array.isArray(analysis.roast_points)) {
    analysis.roast_points = []
  }
  if (!Array.isArray(analysis.quick_wins)) {
    analysis.quick_wins = []
  }

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
