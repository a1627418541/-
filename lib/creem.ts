import { Creem } from "creem";
import crypto from "crypto";

const isTestMode =
  process.env.CREEM_API_BASE_URL?.includes("test") ??
  process.env.NODE_ENV !== "production";

export const creem = new Creem({
  apiKey: process.env.CREEM_API_KEY!,
  serverIdx: isTestMode ? 1 : 0, // 1 = test, 0 = production
});

const WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET!;

/** 验证 Creem Webhook 签名（header 为 creem-signature） */
export function verifyCreemWebhook(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn("CREEM_WEBHOOK_SECRET not set, skipping verification");
    return true;
  }

  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

/** Creem Webhook 事件结构 */
export interface CreemWebhookEvent {
  id: string;
  eventType: string;
  created_at: number;
  object: CreemSubscription | CreemCheckout | CreemRefund | CreemDispute;
}

/** Subscription 对象 */
export interface CreemSubscription {
  id: string;
  product: CreemProduct;
  customer: CreemCustomer;
  collection_method: string;
  status: string;
  current_period_start_date: string;
  current_period_end_date: string;
  canceled_at?: string | null;
  metadata?: Record<string, string>;
  mode?: string;
}

/** Checkout 对象 */
export interface CreemCheckout {
  id: string;
  customer?: CreemCustomer;
  product?: CreemProduct;
  amount?: number;
  currency?: string;
  status?: string;
  metadata?: Record<string, string>;
}

/** Customer 对象 */
export interface CreemCustomer {
  id: string;
  email: string;
  name?: string;
  country?: string;
  created_at?: number;
  updated_at?: number;
}

/** Product 对象 */
export interface CreemProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billing_type: string;
  billing_period?: string;
  status: string;
  tax_mode?: string;
  tax_category?: string;
}

/** Refund 对象 */
export interface CreemRefund {
  id: string;
  order?: CreemOrder;
  amount: number;
  currency: string;
  status: string;
  created_at?: number;
}

/** Order 对象 */
export interface CreemOrder {
  id: string;
  customer?: CreemCustomer;
  product?: CreemProduct;
  amount: number;
  currency: string;
  status: string;
  type?: string;
}

/** Dispute 对象 */
export interface CreemDispute {
  id: string;
  order?: CreemOrder;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  created_at?: number;
}
