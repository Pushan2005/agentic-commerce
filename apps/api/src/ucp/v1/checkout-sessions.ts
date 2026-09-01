import { Hono } from "hono";

// UCP checkout service — mounted at /ucp/v1/checkout-sessions by v1.ts.
const app = new Hono()
    // TODO: implement checkout session creation.
    .post("/", (c) => {
        return c.json({ message: "Not implemented" }, 501);
    })
    // TODO: implement checkout session retrieval.
    .get("/:id", (c) => {
        return c.json({ message: "Not implemented" }, 501);
    })
    // TODO: implement checkout session update.
    .put("/:id", (c) => {
        return c.json({ message: "Not implemented" }, 501);
    })
    // TODO: implement checkout completion (payment + order creation).
    .post("/:id/complete", (c) => {
        return c.json({ message: "Not implemented" }, 501);
    })
    // TODO: implement checkout session cancellation.
    .post("/:id/cancel", (c) => {
        return c.json({ message: "Not implemented" }, 501);
    });

export default app;

