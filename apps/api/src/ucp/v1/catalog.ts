import { Hono } from "hono";

import type {
    LookupRequestContext,
    LookupRequestSignals,
    PriceFilter,
    Category,
    Description,
    Price,
    ItemReference,
    SearchRequest,
    SearchResponse,
    SearchResponseProduct,
    LookupRequest,
    LookupResponse,
    LookupResponseProduct,
} from "@ucp-js/sdk";

import { SearchRequestSchema, LookupRequestSchema } from "@ucp-js/sdk";
import { catalogService } from "./services/catalog-service";

// UCP catalog service — mounted at /ucp/v1/catalog by v1.ts.
const app = new Hono();

const UCP_VERSION = "2026-08-05";
const MERCHANT_ID = "9b7d96d0-e0a8-4d73-948f-150454c5c343"; // only for dev, remove this variable in prod and infer in each endpoint

app.post("/search", async (c) => {
    const requestJson = await c.req.json();

    const merchantId = MERCHANT_ID; // prod DB is multi-tenant, we need merchantId
    // TODO: infer merchant id from request host header in prod, merchants will proxy to our endpoints
    const result = SearchRequestSchema.safeParse(requestJson);
    if (!result.success) {
        return c.json(
            {
                message: "Invalid request body",
                details: result.error.flatten(),
            },
            400,
        );
    }

    const requestBody: SearchRequest = result.data;

    const UcpProducts: SearchResponseProduct[] = await catalogService.search({
        merchantId,
        request: requestBody,
    });

    const response: SearchResponse = {
        ucp: {
            version: UCP_VERSION,
            status: "success",
        },
        products: UcpProducts,
    };
    return c.json(response);
});

// TODO: implement product lookup by query/items.
app.post("/lookup", async (c) => {
    const requestJson = await c.req.json();
    const merchantId = MERCHANT_ID;

    const result = LookupRequestSchema.safeParse(requestJson);
    if (!result.success) {
        return c.json(
            {
                message: "Invalid request body",
                details: result.error.flatten(),
            },
            400,
        );
    }

    const requestBody: LookupRequest = result.data;

    const UcpProducts: LookupResponseProduct[] = await catalogService.lookup({
        merchantId,
        request: requestBody,
    });

    const response: LookupResponse = {
        ucp: {
            version: UCP_VERSION,
            status: "success",
        },
        products: UcpProducts,
    };
    return c.json(response);
});

app.post("/product", (c) => {
    return c.json({ message: "Not implemented" }, 501);
});

export default app;

// mapping for lookup:
// UCP ItemReference
//         ↓
// products.id
//         ↓
// DB product
//         ↓
// UCP item/product response
