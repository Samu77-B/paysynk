import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSmartSynkAuth } from "@/lib/smartsynk-auth";

export async function GET(request: Request) {
  const denied = requireSmartSynkAuth(request);
  if (denied) return denied;

  const [stores, pending, approved, rejected, ordersMonth] = await Promise.all([
    prisma.store.count(),
    prisma.store.count({ where: { signupStatus: "pending" } }),
    prisma.store.count({ where: { signupStatus: "approved" } }),
    prisma.store.count({ where: { signupStatus: "rejected" } }),
    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
        status: { in: ["paid", "fulfilled"] },
      },
      _sum: { totalMinor: true },
      _count: true,
    }),
  ]);

  return NextResponse.json({
    platform: "paysynk",
    health: "operational",
    stores: { total: stores, pending, approved, rejected },
    ordersThisMonth: ordersMonth._count,
    revenueThisMonthMinor: ordersMonth._sum.totalMinor ?? 0,
  });
}
