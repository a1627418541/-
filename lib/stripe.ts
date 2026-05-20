import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.includes("your_stripe_secret_key")) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(key, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return _stripe;
}

export const STRIPE_PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY;
export const STRIPE_PRICE_YEARLY = process.env.STRIPE_PRICE_YEARLY;
