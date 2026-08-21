import type { ShippingBits } from "@/lib/email/templates";

export type CheckoutCustomer = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  country: "GB";
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

function clean(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function parseCheckoutCustomer(
  input: unknown,
): { customer?: CheckoutCustomer; error?: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Add your delivery details to continue." };
  }
  const raw = input as Record<string, unknown>;
  const name = clean(raw.name, 80);
  const email = clean(raw.email, 120).toLowerCase();
  const phone = clean(raw.phone, 30);
  const line1 = clean(raw.line1, 100);
  const line2 = clean(raw.line2, 100);
  const city = clean(raw.city, 60);
  const postalCode = clean(raw.postalCode ?? raw.postcode, 12).toUpperCase();

  if (!name) return { error: "Enter the name for delivery." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (phone.replace(/\D/g, "").length < 10) {
    return { error: "Enter a phone number we can reach you on." };
  }
  if (!line1) return { error: "Enter the first line of your address." };
  if (!city) return { error: "Enter a town or city." };
  if (!UK_POSTCODE_RE.test(postalCode)) {
    return { error: "Enter a valid UK postcode." };
  }

  return {
    customer: {
      name,
      email,
      phone,
      line1,
      line2,
      city,
      postalCode,
      country: "GB",
    },
  };
}

export function shippingBitsFromCustomer(
  customer: CheckoutCustomer,
): ShippingBits {
  return {
    name: customer.name,
    phone: customer.phone,
    line1: customer.line1,
    line2: customer.line2 || null,
    city: customer.city,
    postalCode: customer.postalCode,
    country: "GB",
  };
}

export function shippingBitsFromJson(value: unknown): ShippingBits | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const line1 = typeof raw.line1 === "string" ? raw.line1 : "";
  if (!line1 && typeof raw.name !== "string") return null;
  return {
    name: typeof raw.name === "string" ? raw.name : null,
    phone: typeof raw.phone === "string" ? raw.phone : null,
    line1,
    line2: typeof raw.line2 === "string" ? raw.line2 : null,
    city: typeof raw.city === "string" ? raw.city : null,
    postalCode:
      typeof raw.postalCode === "string"
        ? raw.postalCode
        : typeof raw.postcode === "string"
          ? raw.postcode
          : null,
    country: typeof raw.country === "string" ? raw.country : "GB",
  };
}
