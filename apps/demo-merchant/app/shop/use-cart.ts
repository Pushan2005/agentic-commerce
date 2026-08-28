"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { CartItem, CartMap, Product } from "./types";

const CART_STORAGE_KEY = "quickmart.cart.v1";

const EMPTY_CART: CartMap = {};

const listeners = new Set<() => void>();
let cachedSnapshot: CartMap | null = null;

function sanitizeCart(raw: unknown): CartMap {
  if (typeof raw !== "object" || raw === null) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(raw as CartMap).filter(
      ([, item]) =>
        item &&
        typeof item === "object" &&
        typeof item.product?.id === "string" &&
        typeof item.quantity === "number" &&
        item.quantity > 0,
    ),
  );
}

function readCartFromStorage(): CartMap {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!raw) {
      return {};
    }

    return sanitizeCart(JSON.parse(raw));
  } catch {
    // Storage can be unavailable (private mode, quota) — treat as empty.
    return {};
  }
}

function getSnapshot(): CartMap {
  if (cachedSnapshot === null) {
    cachedSnapshot = readCartFromStorage();
  }

  return cachedSnapshot;
}

function getServerSnapshot(): CartMap {
  return EMPTY_CART;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // Keep multiple tabs in sync.
  function handleStorage(event: StorageEvent) {
    if (event.key === CART_STORAGE_KEY) {
      cachedSnapshot = null;
      listener();
    }
  }

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function setCart(next: CartMap | ((prev: CartMap) => CartMap)): void {
  const value = typeof next === "function" ? next(getSnapshot()) : next;

  cachedSnapshot = value;

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Persistence is best-effort; in-memory state still works.
  }

  for (const listener of listeners) {
    listener();
  }
}

export function useCart() {
  const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setCart((prev) => {
      const currentQuantity = prev[product.id]?.quantity ?? 0;

      return {
        ...prev,
        [product.id]: {
          product,
          quantity: currentQuantity + quantity,
        },
      };
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return removeEntry(prev, productId);
      }

      const existing = prev[productId];

      if (!existing) {
        return prev;
      }

      return {
        ...prev,
        [productId]: { ...existing, quantity },
      };
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart((prev) => removeEntry(prev, productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
  }, []);

  const items = useMemo<CartItem[]>(() => Object.values(cart), [cart]);

  const { itemCount, subtotal } = useMemo(() => {
    let count = 0;
    let total = 0;

    for (const item of items) {
      count += item.quantity;
      total += item.quantity * item.product.price;
    }

    return { itemCount: count, subtotal: total };
  }, [items]);

  return {
    items,
    itemCount,
    subtotal,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
  };
}

function removeEntry(cart: CartMap, productId: string): CartMap {
  const next = { ...cart };
  delete next[productId];
  return next;
}
