function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(minor: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);
}

export type EmailLine = {
  title: string;
  quantity: number;
  lineTotalMinor: number;
  options?: string;
};

export type ShippingBits = {
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

function linesHtml(lines: EmailLine[], currency: string) {
  return lines
    .map((line) => {
      const opts = line.options
        ? `<div style="color:#666;font-size:13px">${escapeHtml(line.options)}</div>`
        : "";
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">
          <strong>${escapeHtml(String(line.quantity))}× ${escapeHtml(line.title)}</strong>
          ${opts}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${escapeHtml(money(line.lineTotalMinor, currency))}</td>
      </tr>`;
    })
    .join("");
}

function wrap(storeName: string, logoUrl: string | null, body: string, vatNumber?: string | null) {
  const logo = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(storeName)}" style="max-height:56px;max-width:220px;margin-bottom:16px" />`
    : `<h1 style="margin:0 0 16px;font-size:22px">${escapeHtml(storeName)}</h1>`;
  const vat = vatNumber
    ? `<p style="color:#888;font-size:12px;margin-top:24px">VAT: ${escapeHtml(vatNumber)}</p>`
    : "";
  return `<!doctype html>
<html><body style="margin:0;background:#f4f4f4;font-family:Arial,sans-serif;color:#141414">
  <div style="max-width:560px;margin:24px auto;background:#fff;padding:28px 24px;border-radius:12px">
    ${logo}
    ${body}
    ${vat}
    <p style="color:#aaa;font-size:11px;margin-top:28px">Powered by PaySynk</p>
  </div>
</body></html>`;
}

export function customerOrderHtml(opts: {
  storeName: string;
  logoUrl: string | null;
  vatNumber: string | null;
  orderRef: string;
  currency: string;
  lines: EmailLine[];
  shippingMinor: number;
  discountMinor: number;
  discountLabel?: string | null;
  totalMinor: number;
}) {
  const discount =
    opts.discountMinor > 0
      ? `<tr><td style="padding:8px 0">Discount${opts.discountLabel ? ` (${escapeHtml(opts.discountLabel)})` : ""}</td>
         <td style="padding:8px 0;text-align:right">−${escapeHtml(money(opts.discountMinor, opts.currency))}</td></tr>`
      : "";
  const body = `
    <p>Thanks for your order from <strong>${escapeHtml(opts.storeName)}</strong>.</p>
    <p style="color:#666;font-size:14px">Order ${escapeHtml(opts.orderRef)}</p>
    <table style="width:100%;border-collapse:collapse">${linesHtml(opts.lines, opts.currency)}
      ${discount}
      <tr><td style="padding:8px 0">UK shipping</td>
      <td style="padding:8px 0;text-align:right">${escapeHtml(money(opts.shippingMinor, opts.currency))}</td></tr>
      <tr><td style="padding:12px 0"><strong>Total</strong></td>
      <td style="padding:12px 0;text-align:right"><strong>${escapeHtml(money(opts.totalMinor, opts.currency))}</strong></td></tr>
    </table>
    <p>We’ll get this packed and on its way.</p>
  `;
  return wrap(opts.storeName, opts.logoUrl, body, opts.vatNumber);
}

export function merchantOrderHtml(opts: {
  storeName: string;
  logoUrl: string | null;
  orderRef: string;
  currency: string;
  customerEmail: string | null;
  customerName: string | null;
  lines: EmailLine[];
  shippingMinor: number;
  totalMinor: number;
  shipping?: ShippingBits | null;
  dashboardUrl: string;
}) {
  const who = [opts.customerName, opts.customerEmail].filter(Boolean).join(" · ") || "Customer";
  const ship = opts.shipping
    ? `<p style="margin-top:16px"><strong>Ship to</strong><br/>
        ${escapeHtml(opts.shipping.name || "")}<br/>
        ${escapeHtml(opts.shipping.line1 || "")}<br/>
        ${opts.shipping.line2 ? `${escapeHtml(opts.shipping.line2)}<br/>` : ""}
        ${escapeHtml([opts.shipping.city, opts.shipping.postalCode].filter(Boolean).join(" "))}<br/>
        ${escapeHtml(opts.shipping.country || "")}
       </p>`
    : "";
  const body = `
    <p>New paid order for <strong>${escapeHtml(opts.storeName)}</strong>.</p>
    <p style="color:#666;font-size:14px">Order ${escapeHtml(opts.orderRef)} · ${escapeHtml(who)}</p>
    <table style="width:100%;border-collapse:collapse">${linesHtml(opts.lines, opts.currency)}
      <tr><td style="padding:8px 0">UK shipping</td>
      <td style="padding:8px 0;text-align:right">${escapeHtml(money(opts.shippingMinor, opts.currency))}</td></tr>
      <tr><td style="padding:12px 0"><strong>Total</strong></td>
      <td style="padding:12px 0;text-align:right"><strong>${escapeHtml(money(opts.totalMinor, opts.currency))}</strong></td></tr>
    </table>
    ${ship}
    <p><a href="${escapeHtml(opts.dashboardUrl)}">Open in PaySynk</a></p>
  `;
  return wrap(opts.storeName, opts.logoUrl, body);
}

export function salesReportHtml(opts: {
  storeName: string;
  logoUrl: string | null;
  periodLabel: string;
  currency: string;
  orderCount: number;
  totalMinor: number;
  dashboardUrl: string;
}) {
  const body = `
    <p>Sales report for <strong>${escapeHtml(opts.storeName)}</strong></p>
    <p style="color:#666">${escapeHtml(opts.periodLabel)}</p>
    <p style="font-size:28px;margin:16px 0 4px"><strong>${escapeHtml(money(opts.totalMinor, opts.currency))}</strong></p>
    <p style="color:#666">${opts.orderCount} paid order${opts.orderCount === 1 ? "" : "s"}</p>
    <p><a href="${escapeHtml(opts.dashboardUrl)}">View orders in PaySynk</a></p>
  `;
  return wrap(opts.storeName, opts.logoUrl, body);
}
