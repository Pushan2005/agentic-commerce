import { Hono } from "hono";
import { cors } from "hono/cors";
import { createRazorpayOrder } from "./razorpay";
import { db } from "./db";
import { products } from "./db/schema";
import { eq, inArray } from "drizzle-orm";
import v1 from "./ucp/v1/v1";

const app = new Hono();

// Only allow the configured frontend origin(s) to call this API.
// FRONTEND_URL is read from .env; multiple origins can be comma-separated.
const allowedOrigins = (process.env.FRONTEND_URL ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use("*", cors({ origin: allowedOrigins }));

app.get("/health", (c) => {
    return c.json({
        status: "ok",
    });
});

app.get("/.well-known/ucp", (c) => {
    // update this later
    return c.json({
        ucp: {
            version: "2026-08-25",

            services: {
                "dev.ucp.shopping": [
                    {
                        version: "2026-08-25",
                        spec: "https://ucp.dev/2026-08-25/specification/overview/",
                        transport: "rest",
                        endpoint: "https://quickmart.example/ucp/v1",
                        schema: "https://ucp.dev/2026-08-25/services/shopping/rest.openapi.json",
                    },
                ],
            },

            capabilities: {
                "dev.ucp.shopping.catalog": [
                    {
                        version: "2026-08-25",
                        spec: "https://ucp.dev/2026-08-25/specification/shopping/catalog",
                        schema: "https://ucp.dev/2026-08-25/schemas/shopping/catalog.json",
                    },
                ],

                "dev.ucp.shopping.checkout": [
                    {
                        version: "2026-08-25",
                        spec: "https://ucp.dev/2026-08-25/specification/shopping/checkout",
                        schema: "https://ucp.dev/2026-08-25/schemas/shopping/checkout.json",
                    },
                ],

                "dev.ucp.shopping.order": [
                    {
                        version: "2026-08-25",
                        spec: "https://ucp.dev/2026-08-25/specification/shopping/order",
                        schema: "https://ucp.dev/2026-08-25/schemas/shopping/order.json",
                    },
                ],
            },

            payment_handlers: {
                "...": [],
            },
        },

        keys: [],
    });
});

// UCP v1 — stubs live in ./ucp/v1 (see endpoints.md)
app.route("/ucp/v1", v1);

app.get("/products", async (c) => {
    const activeProducts = await db
        .select()
        .from(products)
        .where(eq(products.isActive, true));

    return c.json(activeProducts);
});

app.post("/checkout", async (c) => {
    const body = await c.req.json<{
        items?: { productId: string; name?: string; quantity: number }[];
    }>();

    const items = body.items;

    if (!Array.isArray(items) || items.length === 0) {
        return c.json(
            { success: false, error: "Cart is empty or invalid." },
            400,
        );
    }

    // Single query for all product IDs — never trust client-sent prices.
    const productIds = items.map((item) => item.productId);

    const dbProducts = await db
        .select({
            id: products.id,
            name: products.name,
            price: products.price,
        })
        .from(products)
        .where(inArray(products.id, productIds));

    const priceById = new Map(dbProducts.map((p) => [p.id, p]));

    // Report every product that doesn't exist in the DB.
    const missingProducts = items
        .filter((item) => !priceById.has(item.productId))
        .map((item) => ({
            productId: item.productId,
            name: item.name ?? item.productId,
        }));

    if (missingProducts.length > 0) {
        const names = missingProducts.map((p) => p.name).join(", ");

        return c.json(
            {
                success: false,
                error: `Product(s) not found in DB: ${names}`,
                missingProducts,
            },
            400,
        );
    }

    let totalAmount = 0;

    for (const item of items) {
        const product = priceById.get(item.productId);

        if (!product) {
            // Checked above, but keeps TypeScript happy without a `!`.
            return c.json(
                {
                    success: false,
                    error: "Product not found in DB.",
                    missingProducts: [{ productId: item.productId }],
                },
                400,
            );
        }

        const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));

        totalAmount += product.price * quantity;
    }

    const order = await createRazorpayOrder({
        amount: totalAmount,
        currency: "INR",
        receipt: `order_${Date.now()}`, // encode customer ID too to prevent same receipt for different customers
    });

    // key_id is Razorpay's public identifier — required by checkout.js on the client.
    return c.json({
        success: true,
        order,
        keyId: process.env.RAZORPAY_KEY_ID,
    });
});

export default {
    port: 3001,
    fetch: app.fetch,
};
