"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { addServiceLoyaltyPoints } from "@/lib/dashboard/actions";
import type { DashboardLoyaltyMember } from "@/lib/dashboard/data";

export function PointsManager({
  initialMembers,
  productPts,
  servicePts,
}: {
  initialMembers: DashboardLoyaltyMember[];
  productPts: number;
  servicePts: number;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (row) =>
        row.email.includes(q) ||
        (row.name || "").toLowerCase().includes(q),
    );
  }, [members, query]);

  function addVisit() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await addServiceLoyaltyPoints({
        email,
        name,
        amountPounds: Number(amount),
        note,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(
        `Added ${result.points} pts. Balance ${result.balance}.`,
      );
      setAmount("");
      setNote("");
      const key = email.trim().toLowerCase();
      setMembers((prev) => {
        const existing = prev.find((row) => row.email === key);
        if (existing) {
          return prev.map((row) =>
            row.email === key
              ? { ...row, name: name.trim() || row.name, balance: result.balance ?? row.balance }
              : row,
          );
        }
        return [
          {
            id: `tmp-${key}`,
            email: key,
            name: name.trim() || null,
            phone: null,
            balance: result.balance ?? 0,
            joinedAt: new Date().toISOString(),
          },
          ...prev,
        ];
      });
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Points</h1>
        <p className="text-sm text-zinc-500">
          £1 products = {productPts} pt{productPts === 1 ? "" : "s"} · £1 services ={" "}
          {servicePts} pt{servicePts === 1 ? "" : "s"}. Product orders credit
          themselves; log salon visits here if SalonSynk has not posted yet.
        </p>
      </div>

      <form
        className="grid gap-3 rounded-xl border border-zinc-200 p-4 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          addVisit();
        }}
      >
        <div className="space-y-1 lg:col-span-1">
          <Label htmlFor="svc-email">Client email</Label>
          <Input
            id="svc-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="svc-name">Name</Label>
          <Input
            id="svc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="svc-amount">Service £</Label>
          <Input
            id="svc-amount"
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="svc-note">Note</Label>
          <Input
            id="svc-note"
            placeholder="Cut & colour"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            disabled={pending}
            className="w-full bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]"
          >
            {pending ? "Adding…" : "Add service pts"}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-red-700 sm:col-span-2 lg:col-span-5">{error}</p>
        )}
        {message && (
          <p className="text-sm text-emerald-700 sm:col-span-2 lg:col-span-5">
            {message}
          </p>
        )}
      </form>

      <div className="space-y-3">
        <Input
          placeholder="Search email or name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-zinc-500">
                    No members yet. They join at checkout or on the website form.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name || "—"}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell className="text-right font-medium">
                      {row.balance}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
