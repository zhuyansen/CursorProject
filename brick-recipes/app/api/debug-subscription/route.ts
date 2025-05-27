import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('id');
    
    if (!subscriptionId) {
      return NextResponse.json({
        error: '请提供subscription ID',
        example: '/api/debug-subscription?id=sub_xxx'
      }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    return NextResponse.json({
      id: subscription.id,
      status: subscription.status,
      current_period_start: (subscription as any).current_period_start,
      current_period_end: (subscription as any).current_period_end,
      metadata: subscription.metadata,
      items: subscription.items.data.map(item => ({
        price_id: item.price.id,
        price_type: item.price.type,
      })),
      customer: subscription.customer,
      created: subscription.created,
      start_date: (subscription as any).start_date,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 