import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { runAnalysis } from '@/lib/roast'

export const maxDuration = 60 // Vercel: allow up to 60s for OpenAI vision call

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'Payment system unavailable' }, { status: 500 })
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })

  try {
    // Verify payment with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed. Please complete your purchase first.' },
        { status: 402 }
      )
    }

    const analyzedUrl = session.metadata?.analyzed_url
    if (!analyzedUrl) {
      return NextResponse.json(
        { error: 'Could not find the URL associated with this payment.' },
        { status: 400 }
      )
    }

    // Run full analysis (all 10 points + quick wins)
    const fullAnalysis = await runAnalysis(analyzedUrl)

    return NextResponse.json(fullAnalysis)
  } catch (error) {
    console.error('Unlock error:', error)
    const message =
      error instanceof Error && error.message.includes('No such checkout')
        ? 'Invalid payment session.'
        : 'Failed to retrieve your report. Please try again.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
