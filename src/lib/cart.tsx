"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  cartKey: string;
  variantId: string | null;
  productId: string;
  title: string;
  optionsLabel: string;
  kind: "tee" | "tote" | "other";
  priceMinor: number;
  quantity: number;
  maxStock: number;
  configProductId?: string;
  selections?: Record<string, string>;
  files?: string[];
  instructions?: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity" | "cartKey"> & { cartKey?: string }, qty?: number) => void;
  setQuantity: (cartKey: string, quantity: number) => void;
  removeItem: (cartKey: string) => void;
  clear: () => void;
  itemCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(storeSlug: string) {
  return `paysynk-cart:${storeSlug}`;
}

function normalizeItem(raw: CartItem & { variantId?: string | null }): CartItem {
  const variantId = raw.variantId ?? null;
  return {
    ...raw,
    variantId,
    cartKey:
      raw.cartKey ||
      variantId ||
      raw.configProductId ||
      `line-${raw.productId}`,
  };
}

export function CartProvider({
  storeSlug,
  children,
}: {
  storeSlug: string;
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(storeSlug));
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        setItems(parsed.map(normalizeItem));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [storeSlug]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey(storeSlug), JSON.stringify(items));
  }, [items, storeSlug, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      addItem: (item, qty = 1) => {
        setItems((prev) => {
          const cartKey =
            item.cartKey ||
            (item.configProductId
              ? `cfg-${item.configProductId}-${Date.now()}`
              : item.variantId || `line-${item.productId}`);
          const normalized: CartItem = {
            ...item,
            cartKey,
            variantId: item.variantId ?? null,
            quantity: 0,
            maxStock: item.maxStock,
          };
          if (!item.configProductId && item.variantId) {
            const existing = prev.find((p) => p.variantId === item.variantId);
            if (existing) {
              return prev.map((p) =>
                p.variantId === item.variantId
                  ? {
                      ...p,
                      quantity: Math.min(p.maxStock, p.quantity + qty),
                      maxStock: item.maxStock,
                      priceMinor: item.priceMinor,
                    }
                  : p,
              );
            }
          }
          return [
            ...prev,
            {
              ...normalized,
              quantity: Math.min(normalized.maxStock, qty),
            },
          ];
        });
      },
      setQuantity: (cartKey, quantity) => {
        setItems((prev) =>
          prev
            .map((p) =>
              p.cartKey === cartKey
                ? { ...p, quantity: Math.min(p.maxStock, Math.max(0, quantity)) }
                : p,
            )
            .filter((p) => p.quantity > 0),
        );
      },
      removeItem: (cartKey) => {
        setItems((prev) => prev.filter((p) => p.cartKey !== cartKey));
      },
      clear: () => setItems([]),
      itemCount: items.reduce((n, i) => n + i.quantity, 0),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function toCheckoutItem(item: CartItem) {
  if (item.configProductId) {
    return {
      configProductId: item.configProductId,
      selections: item.selections ?? {},
      files: item.files ?? [],
      instructions: item.instructions ?? "",
      quantity: item.quantity,
    };
  }
  return {
    variantId: item.variantId as string,
    quantity: item.quantity,
  };
}
