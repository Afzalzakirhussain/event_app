import Stripe  from 'stripe'
import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/actions/order.actions'
import { updateEventTickets } from '@/lib/actions/event.actions'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16', // Use the latest API version
})

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') as string
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
 
  } catch (err) {
    return NextResponse.json({ message: 'Webhook error', error: err })
  }

  const eventType = event.type

  // CREATE
  if (eventType === 'checkout.session.completed') {
    const { id, amount_total, metadata } = event.data.object as Stripe.Checkout.Session
    console.log(event.data.object, "event.data.object");
    console.log(event, "event");

      const session = await stripe.checkout.sessions.retrieve(id, {
        expand: ['line_items'],
      });
      const quantity = session.line_items?.data[0]?.quantity || 1;
    const order = {
      stripeId: id,
      eventId: metadata?.eventId || '',
      buyerId: metadata?.buyerId || '',
      quantity: quantity,
      totalAmount: amount_total ? (amount_total / 100).toString() : '0',
      createdAt: new Date(),
    }

    try {
      const newOrder = await createOrder(order)
      if (order.eventId) {
        await updateEventTickets(order.eventId, quantity)
      }

      return NextResponse.json({ message: 'OK', order: newOrder })
    } catch (error) {
      console.error('Error processing order:', error)
      return NextResponse.json({ message: 'Error processing order', error: error }, { status: 500 })
   
    }
  }

  return new Response('', { status: 200 })
}
