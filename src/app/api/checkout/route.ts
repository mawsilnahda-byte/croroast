import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    console.error('STRIPE_SECRET_KEY is not configured')
    return NextResponse.json({ error: 'Payment system unavailable' }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })

  try {
    const { analyzed_url } = await req.json()

    if (!analyzed_url || typeof analyzed_url !== 'string') {
      return NextResponse.json({ error: 'analyzed_url is required' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '🔥 CROroast Full Report',
              description: `Complete CRO audit for ${analyzed_url} — 10 roast points + quick wins`,
            },
            unit_amount: 900, // $9.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}?canceled=true`,
      metadata: {
        analyzed_url: analyzed_url.slice(0, 500), // Stripe metadata 500 char limit
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session. Please try again.' }, { status: 500 })
  }
}
