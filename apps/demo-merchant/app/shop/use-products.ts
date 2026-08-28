"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { Product } from "./types";

export type ProductsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; products: Product[] };

const LOADING: ProductsState = { status: "loading" };

// Module-level store so products live outside React state — listeners are
// notified via useSyncExternalStore, avoiding cascading setState in effects.
let state: ProductsState = LOADING;
let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notify(next: ProductsState): void {
  state = next;

  for (const listener of listeners) {
    listener();
  }
}

function fetchProducts(apiBaseUrl: string): Promise<void> {
  if (inFlight) {
    return inFlight;
  }

  inFlight = (async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/products`);

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const products = (await response.json()) as Product[];

      notify({ status: "ready", products });
    } catch (error) {
      // Allow a later retry.
      inFlight = null;

      notify({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while loading products.",
      });
    }
  })();

  return inFlight;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ProductsState {
  return state;
}

function getServerSnapshot(): ProductsState {
  return LOADING;
}

export function useProducts(apiBaseUrl: string) {
  const productsState = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    void fetchProducts(apiBaseUrl);
  }, [apiBaseUrl]);

  const retry = useCallback(() => {
    void fetchProducts(apiBaseUrl);
  }, [apiBaseUrl]);

  return { productsState, retry };
}
