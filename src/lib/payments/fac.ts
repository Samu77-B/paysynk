import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProvider,
} from "./types";

/**
 * FAC / PowerTranz (Jamaica) — stub for future implementation.
 * TODO: Implement hosted payment page + webhook/callback verification.
 */
export class FacPaymentProvider implements PaymentProvider {
  async createCheckout(
    _input: CreateCheckoutInput,
  ): Promise<CreateCheckoutResult> {
    throw new Error(
      "FacPaymentProvider is not implemented yet. Use paymentProvider: stripe for now.",
    );
  }
}
