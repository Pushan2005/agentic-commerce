import { Hono } from "hono";
import { createRazorpayOrder } from "./razorpay";
import { db } from "./db";

const app = new Hono();

app.get("/health", (c) => {
    return c.json({
        status: "ok",
    });
});

app.get("/products", async (c) => {
    //
});

app.post("/checkout", async (c) => {
    const body = await c.req.json();

    const order = await createRazorpayOrder({
        amount: 50000,
        currency: "INR",
        receipt: `test_${Date.now()}`,
    });

    return c.json({
        success: true,
        order,
    });
});

export default {
    port: 3001,
    fetch: app.fetch,
};
