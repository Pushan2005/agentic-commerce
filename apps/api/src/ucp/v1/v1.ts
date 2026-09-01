import { Hono } from "hono";
import catalog from "./catalog";
import checkoutSessions from "./checkout-sessions";
import orders from "./orders";

// /ucp/v1 — the shopping service base path advertised in /.well-known/ucp.
const v1 = new Hono()
    .route("/catalog", catalog)
    .route("/checkout-sessions", checkoutSessions)
    .route("/orders", orders);

export default v1;