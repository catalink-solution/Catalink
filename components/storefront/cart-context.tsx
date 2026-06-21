"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  size: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, size: string | null, quantity: number) => void;
  removeItem: (productId: string, size: string | null) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(slug: string) {
  return `catalink_cart_${slug}`;
}

function sameLine(a: CartItem, productId: string, size: string | null) {
  return a.productId === productId && (a.size ?? "") === (size ?? "");
}

export function CartProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(slug));
      setItems(raw ? (JSON.parse(raw) as CartItem[]) : []);
    } catch {
      setItems([]);
    }
    setHydrated(true);
  }, [slug]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey(slug), JSON.stringify(items));
    } catch {
      /* ignore quota errors */
    }
  }, [items, slug, hydrated]);

  const addItem = useCallback<CartContextValue["addItem"]>((item, quantity = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => sameLine(p, item.productId, item.size));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const updateQuantity = useCallback<CartContextValue["updateQuantity"]>(
    (productId, size, quantity) => {
      setItems((prev) =>
        prev
          .map((p) =>
            sameLine(p, productId, size) ? { ...p, quantity: Math.max(0, quantity) } : p
          )
          .filter((p) => p.quantity > 0)
      );
    },
    []
  );

  const removeItem = useCallback<CartContextValue["removeItem"]>((productId, size) => {
    setItems((prev) => prev.filter((p) => !sameLine(p, productId, size)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalQuantity = useMemo(
    () => items.reduce((sum, p) => sum + p.quantity, 0),
    [items]
  );
  const totalPrice = useMemo(
    () => items.reduce((sum, p) => sum + p.quantity * p.price, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, totalQuantity, totalPrice, addItem, updateQuantity, removeItem, clear }),
    [items, totalQuantity, totalPrice, addItem, updateQuantity, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
