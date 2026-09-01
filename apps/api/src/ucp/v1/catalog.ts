import { Hono } from "hono";

// UCP catalog service — mounted at /ucp/v1/catalog by v1.ts.
const app = new Hono()
    // TODO: implement catalog browsing (list/search products).
    .get("/", (c) => {
        return c.json({ message: "Not implemented" }, 501);
    })
    // TODO: implement product lookup by query/items.
    .post("/lookup", (c) => {
        return c.json({ message: "Not implemented" }, 501);
    });

export default app;

