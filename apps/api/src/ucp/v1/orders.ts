import { Hono } from "hono";

// UCP order service — mounted at /ucp/v1/orders by v1.ts.
const app = new Hono()
    // TODO: implement order retrieval.
    .get("/:id", (c) => {
        return c.json({ message: "Not implemented" }, 501);
    });

export default app;