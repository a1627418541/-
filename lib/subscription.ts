import { prisma } from "./prisma";

export async function getUserSubscription(userId: string) {
  return prisma.subscription.findUnique({
    where: { userId },
  });
}

export function isSubscriptionActive(subscription: { status: string; currentPeriodEnd: Date } | null): boolean {
  if (!subscription) return false;
  if (subscription.status !== "active" && subscription.status !== "trialing") return false;
  return new Date() < new Date(subscription.currentPeriodEnd);
}
