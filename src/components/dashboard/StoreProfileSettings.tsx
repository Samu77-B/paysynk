"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveStoreProfileSettings } from "@/lib/dashboard/actions";

type SalesReportFrequency = "none" | "daily" | "weekly" | "monthly";

const REPORT_OPTIONS: { value: SalesReportFrequency; label: string }[] = [
  { value: "none", label: "Off" },
  { value: "daily", label: "Daily (yesterday’s sales, 7am UTC)" },
  { value: "weekly", label: "Weekly (Mondays, last 7 days)" },
  { value: "monthly", label: "Monthly (1st, previous month)" },
];

export function StoreProfileSettings({
  vatNumber,
  notifyEmail,
  ownerEmail,
  salesReportFrequency,
}: {
  vatNumber: string | null;
  notifyEmail: string | null;
  ownerEmail: string;
  salesReportFrequency: SalesReportFrequency;
}) {
  const [vat, setVat] = useState(vatNumber ?? "");
  const [email, setEmail] = useState(notifyEmail ?? "");
  const [frequency, setFrequency] = useState<SalesReportFrequency>(
    salesReportFrequency,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      setMessage(null);
      setError(null);
      const result = await saveStoreProfileSettings({
        vatNumber: vat,
        notifyEmail: email,
        salesReportFrequency: frequency,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setVat(result.vatNumber ?? "");
      setEmail(result.notifyEmail ?? "");
      if (result.salesReportFrequency) {
        setFrequency(result.salesReportFrequency);
      }
      setMessage("Store contact details saved.");
    });
  }

  return (
    <form
      className="space-y-4 border-t border-zinc-200 pt-6"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="notify-email">Order notification email</Label>
        <Input
          id="notify-email"
          type="email"
          autoComplete="email"
          placeholder={ownerEmail || "you@shop.com"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-xs text-zinc-500">
          New paid orders are emailed here. Leave blank to use your login email
          {ownerEmail ? ` (${ownerEmail})` : ""}. Customers reply to this address.
        </p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="vat-number">VAT number</Label>
        <Input
          id="vat-number"
          placeholder="GB123456789"
          value={vat}
          onChange={(e) => setVat(e.target.value)}
        />
        <p className="text-xs text-zinc-500">
          Optional. Shown on customer order emails and the confirmation page.
        </p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="sales-report">Sales reports</Label>
        <select
          id="sales-report"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          value={frequency}
          onChange={(e) =>
            setFrequency(e.target.value as SalesReportFrequency)
          }
        >
          {REPORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-500">
          Sent to the notification email above. Totals paid and fulfilled orders
          in that period.
        </p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save contact details"}
      </Button>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
    </form>
  );
}
