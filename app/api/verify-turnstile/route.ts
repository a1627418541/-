import { NextRequest, NextResponse } from "next/server";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function POST(request: NextRequest) {
  const { token } = await request.json().catch(() => ({}));

  if (!token) {
    return NextResponse.json({ error: "缺少验证令牌" }, { status: 400 });
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "验证服务未配置" }, { status: 500 });
  }

  const verifyResponse = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
      }),
    }
  );

  const result: TurnstileVerifyResponse = await verifyResponse.json();

  if (!result.success) {
    console.error("[Turnstile verify failed]", result["error-codes"], "hostname:", result.hostname);
    return NextResponse.json(
      { error: "人机验证失败，请重试", details: result["error-codes"] },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
