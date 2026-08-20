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
import {
  disconnectPaymentProvider,
  savePaymentSettings,
} from "@/lib/dashboard/actions";
import type { Merchant } from "@/types/database";

function connectedLabel(id: string) {
  return id.length > 8 ? `Connected · …${id.slice(-6)}` : `Connected`;
}

export function PaymentsSettings({
  merchant,
  stripeConnectReady,
  paypalConnectReady,
  flash,
}: {
  merchant: Merchant;
  stripeConnectReady: boolean;
  paypalConnectReady: boolean;
  flash?: { connected?: string; error?: string };
}) {
  const [stripeId, setStripeId] = useState(merchant.stripe_connect_id);
  const [paypalId, setPaypalId] = useState(merchant.paypal_merchant_id);
  const [active, setActive] = useState(merchant.payments_active);
  const [message, setMessage] = useState<string | null>(() => {
    if (flash?.error) return flash.error;
    if (flash?.connected === "stripe") {
      return "Stripe is connected. Customer payments will go to that Stripe account.";
    }
    if (flash?.connected === "paypal") {
      return "PayPal is connected. Customer payments will go to that PayPal account.";
    }
    return null;
  });
  const [pending, startTransition] = useTransition();

  const hasPayout = Boolean(stripeId || paypalId);

  function activate() {
    startTransition(async () => {
      setMessage(null);
      const result = await savePaymentSettings({ activate: true });
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setActive(Boolean(result.paymentsActive));
      setMessage("Checkout is live on your shop.");
    });
  }

  function disconnect(provider: "stripe" | "paypal") {
    startTransition(async () => {
      setMessage(null);
      const result = await disconnectPaymentProvider(provider);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      if (provider === "stripe") setStripeId(null);
      else setPaypalId(null);
      const still = provider === "stripe" ? paypalId : stripeId;
      setActive(Boolean(still));
      setMessage(
        provider === "stripe" ? "Stripe disconnected." : "PayPal disconnected.",
      );
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
          Connect Stripe or PayPal with one click. Customers pay you directly —
          PaySynk never holds the funds and never asks for your secret keys.
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
              ? "Your shop is taking payments. Money goes to the account you connected."
              : "Connect an account, then activate checkout on your shop."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 rounded-lg border border-zinc-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">Stripe</p>
                <p className="text-xs text-zinc-500">
                  {stripeId
                    ? connectedLabel(stripeId)
                    : "Sign in to Stripe. Existing accounts work."}
                </p>
              </div>
              {stripeId ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => disconnect("stripe")}
                >
                  Disconnect
                </Button>
              ) : stripeConnectReady ? (
                <Button asChild className="bg-[#635bff] text-white hover:bg-[#554ee0]">
                  <a href="/api/connect/stripe">Connect Stripe</a>
                </Button>
              ) : (
                <p className="text-xs text-zinc-500">
                  Stripe Connect is not enabled on this PaySynk install yet.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-zinc-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">PayPal</p>
                <p className="text-xs text-zinc-500">
                  {paypalId
                    ? connectedLabel(paypalId)
                    : "Sign in to PayPal. Checkout uses PayPal if Stripe is not connected."}
                </p>
              </div>
              {paypalId ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => disconnect("paypal")}
                >
                  Disconnect
                </Button>
              ) : paypalConnectReady ? (
                <Button asChild className="bg-[#0070ba] text-white hover:bg-[#005ea6]">
                  <a href="/api/connect/paypal">Connect PayPal</a>
                </Button>
              ) : (
                <p className="text-xs text-zinc-500">
                  PayPal Connect is not enabled on this PaySynk install yet.
                </p>
              )}
            </div>
          </div>

          {message && (
            <p className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              {message}
            </p>
          )}

          <Button
            disabled={pending || active || !hasPayout}
            onClick={activate}
            className="bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]"
          >
            Activate payments
          </Button>
          {!hasPayout && (
            <p className="text-xs text-zinc-500">
              Connect Stripe or PayPal to turn on the public cart.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
