"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ProductCard } from "./components/product-card";
import { CartPanel } from "./components/cart-panel";
import { useCart } from "./use-cart";
import { useProducts } from "./use-products";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type CheckoutStatus = "idle" | "submitting" | "success" | "error";

export default function ShopPage() {
  const { productsState, retry: retryProducts } = useProducts(API_BASE_URL);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>("idle");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const {
    items,
    itemCount,
    subtotal,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const handleCheckout = useCallback(async () => {
    setCheckoutStatus("submitting");
    setCheckoutError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ product, quantity }) => ({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
          })),
          totalAmount: subtotal,
          currency: items[0]?.product.currency ?? "INR",
        }),
      });

      if (!response.ok) {
        throw new Error(`Checkout failed with status ${response.status}`);
      }

      const result = (await response.json()) as {
        order?: { id?: string };
      };

      setOrderId(result.order?.id ?? null);
      setCheckoutStatus("success");
      clearCart();
    } catch (error) {
      setCheckoutStatus("error");
      setCheckoutError(
        error instanceof Error
          ? `Checkout failed: ${error.message}`
          : "Checkout failed. Please try again.",
      );
    }
  }, [items, subtotal, clearCart]);

  const handleContinueShopping = useCallback(() => {
    setCheckoutStatus("idle");
    setCheckoutError(null);
    setOrderId(null);
    setIsCartOpen(false);
  }, []);

  const currency = items[0]?.product.currency ?? "INR";

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Quick
            <span className="text-emerald-600 dark:text-emerald-400">
              Mart
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            <span aria-hidden>&#128722;</span>
            Cart
            {itemCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-xs font-bold text-white">
                {itemCount}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            Shop
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Browse our catalogue and add items to your cart.
          </p>
        </div>

        {productsState.status === "loading" ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="aspect-[4/3] animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : productsState.status === "error" ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-4xl" aria-hidden>
              &#9888;&#65039;
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                Couldn&apos;t load products
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {productsState.message} — is the API running on{" "}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.85em] dark:bg-zinc-800">
                  {API_BASE_URL}
                </code>
                ?
              </p>
            </div>
            <button
              type="button"
              onClick={retryProducts}
              className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Try again
            </button>
          </div>
        ) : productsState.products.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-4xl" aria-hidden>
              &#128230;
            </span>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              No products available
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Check back later — the catalogue is empty right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {productsState.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantityInCart={
                  items.find((i) => i.product.id === product.id)?.quantity ?? 0
                }
                onAdd={addItem}
                onSetQuantity={setQuantity}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Prices shown in {currency} · Payments powered by Razorpay
      </footer>

      <CartPanel
        open={isCartOpen}
        items={items}
        subtotal={subtotal}
        checkoutStatus={checkoutStatus}
        checkoutError={checkoutError}
        orderId={orderId}
        onClose={() => setIsCartOpen(false)}
        onSetQuantity={setQuantity}
        onRemove={removeItem}
        onCheckout={() => void handleCheckout()}
        onContinueShopping={handleContinueShopping}
      />
    </div>
  );
}


