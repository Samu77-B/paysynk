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
  variantId: string;
  productId: string;
  title: string;
  optionsLabel: string;
  kind: "tee" | "tote" | "other";
  priceMinor: number;
  quantity: number;
  maxStock: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  itemCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(storeSlug: string) {
  return `paysynk-cart:${storeSlug}`;
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
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
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
          const existing = prev.find((p) => p.variantId === item.variantId);
          if (existing) {
            return prev.map((p) =>
              p.variantId === item.variantId
                ? {
                    ...p,
                    quantity: Math.min(p.maxStock, p.quantity + qty),
                    maxStock: item.maxStock,
                  }
                : p,
            );
          }
          return [
            ...prev,
            { ...item, quantity: Math.min(item.maxStock, qty) },
          ];
        });
      },
      setQuantity: (variantId, quantity) => {
        setItems((prev) =>
          prev
            .map((p) =>
              p.variantId === variantId
                ? { ...p, quantity: Math.min(p.maxStock, Math.max(0, quantity)) }
                : p,
            )
            .filter((p) => p.quantity > 0),
        );
      },
      removeItem: (variantId) => {
        setItems((prev) => prev.filter((p) => p.variantId !== variantId));
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
