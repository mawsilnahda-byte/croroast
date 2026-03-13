import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Basic URL validation
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const cleanUrl = parsedUrl.toString()

    // Screenshot via thum.io (free, no API key needed)
    const screenshotUrl = `https://image.thum.io/get/width/1280/crop/900/${cleanUrl}`

    const prompt = `You are a ruthlessly honest CRO (Conversion Rate Optimization) expert who "roasts" e-commerce pages.

Analyze this e-commerce page (${cleanUrl}) from the screenshot and provide a detailed roast focused on conversion optimization for Shopify and WooCommerce stores.

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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: screenshotUrl,
                detail: 'high',
              },
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

    return NextResponse.json({
      ...analysis,
      screenshot_url: screenshotUrl,
      analyzed_url: cleanUrl,
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    )
  }
}
