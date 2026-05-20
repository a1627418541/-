import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { stripe, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_YEARLY } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { plan } = body as { plan?: "monthly" | "yearly" };

  if (!plan || (plan !== "monthly" && plan !== "yearly")) {
    return NextResponse.json({ error: "无效的套餐" }, { status: 400 });
  }

  const priceId = plan === "monthly" ? STRIPE_PRICE_MONTHLY : STRIPE_PRICE_YEARLY;
  if (!priceId) {
    return NextResponse.json({ error: "价格未配置" }, { status: 500 });
  }

  // 查找或创建 Stripe Customer
  let subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });

  let customerId = subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
  }

  // 创建 Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/profile?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing?canceled=true`,
    metadata: {
      userId: user.id,
      plan,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        plan,
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
