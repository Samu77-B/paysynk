const MAX_NAME = 80;

/** Links, bare domains, and markup. Spam signups paste these into the name fields. */
const LINK_IN_NAME =
  /(?:https?:\/\/|www\.)|(?:[a-z0-9-]+\.)+(?:com|net|org|info|biz|ru|xyz|top|click|link|shop|site|online|live|app|io|me|co|uk|gg|ly|gl|to|cc|tv)\b|[<>]/i;

function plainName(value: string): string | null {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > MAX_NAME) return null;
  if (LINK_IN_NAME.test(name)) return null;
  return name;
}

export function cleanPersonName(value: string): string | null {
  return plainName(value);
}

export function cleanStoreName(value: string): string | null {
  return plainName(value);
}
