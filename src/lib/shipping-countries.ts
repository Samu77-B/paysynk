/** ISO countries Stripe Checkout can collect shipping for, excluding GB. */
export const INTERNATIONAL_SHIPPING_COUNTRIES: Array<{
  code: string;
  name: string;
}> = [
  { code: "IE", name: "Ireland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "PT", name: "Portugal" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "AT", name: "Austria" },
  { code: "CH", name: "Switzerland" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czechia" },
  { code: "GR", name: "Greece" },
  { code: "JP", name: "Japan" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "ZA", name: "South Africa" },
  { code: "JM", name: "Jamaica" },
];

const INTL_CODES = new Set(
  INTERNATIONAL_SHIPPING_COUNTRIES.map((row) => row.code),
);

export function isUkCountry(code: string) {
  return code.toUpperCase() === "GB";
}

export function storeHomeCountry(code: string | null | undefined) {
  return (code || "GB").toUpperCase();
}

export function isDomesticCountry(customerCountry: string, homeCountry: string) {
  return customerCountry.toUpperCase() === storeHomeCountry(homeCountry);
}

export function internationalCountriesForStore(homeCountry: string) {
  const home = storeHomeCountry(homeCountry);
  const rows = [...INTERNATIONAL_SHIPPING_COUNTRIES];
  if (home !== "GB" && !rows.some((r) => r.code === "GB")) {
    rows.unshift({ code: "GB", name: "United Kingdom" });
  }
  return rows.filter((r) => r.code !== home);
}

export function isIntlShippingCountry(code: string) {
  return INTL_CODES.has(code.toUpperCase());
}

export function shippingAllowedCountries(
  destination: "gb" | "international",
  country: string,
): string[] {
  if (destination === "gb" || isUkCountry(country)) return ["GB"];
  const code = country.toUpperCase();
  return isIntlShippingCountry(code) ? [code] : ["IE"];
}
