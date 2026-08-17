"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { savePaymentSettings } from "@/lib/dashboard/actions";
import type { Merchant } from "@/types/database";

export function PaymentsSettings({
  merchant,
}: {
  merchant: Merchant;
}) {
  const [stripeId, setStripeId] = useState(merchant.stripe_connect_id ?? "");
  const [paypalId, setPaypalId] = useState(merchant.paypal_merchant_id ?? "");
  const [active, setActive] = useState(merchant.payments_active);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(activate: boolean) {
    startTransition(async () => {
      setMessage(null);
      const result = await savePaymentSettings({
        stripeConnectId: stripeId,
        paypalMerchantId: paypalId,
        activate,
      });
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setActive(Boolean(result.paymentsActive));
      setMessage("Payment settings saved.");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/settings" className="text-sm text-zinc-500 hover:underline">
          ← Settings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="text-sm text-zinc-500">
          Connect your own processors — PaySynk never holds your customer funds.
          The public shop and cart stay hidden until you Activate.
        </p>
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>Payout status</CardTitle>
            {active ? (
              <Badge className="gap-1 bg-emerald-600">
                <CheckCircle2 className="size-3.5" />
                Payments Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <Circle className="size-3.5" />
                Not connected
              </Badge>
            )}
          </div>
          <CardDescription>
            {active
              ? "Payments Active — funds flow directly to your bank account."
              : "Connect Stripe Connect or PayPal to activate checkout payouts."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Stripe Connect account ID</Label>
            <Input
              placeholder="acct_..."
              value={stripeId}
              onChange={(e) => setStripeId(e.target.value)}
            />
            <p className="text-xs text-zinc-500">
              Production: replace with Stripe Connect OAuth button (
              <code>account_links</code> / Express onboarding).
            </p>
          </div>
          <div className="space-y-2">
            <Label>PayPal merchant ID</Label>
            <Input
              placeholder="PayPal merchant id"
              value={paypalId}
              onChange={(e) => setPaypalId(e.target.value)}
            />
          </div>
          {message && (
            <p className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              {message}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={pending}
              variant="outline"
              onClick={() => save(false)}
            >
              Save keys
            </Button>
            <Button
              disabled={pending}
              onClick={() => save(true)}
              className="bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]"
            >
              Activate payments
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
