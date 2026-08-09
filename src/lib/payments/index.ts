import type { PaymentProviderType } from "@/generated/prisma/client";
import { FacPaymentProvider } from "./fac";
import { StripePaymentProvider } from "./stripe";
import type { PaymentProvider } from "./types";

export type { CreateCheckoutInput, CreateCheckoutResult, PaymentProvider } from "./types";
export { StripePaymentProvider } from "./stripe";
export { FacPaymentProvider } from "./fac";
export { getStripe } from "./stripe";

export function getPaymentProvider(
  provider: PaymentProviderType,
): PaymentProvider {
  switch (provider) {
    case "stripe":
      return new StripePaymentProvider();
    case "fac":
      return new FacPaymentProvider();
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unknown payment provider: ${_exhaustive}`);
    }
  }
}
