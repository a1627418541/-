import { NextRequest, NextResponse } from "next/server";
import { verifyCreemWebhook, type CreemWebhookEvent, type CreemSubscription } from "@/lib/creem";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("creem-signature") || "";

  if (!verifyCreemWebhook(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: CreemWebhookEvent;
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const { eventType, object } = event;

    switch (eventType) {
      case "checkout.completed": {
        const checkout = object as any;
        const userId = checkout.metadata?.userId;
        const plan = checkout.metadata?.plan || "monthly";

        if (!userId) {
          console.warn("Creem webhook missing userId in metadata");
          return NextResponse.json({ received: true });
        }

        // checkout.completed 不一定有 subscription，等 subscription.active 再写入
        break;
      }

      case "subscription.active":
      case "subscription.paid": {
        const subscription = object as CreemSubscription;
        const userId = subscription.metadata?.userId;
        const plan = subscription.metadata?.plan || "monthly";

        if (!userId) {
          console.warn("Creem webhook missing userId in subscription metadata");
          return NextResponse.json({ received: true });
        }

        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            status: "active",
            plan,
            currentPeriodStart: subscription.current_period_start_date
              ? new Date(subscription.current_period_start_date)
              : new Date(),
            currentPeriodEnd: subscription.current_period_end_date
              ? new Date(subscription.current_period_end_date)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            stripeCustomerId: null,
            stripeSubscriptionId: subscription.id,
          },
          update: {
            status: "active",
            plan,
            currentPeriodStart: subscription.current_period_start_date
              ? new Date(subscription.current_period_start_date)
              : new Date(),
            currentPeriodEnd: subscription.current_period_end_date
              ? new Date(subscription.current_period_end_date)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            stripeSubscriptionId: subscription.id,
          },
        });

        // 记录支付
        const amount = subscription.product?.price;
        if (amount) {
          const sub = await prisma.subscription.findUnique({ where: { userId } });
          await prisma.payment.create({
            data: {
              userId,
              subscriptionId: sub?.id,
              amount: Math.round(amount * 100), // 转为分
              currency: subscription.product?.currency || "cny",
              status: "success",
              provider: "creem",
              providerOrderId: subscription.id,
            },
          });
        }
        break;
      }

      case "subscription.canceled": {
        const subscription = object as CreemSubscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        await prisma.subscription.updateMany({
          where: { userId },
          data: { status: "canceled" },
        });
        break;
      }

      case "subscription.scheduled_cancel": {
        const subscription = object as CreemSubscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        await prisma.subscription.updateMany({
          where: { userId },
          data: { cancelAtPeriodEnd: true },
        });
        break;
      }

      case "subscription.past_due":
      case "subscription.expired": {
        const subscription = object as CreemSubscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        await prisma.subscription.updateMany({
          where: { userId },
          data: {
            status: eventType === "subscription.past_due" ? "past_due" : "canceled",
          },
        });
        break;
      }

      case "subscription.update": {
        const subscription = object as CreemSubscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        await prisma.subscription.updateMany({
          where: { userId },
          data: {
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start_date
              ? new Date(subscription.current_period_start_date)
              : undefined,
            currentPeriodEnd: subscription.current_period_end_date
              ? new Date(subscription.current_period_end_date)
              : undefined,
          },
        });
        break;
      }

      case "subscription.trialing": {
        const subscription = object as CreemSubscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            status: "trialing",
            plan: subscription.metadata?.plan || "monthly",
            currentPeriodStart: subscription.current_period_start_date
              ? new Date(subscription.current_period_start_date)
              : new Date(),
            currentPeriodEnd: subscription.current_period_end_date
              ? new Date(subscription.current_period_end_date)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            stripeCustomerId: null,
            stripeSubscriptionId: subscription.id,
          },
          update: {
            status: "trialing",
            currentPeriodStart: subscription.current_period_start_date
              ? new Date(subscription.current_period_start_date)
              : new Date(),
            currentPeriodEnd: subscription.current_period_end_date
              ? new Date(subscription.current_period_end_date)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
        break;
      }

      case "subscription.paused": {
        const subscription = object as CreemSubscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        await prisma.subscription.updateMany({
          where: { userId },
          data: { status: "paused" },
        });
        break;
      }

      case "refund.created": {
        const refund = object as any;
        console.log("Creem refund created:", refund.id);
        break;
      }

      case "dispute.created": {
        const dispute = object as any;
        console.log("Creem dispute created:", dispute.id);
        break;
      }
    }
  } catch (err) {
    console.error("Creem webhook handling error:", err);
    return NextResponse.json(
      { error: "Webhook handling failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
