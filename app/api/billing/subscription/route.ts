import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { creem } from "@/lib/creem";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json({ subscription });
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });

  if (!subscription?.stripeSubscriptionId) {
    return NextResponse.json({ error: "无有效订阅" }, { status: 400 });
  }

  try {
    if (subscription.stripeCustomerId) {
      // Stripe 订阅
      await getStripe().subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      // Creem 订阅
      await creem.subscriptions.cancel(subscription.stripeSubscriptionId, {
        mode: "scheduled",
      });
    }
  } catch (err: any) {
    console.error("Cancel subscription error:", err);
    return NextResponse.json(
      { error: err.message || "取消订阅失败" },
      { status: 500 }
    );
  }

  await prisma.subscription.update({
    where: { userId: user.id },
    data: { cancelAtPeriodEnd: true },
  });

  return NextResponse.json({ success: true });
}
