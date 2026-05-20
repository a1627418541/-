import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { creem } from "@/lib/creem";

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { plan } = body as { plan?: "monthly" | "yearly" };

  const productId =
    plan === "yearly"
      ? process.env.CREEM_PRODUCT_YEARLY
      : process.env.CREEM_PRODUCT_MONTHLY;

  if (!productId) {
    return NextResponse.json({ error: "产品未配置" }, { status: 500 });
  }

  try {
    const checkout = await creem.checkouts.create({
      productId,
      customer: {
        email: user.email,
      },
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/profile?success=true`,
      metadata: {
        userId: user.id,
        email: user.email,
        plan: plan || "monthly",
      },
    });

    return NextResponse.json({ url: checkout.checkoutUrl });
  } catch (err: any) {
    console.error("Creem checkout error:", err);
    return NextResponse.json(
      { error: err.message || "创建订单失败" },
      { status: 500 }
    );
  }
}
