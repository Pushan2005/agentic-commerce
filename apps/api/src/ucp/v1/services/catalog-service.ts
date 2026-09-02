import { db } from "../../../db";
import { products } from "../../../db/schema";
import { eq, and, ilike, or, inArray } from "drizzle-orm";

import type {
    SearchRequest,
    LookupRequest,
    GetProductRequest,
    SearchResponseProduct,
    LookupResponseProduct,
    GetProductResponse,
} from "@ucp-js/sdk";

import type { InferSelectModel } from "drizzle-orm";

type DbProduct = InferSelectModel<typeof products>;

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

        return rows.map(mapProductToSearchResponseProduct);
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
        return rows.map(mapProductToLookupResponseProduct);
    },

    async getProductResponse({
        merchantId,
        ucpVersion,
        request,
    }: {
        merchantId: string;
        ucpVersion: string;
        request: GetProductRequest;
    }) {
        const { id } = request;
        // DB query
        const row = await db
            .select()
            .from(products)
            .where(
                and(
                    eq(products.merchantId, merchantId),
                    eq(products.isActive, true),
                    eq(products.id, id),
                ),
            );

        const product = row[0];
        return product
            ? mapProductToGetProductResponse(product, ucpVersion)
            : undefined;
    },
};

export function mapProductToSearchResponseProduct(
    product: DbProduct,
): SearchResponseProduct {
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

export function mapProductToLookupResponseProduct(
    product: DbProduct,
): LookupResponseProduct {
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

export function mapProductToGetProductResponse(
    product: DbProduct,
    ucpVersion: string,
): GetProductResponse {
    return {
        ucp: {
            version: ucpVersion,
            status: "success",
        },
        product: {
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
        },
    };
}
