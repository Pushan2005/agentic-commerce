# to be implemented later

Test ideas collected from manual verification of the storefront + API.
Each entry = one test case with a short description of what to assert.

## /apps/api

### GET /health

- [ ] returns 200 and `{ "status": "ok" }`

### GET /products

- [ ] returns 200 with an array of products (only `isActive = true` ones)
- [ ] each product has the full schema shape: `id`, `merchantId`, `categoryId`, `name`, `slug`, `description`, `price`, `currency`, `imageUrl`, `isActive`, `createdAt`, `updatedAt`
- [ ] `price` is in paise (e.g. Biryani Masala = 12000)

### CORS

- [ ] `GET /products` with `Origin: <FRONTEND_URL>` returns `Access-Control-Allow-Origin: <FRONTEND_URL>` (exact origin echoed, not `*`)
- [ ] `GET /products` with a disallowed origin (e.g. `http://evil-site.example`) returns NO `Access-Control-Allow-Origin` header (browser would block it)
- [ ] `OPTIONS /checkout` preflight (with `Access-Control-Request-Method: POST`, `Access-Control-Request-Headers: content-type`) returns 204 + `Access-Control-Allow-Origin` + `Access-Control-Allow-Methods` (incl. POST) + `Access-Control-Allow-Headers` (incl. content-type)
- [ ] allowed origins come from `FRONTEND_URL` env var, comma-separated for multiple; falls back to `http://localhost:3000` when unset

### POST /checkout — happy path

- [ ] valid cart (existing product IDs, positive quantities) returns 200 with `{ success: true, order }`
- [ ] `order.amount` equals the sum of `DB price × quantity` across all items (2 × Biryani Masala → 24000, NOT the client-sent price)
- [ ] total is computed from DB prices: send a wrong/cheap `price` in the request body and assert `order.amount` still uses the DB value (never trust the client)
- [ ] `order.currency` is `INR`
- [ ] a Razorpay order is actually created (`order.id` starts with `order_`, status `created`)

### POST /checkout — error cases

- [ ] cart containing a nonexistent product ID returns 400 with `{ success: false, error: "Product(s) not found in DB: <names>", missingProducts: [...] }` — every missing product named, none created in Razorpay
- [ ] mixed cart (1 valid + 1 missing product) → 400, NO order created (validation must happen before the Razorpay call)
- [ ] `missingProducts[].name` falls back to the raw product ID when the request omits `name`
- [ ] empty `items` array → 400 `{ success: false, error: "Cart is empty or invalid." }`
- [ ] missing/malformed body (no `items` key, non-array `items`) → 400, not a 500 crash
- [ ] quantity sanitisation: quantity `0`, negative, fractional or non-numeric is clamped/normalized so the total never goes negative or NaN

### POST /checkout — internal error

- [ ] Razorpay failure (bad/missing keys) returns a clean error response, not an unhandled crash

## /apps/demo-merchant

### /shop — product listing

- [ ] `/shop` renders header ("QuickMart"), cart button, and product grid from `GET /products`
- [ ] while loading, skeleton cards are shown (no layout jump)
- [ ] when API is unreachable: error state "Couldn't load products" with the API base URL shown + "Try again" button that recovers and loads products
- [ ] when catalogue is empty: "No products available" empty state
- [ ] product card shows image when `imageUrl` set; letter placeholder (first letter of name) when null; price formatted via Intl (`₹120` style, paise→rupees)

### /shop — cart behaviour

- [ ] "Add to cart" adds the product and updates the header badge count; card switches to a − qty + stepper
- [ ] stepper `+`/`−` updates quantity; `−` at 1 removes the item and card returns to "Add to cart"
- [ ] header cart button opens the cart drawer; closes via ✕, backdrop click, and Escape key
- [ ] drawer shows each line item with thumbnail, unit price, qty stepper, line total (price × qty)
- [ ] remove (✕) in drawer removes the line item
- [ ] subtotal = sum of line totals and updates live
- [ ] empty cart drawer shows "Your cart is empty" with no checkout button
- [ ] cart survives a page reload (persisted in localStorage under `quickmart.cart.v1`) and survives across two tabs of the same origin (storage event sync)

### /shop — checkout flow

- [ ] pressing Checkout calls `POST /checkout` with `{ items: [{ productId, name, price, quantity }], totalAmount, currency }` (assert request payload, e.g. via MSW/route mock)
- [ ] on 200 success: success screen shown, Razorpay `order.id` displayed, cart cleared (badge 0, localStorage empty)
- [ ] "Continue shopping" resets checkout state and closes the drawer
- [ ] on 400 with missing products: red error banner shows the API's message ("Product(s) not found in DB: X") AND the missing products are removed from the cart so a retry succeeds
- [ ] on 400 with unknown error shape: generic "Checkout failed with status 400" shown, cart untouched
- [ ] on network failure: "Checkout failed" message, cart contents preserved, button re-enabled
- [ ] while submitting: button disabled + "Creating order…" label (no double-submit)

### /shop — Razorpay payment modal

- [ ] after `POST /checkout` succeeds, checkout.js is loaded once (`https://checkout.razorpay.com/v1/checkout.js`) and the Razorpay modal opens with the returned order (order_id, amount, currency, key)
- [ ] API response missing `keyId` → error "API did not return a Razorpay key", no modal opened
- [ ] API response missing `order.id` → error, no modal opened
- [ ] completing a TEST MODE payment (test card 4111 1111 1111 1111, any future expiry, any CVV — or UPI `success@razorpay`) shows: drawer success screen "Payment successful!" with Payment ID + Order ID, AND a dismissible green "Payment successful!" banner on the /shop page
- [ ] after payment success the cart is fully cleared (header badge 0, drawer empty, localStorage `quickmart.cart.v1` empty)
- [ ] closing the Razorpay modal (ondismiss) returns to the normal cart view with contents preserved and checkout re-enabled
- [ ] Razorpay script fails to load (offline/blocked) → "Failed to load the Razorpay checkout script." error, cart preserved
- [ ] NOTE (production TODO): the `handler` response's `razorpay_signature` is NOT verified server-side yet — the success indication is UI-only. Add a `/verify-payment` (or webhook) endpoint before real money is involved

### /shop — API base URL config

- [ ] requests go to `NEXT_PUBLIC_API_URL` when set, else default `http://localhost:3001`

