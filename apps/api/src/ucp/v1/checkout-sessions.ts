import { Hono } from "hono";

import type {
    Buyer,
    CheckoutCreateRequestContext,
    ItemCreateRequest,
    PostalAddress,
    CheckoutCreateRequestSignals,
    ItemResponse,
    CheckoutResponseMessage,
    CheckoutResponseStatus,
    ItemUpdateRequest,
    PaymentInstrument,
    PaymentCredential,
    TotalResponse,
    OrderConfirmation,
} from "@ucp-js/sdk";

// for AP2 layer
import type {
    CompleteCheckoutRequestWithAp2Ap2,
    CheckoutWithAp2MandateAp2,
} from "@ucp-js/sdk";

// UCP checkout service — mounted at /ucp/v1/checkout-sessions by v1.ts.
const app = new Hono();
// TODO: implement checkout session creation.
app.post("/", (c) => {
    return c.json({ message: "Not implemented" }, 501);
});
// TODO: implement checkout session retrieval.
app.get("/:id", (c) => {
    return c.json({ message: "Not implemented" }, 501);
});
// TODO: implement checkout session update.
app.put("/:id", (c) => {
    return c.json({ message: "Not implemented" }, 501);
});
// TODO: implement checkout completion (payment + order creation).
app.post("/:id/complete", (c) => {
    return c.json({ message: "Not implemented" }, 501);
});
// TODO: implement checkout session cancellation.
app.post("/:id/cancel", (c) => {
    return c.json({ message: "Not implemented" }, 501);
});

export default app;

// POST Create Checkout
//         │
//         ├── ItemCreateRequest
//         ├── Buyer
//         ├── CheckoutCreateRequestContext
//         └── CheckoutCreateRequestSignals
//         │
//         ▼
// your checkout service
//         │
//         ├── products
//         ├── customers
//         ├── checkout_sessions
//         └── checkout_items
//         │
//         ▼
// UCP Checkout response
