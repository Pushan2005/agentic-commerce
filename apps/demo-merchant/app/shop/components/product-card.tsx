"use client";

import type { Product } from "../types";
import { formatPrice } from "../types";

type ProductCardProps = {
  product: Product;
  quantityInCart: number;
  onAdd: (product: Product) => void;
  onSetQuantity: (productId: string, quantity: number) => void;
};

export function ProductCard({
  product,
  quantityInCart,
  onAdd,
  onSetQuantity,
}: ProductCardProps) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="select-none text-5xl font-semibold text-zinc-400 dark:text-zinc-600">
            {product.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {product.name}
        </h3>

        {product.description ? (
          <p className="line-clamp-2 text-sm leading-5 text-zinc-600 dark:text-zinc-400">
            {product.description}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {formatPrice(product.price, product.currency)}
          </span>

          {quantityInCart === 0 ? (
            <button
              type="button"
              onClick={() => onAdd(product)}
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Add to cart
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                aria-label={`Decrease quantity of ${product.name}`}
                onClick={() => onSetQuantity(product.id, quantityInCart - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                &minus;
              </button>
              <span className="min-w-6 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {quantityInCart}
              </span>
              <button
                type="button"
                aria-label={`Increase quantity of ${product.name}`}
                onClick={() => onSetQuantity(product.id, quantityInCart + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
