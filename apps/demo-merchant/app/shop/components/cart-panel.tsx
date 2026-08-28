"use client";

import { useEffect } from "react";
import type { CartItem } from "../types";
import { formatPrice } from "../types";

type CheckoutStatus = "idle" | "submitting" | "success" | "error";

type CartPanelProps = {
  open: boolean;
  items: CartItem[];
  subtotal: number;
  checkoutStatus: CheckoutStatus;
  checkoutError: string | null;
  orderId: string | null;
  onClose: () => void;
  onSetQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
};

export function CartPanel({
  open,
  items,
  subtotal,
  checkoutStatus,
  checkoutError,
  orderId,
  onClose,
  onSetQuantity,
  onRemove,
  onCheckout,
  onContinueShopping,
}: CartPanelProps) {
  // Close the drawer on Escape.
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const isEmpty = items.length === 0;
  const currency = items[0]?.product.currency ?? "INR";

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-label="Shopping cart"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-zinc-900 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Your cart
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            &#10005;
          </button>
        </header>

        {checkoutStatus === "success" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600 dark:bg-green-900/40 dark:text-green-400">
              &#10003;
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Order placed!
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Your payment was initiated successfully.
            </p>
            {orderId ? (
              <p className="rounded-lg bg-zinc-100 px-3 py-2 font-mono text-xs break-all text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                Order ID: {orderId}
              </p>
            ) : null}
            <button
              type="button"
              onClick={onContinueShopping}
              className="mt-4 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Continue shopping
            </button>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
            <span className="text-4xl" aria-hidden>
              &#128722;
            </span>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              Your cart is empty
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Add some products to get started.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              Browse products
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-zinc-200 overflow-y-auto px-5 dark:divide-zinc-800">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="flex gap-4 py-4">
                  <CartItemThumbnail product={product} />
                  <CartItemDetails
                    product={product}
                    quantity={quantity}
                    onSetQuantity={onSetQuantity}
                    onRemove={onRemove}
                  />
                </li>
              ))}
            </ul>

            <footer className="border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
              {checkoutError ? (
                <p
                  role="alert"
                  className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400"
                >
                  {checkoutError}
                </p>
              ) : null}

              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Subtotal
                </span>
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {formatPrice(subtotal, currency)}
                </span>
              </div>

              <button
                type="button"
                onClick={onCheckout}
                disabled={checkoutStatus === "submitting"}
                className="flex w-full items-center justify-center rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {checkoutStatus === "submitting"
                  ? "Processing checkout…"
                  : `Checkout · ${formatPrice(subtotal, currency)}`}
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

function CartItemThumbnail({ product }: { product: CartItem["product"] }) {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-xl font-semibold text-zinc-400 dark:text-zinc-600">
          {product.name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function CartItemDetails({
  product,
  quantity,
  onSetQuantity,
  onRemove,
}: {
  product: CartItem["product"];
  quantity: number;
  onSetQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {product.name}
        </p>
        <button
          type="button"
          onClick={() => onRemove(product.id)}
          aria-label={`Remove ${product.name} from cart`}
          className="shrink-0 text-zinc-400 transition-colors hover:text-red-500"
        >
          &#10005;
        </button>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {formatPrice(product.price, product.currency)}
      </p>

      <div className="mt-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            aria-label={`Decrease quantity of ${product.name}`}
            onClick={() => onSetQuantity(product.id, quantity - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            &minus;
          </button>
          <span className="min-w-5 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {quantity}
          </span>
          <button
            type="button"
            aria-label={`Increase quantity of ${product.name}`}
            onClick={() => onSetQuantity(product.id, quantity + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            +
          </button>
        </div>

        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {formatPrice(product.price * quantity, product.currency)}
        </span>
      </div>
    </div>
  );
}

