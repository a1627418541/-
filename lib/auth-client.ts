import { createAuthClient } from "better-auth/react";

function getBaseURL(): string {
  // 客户端：用当前页面域名（支持 Vercel 预览部署）
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // SSR： fallback 到环境变量
  return (
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000"
  );
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});
