import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2024-06-20',
  })
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  try {
    const { analyzed_url } = await req.json()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '🔥 CROroast Full Report',
              description: `Complete CRO audit for ${analyzed_url} — 10 roast points + quick wins`,
              images: ['https://image.thum.io/get/width/600/crop/400/' + analyzed_url],
            },
            unit_amount: 900, // $9.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}?canceled=true`,
      metadata: {
        analyzed_url,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
