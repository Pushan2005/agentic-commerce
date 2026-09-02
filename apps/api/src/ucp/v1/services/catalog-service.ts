import { db } from "../../../db";
import { products } from "../../../db/schema";
import { eq, and, ilike, or, inArray } from "drizzle-orm";

import type {
    SearchRequest,
    LookupRequest,
    GetProductRequest,
    SearchResponseProduct,
    LookupResponseProduct,
} from "@ucp-js/sdk";

import type { InferSelectModel } from "drizzle-orm";

type DbProduct = InferSelectModel<typeof products>;
type CatalogProduct = SearchResponseProduct & LookupResponseProduct;

export const catalogService = {
    async search({
        merchantId,
        request,
    }: {
        merchantId: string;
        request: SearchRequest;
    }) {
        const { query, filters, context, signals } = request; // TODO implement filters, context, signals later

        const terms = query?.trim().toLowerCase().split(/\s+/).filter(Boolean); // TODO if terms is empty, handle it later

        const textConditions = terms!.map((term) =>
            or(
                ilike(products.name, `%${term}%`),
                ilike(products.description, `%${term}%`),
            ),
        );
        // DB query
        const rows = await db
            .select()
            .from(products)
            .where(
                and(
                    eq(products.merchantId, merchantId),
                    eq(products.isActive, true),
                    ...textConditions,
                ),
            );

        return rows.map(mapProductToUcpProduct);
    },

    async lookup({
        merchantId,
        request,
    }: {
        merchantId: string;
        request: LookupRequest;
    }) {
        const { ids } = request;
        // DB query
        const rows = await db
            .select()
            .from(products)
            .where(
                and(
                    eq(products.merchantId, merchantId),
                    eq(products.isActive, true),
                    inArray(products.id, ids),
                ),
            );
        return rows.map(mapProductToUcpProduct);
    },

    async getProduct({
        merchantId,
        request,
    }: {
        merchantId: string;
        request: GetProductRequest;
    }) {
        // DB query
    },
};

export function mapProductToUcpProduct(product: DbProduct): CatalogProduct {
    return {
        id: product.id,
        title: product.name,
        description: { plain: product.description ?? "" },
        price_range: {
            max: {
                currency: product.currency,
                amount: product.price,
            },
            min: {
                currency: product.currency,
                amount: product.price,
            },
        },
        variants: [],
    };
}
