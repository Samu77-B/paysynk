export type CheckoutLineInput = {
  variantId: string;
  quantity: number;
};

export type CreateCheckoutInput = {
  storeId: string;
  storeSlug: string;
  currency: string;
  orderId: string;
  /** Final amounts already recomputed server-side */
  subtotalMinor: number;
  shippingMinor: number;
  totalMinor: number;
  shippingLabel?: string;
  lines: Array<{
    name: string;
    quantity: number;
    unitAmountMinor: number;
    /** Exact line total after bundle allocation (preferred for Stripe) */
    lineTotalMinor: number;
  }>;
  /** Informational — discount is already baked into line unit amounts */
  discountMinor?: number;
  discountLabel?: string;
  bundlePairs?: number;
  successUrl: string;
  cancelUrl: string;
  /** PayPal capture return (optional). */
  completeUrl?: string;
  storeName?: string;
  stripeAccountId?: string | null;
  paypalMerchantId?: string | null;
  metadata?: Record<string, string>;
  customer?: {
    name: string;
    email: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: "GB";
  };
};

export type CreateCheckoutResult = {
  redirectUrl: string;
  providerPaymentId: string;
};

export interface PaymentProvider {
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
}
