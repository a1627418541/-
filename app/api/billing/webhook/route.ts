import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

interface StripeSub {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
}

interface StripeInvoice {
  subscription: string | null;
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        const subscriptionId = session.subscription as string;

        if (!userId || !subscriptionId) break;

        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId) as unknown as StripeSub;

        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            status: stripeSub.status,
            plan: plan || "monthly",
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
          },
          update: {
            status: stripeSub.status,
            plan: plan || "monthly",
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
          },
        });

        if (session.amount_total) {
          await prisma.payment.create({
            data: {
              userId,
              subscriptionId: (await prisma.subscription.findUnique({ where: { userId } }))?.id,
              amount: session.amount_total,
              currency: session.currency || "cny",
              status: "success",
              provider: "stripe",
              providerOrderId: session.id,
            },
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as unknown as StripeInvoice;
        const subscriptionId = invoice.subscription;
        if (!subscriptionId) break;

        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId) as unknown as StripeSub;
        const sub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscriptionId },
        });

        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: stripeSub.status,
              currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as StripeInvoice;
        const subscriptionId = invoice.subscription;
        if (!subscriptionId) break;

        const sub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscriptionId },
        });

        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "past_due" },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSub = event.data.object as unknown as StripeSub;
        const sub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: stripeSub.id },
        });

        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "canceled" },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const stripeSub = event.data.object as unknown as StripeSub;
        const sub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: stripeSub.id },
        });

        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: stripeSub.status,
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
              currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handling error:", err);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
