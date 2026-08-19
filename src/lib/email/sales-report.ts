import type { SalesReportFrequency } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email/send";
import { salesReportHtml } from "@/lib/email/templates";
import { ownerNotifyEmail } from "@/lib/email/order-emails";
import { resolveAppOrigin } from "@/lib/app-url";

const TZ = "Europe/London";

function londonParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    weekday: get("weekday"),
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
  };
}

function tzOffsetMs(date: Date) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    dtf
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - date.getTime();
}

function londonMidnight(year: number, month: number, day: number) {
  const utc = Date.UTC(year, month - 1, day);
  return new Date(utc - tzOffsetMs(new Date(utc)));
}

function addCalendarDays(year: number, month: number, day: number, delta: number) {
  const utc = new Date(Date.UTC(year, month - 1, day + delta));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

function formatLondonDate(year: number, month: number, day: number) {
  return londonMidnight(year, month, day).toLocaleDateString("en-GB", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function frequenciesDueToday(now = new Date()): SalesReportFrequency[] {
  const { weekday, day } = londonParts(now);
  const due: SalesReportFrequency[] = ["daily"];
  if (weekday === "Mon") due.push("weekly");
  if (day === 1) due.push("monthly");
  return due;
}

export function reportWindow(
  frequency: Exclude<SalesReportFrequency, "none">,
  now = new Date(),
) {
  const loc = londonParts(now);
  if (frequency === "daily") {
    const yesterday = addCalendarDays(loc.year, loc.month, loc.day, -1);
    return {
      start: londonMidnight(yesterday.year, yesterday.month, yesterday.day),
      end: londonMidnight(loc.year, loc.month, loc.day),
      label: `Yesterday (${formatLondonDate(yesterday.year, yesterday.month, yesterday.day)})`,
    };
  }
  if (frequency === "weekly") {
    const startDay = addCalendarDays(loc.year, loc.month, loc.day, -7);
    return {
      start: londonMidnight(startDay.year, startDay.month, startDay.day),
      end: londonMidnight(loc.year, loc.month, loc.day),
      label: "Last 7 days",
    };
  }
  const prev = addCalendarDays(loc.year, loc.month, 1, -1);
  return {
    start: londonMidnight(prev.year, prev.month, 1),
    end: londonMidnight(loc.year, loc.month, 1),
    label: londonMidnight(prev.year, prev.month, 1).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: TZ,
    }),
  };
}

export async function sendDueSalesReports(now = new Date()) {
  const due = frequenciesDueToday(now);
  const stores = await prisma.store.findMany({
    where: { salesReportFrequency: { in: due } },
    include: { users: true },
  });

  const origin = resolveAppOrigin("https://www.paysynk.com");
  let sent = 0;

  for (const store of stores) {
    const to = ownerNotifyEmail(store);
    if (!to || store.salesReportFrequency === "none") continue;
    const window = reportWindow(store.salesReportFrequency, now);
    const orders = await prisma.order.findMany({
      where: {
        storeId: store.id,
        status: { in: ["paid", "fulfilled"] },
        createdAt: { gte: window.start, lt: window.end },
      },
      select: { totalMinor: true },
    });
    const totalMinor = orders.reduce((sum, o) => sum + o.totalMinor, 0);
    const result = await sendMail({
      storeName: store.name,
      to,
      subject: `${store.name} sales report · ${window.label}`,
      html: salesReportHtml({
        storeName: store.name,
        logoUrl: store.logoUrl,
        periodLabel: window.label,
        currency: store.currency,
        orderCount: orders.length,
        totalMinor,
        dashboardUrl: `${origin}/app/orders`,
      }),
    });
    if (result.ok) sent += 1;
  }

  return { stores: stores.length, sent };
}
