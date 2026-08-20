import type { PaymentProviderType } from "@/generated/prisma/client";
import { FacPaymentProvider } from "./fac";
import { PaypalPaymentProvider } from "./paypal";
import { StripePaymentProvider } from "./stripe";
import type { PaymentProvider } from "./types";

export type { CreateCheckoutInput, CreateCheckoutResult, PaymentProvider } from "./types";
export { StripePaymentProvider } from "./stripe";
export { FacPaymentProvider } from "./fac";
export { PaypalPaymentProvider } from "./paypal";
export { getStripe } from "./stripe";

export function getPaymentProvider(
  provider: PaymentProviderType,
): PaymentProvider {
  switch (provider) {
    case "stripe":
      return new StripePaymentProvider();
    case "paypal":
      return new PaypalPaymentProvider();
    case "fac":
      return new FacPaymentProvider();
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unknown payment provider: ${_exhaustive}`);
    }
  }
}
