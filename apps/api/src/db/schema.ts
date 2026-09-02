import {
    pgEnum,
    pgTable,
    text,
    varchar,
    integer,
    boolean,
    timestamp,
    uuid,
    uniqueIndex,
    index,
    jsonb,
} from "drizzle-orm/pg-core";

export const checkoutStatusEnum = pgEnum("checkout_status", [
    "incomplete",
    "requires_escalation",
    "ready_for_complete",
    "completed",
    "canceled",
]);

export const orderStatusEnum = pgEnum("order_status", [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
    "pending",
    "authorized",
    "captured",
    "failed",
    "refunded",
]);

export const paymentProviderEnum = pgEnum("payment_provider", ["razorpay"]);

export const addressTypeEnum = pgEnum("address_type", ["shipping", "billing"]);

export const merchants = pgTable(
    "merchants",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        name: varchar("name", { length: 200 }).notNull(),

        slug: varchar("slug", { length: 200 }).notNull(),

        currency: varchar("currency", { length: 3 }).notNull().default("INR"),

        isActive: boolean("is_active").notNull().default(true),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp("updated_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        slugIdx: uniqueIndex("merchants_slug_idx").on(table.slug),
    }),
);

export const categories = pgTable(
    "categories",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        merchantId: uuid("merchant_id")
            .notNull()
            .references(() => merchants.id, {
                onDelete: "cascade",
            }),

        name: varchar("name", { length: 100 }).notNull(),

        slug: varchar("slug", { length: 100 }).notNull(),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        merchantSlugIdx: uniqueIndex("categories_merchant_slug_idx").on(
            table.merchantId,
            table.slug,
        ),
    }),
);

export const products = pgTable(
    "products",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        merchantId: uuid("merchant_id")
            .notNull()
            .references(() => merchants.id, {
                onDelete: "cascade",
            }),

        categoryId: uuid("category_id").references(() => categories.id),

        name: varchar("name", { length: 200 }).notNull(),

        slug: varchar("slug", { length: 200 }).notNull(),

        description: text("description"),

        price: integer("price").notNull(),

        currency: varchar("currency", { length: 3 }).notNull().default("INR"),

        imageUrl: text("image_url"),

        sku: varchar("sku", { length: 100 }),

        isActive: boolean("is_active").notNull().default(true),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp("updated_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        merchantSlugIdx: uniqueIndex("products_merchant_slug_idx").on(
            table.merchantId,
            table.slug,
        ),

        skuIdx: index("products_sku_idx").on(table.sku),

        categoryIdx: index("products_category_idx").on(table.categoryId),
    }),
);

export const checkoutSessions = pgTable(
    "checkout_sessions",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        merchantId: uuid("merchant_id")
            .notNull()
            .references(() => merchants.id),

        customerId: uuid("customer_id").references(() => customers.id),

        status: checkoutStatusEnum("status").notNull().default("incomplete"),

        currency: varchar("currency", { length: 3 }).notNull().default("INR"),

        subtotal: integer("subtotal").notNull().default(0), //calculated as not inclusive of taxes

        taxAmount: integer("tax_amount").notNull().default(0),

        shippingAmount: integer("shipping_amount").notNull().default(0),

        discountAmount: integer("discount_amount").notNull().default(0),

        totalAmount: integer("total_amount").notNull().default(0), // invoiced as subtotal + shipping + tax - discount

        idempotencyKey: varchar("idempotency_key", {
            length: 200,
        }),

        continueUrl: text("continue_url"), // incase payment is hosted on a different merchant controled page, redirect to this url to make the payment

        expiresAt: timestamp("expires_at", {
            withTimezone: true,
        }),

        completedAt: timestamp("completed_at", {
            withTimezone: true,
        }),

        cancelledAt: timestamp("cancelled_at", {
            withTimezone: true,
        }),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp("updated_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        merchantIdx: index("checkout_sessions_merchant_idx").on(
            table.merchantId,
        ),

        customerIdx: index("checkout_sessions_customer_idx").on(
            table.customerId,
        ),

        idempotencyIdx: uniqueIndex("checkout_sessions_idempotency_idx").on(
            table.merchantId,
            table.idempotencyKey,
        ),
    }),
);

export const checkoutItems = pgTable(
    "checkout_items",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        checkoutSessionId: uuid("checkout_session_id")
            .notNull()
            .references(() => checkoutSessions.id, {
                onDelete: "cascade",
            }),

        productId: uuid("product_id")
            .notNull()
            .references(() => products.id),

        productName: varchar("product_name", { length: 200 }).notNull(),

        sku: varchar("sku", {
            length: 100,
        }),

        unitPrice: integer("unit_price").notNull(), // unit price may change before checkout

        quantity: integer("quantity").notNull(),

        totalPrice: integer("total_price").notNull(),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        sessionIdx: index("checkout_items_session_idx").on(
            table.checkoutSessionId,
        ),

        productIdx: index("checkout_items_product_idx").on(table.productId),
    }),
);

export const checkoutAddresses = pgTable(
    "checkout_addresses",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        checkoutSessionId: uuid("checkout_session_id")
            .notNull()
            .references(() => checkoutSessions.id, {
                onDelete: "cascade",
            }),

        type: addressTypeEnum("type").notNull(),

        name: varchar("name", {
            length: 200,
        }).notNull(),

        phone: varchar("phone", {
            length: 30,
        }),

        addressLine1: text("address_line_1").notNull(),

        addressLine2: text("address_line_2"),

        city: varchar("city", {
            length: 100,
        }).notNull(),

        state: varchar("state", {
            length: 100,
        }).notNull(),

        postalCode: varchar("postal_code", { length: 20 }).notNull(),

        country: varchar("country", {
            length: 2,
        }).notNull(),
    },
    (table) => ({
        checkoutTypeIdx: uniqueIndex("checkout_addresses_type_idx").on(
            table.checkoutSessionId,
            table.type,
        ),
    }),
);

export const orders = pgTable(
    "orders",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        merchantId: uuid("merchant_id")
            .notNull()
            .references(() => merchants.id),

        customerId: uuid("customer_id").references(() => customers.id),

        checkoutSessionId: uuid("checkout_session_id")
            .notNull()
            .references(() => checkoutSessions.id),

        status: orderStatusEnum("status").notNull().default("pending"),

        currency: varchar("currency", {
            length: 3,
        }).notNull(),

        subtotal: integer("subtotal").notNull(),
        taxAmount: integer("tax_amount").notNull(),
        shippingAmount: integer("shipping_amount").notNull(),
        discountAmount: integer("discount_amount").notNull(),
        totalAmount: integer("total_amount").notNull(),

        // Razorpay Order
        paymentProvider: paymentProviderEnum("payment_provider"),

        providerOrderId: varchar("provider_order_id", { length: 200 }),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp("updated_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),

        paidAt: timestamp("paid_at", {
            withTimezone: true,
        }),
    },
    (table) => ({
        providerOrderIdx: uniqueIndex("orders_provider_order_idx").on(
            table.providerOrderId,
        ),
    }),
);

export const orderItems = pgTable(
    "order_items",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        orderId: uuid("order_id")
            .notNull()
            .references(() => orders.id, {
                onDelete: "cascade",
            }),

        productId: uuid("product_id")
            .notNull()
            .references(() => products.id),

        productName: varchar("product_name", { length: 200 }).notNull(),

        sku: varchar("sku", {
            length: 100,
        }),

        unitPrice: integer("unit_price").notNull(),

        quantity: integer("quantity").notNull(),

        totalPrice: integer("total_price").notNull(),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        orderIdx: index("order_items_order_idx").on(table.orderId),
    }),
);

export const customers = pgTable(
    "customers",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        externalId: varchar("external_id", {
            length: 200,
        }),

        email: varchar("email", { length: 320 }),

        name: varchar("name", { length: 200 }),

        phone: varchar("phone", { length: 30 }),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp("updated_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        externalIdIdx: index("customers_external_id_idx").on(table.externalId),
        emailIdx: index("customers_email_idx").on(table.email),
    }),
);

export const addresses = pgTable("addresses", {
    id: uuid("id").defaultRandom().primaryKey(),

    customerId: uuid("customer_id").references(() => customers.id, {
        onDelete: "cascade",
    }),

    name: varchar("name", { length: 200 }).notNull(),

    phone: varchar("phone", { length: 30 }),

    addressLine1: text("address_line_1").notNull(),

    addressLine2: text("address_line_2"),

    city: varchar("city", { length: 100 }).notNull(),

    state: varchar("state", { length: 100 }).notNull(),

    postalCode: varchar("postal_code", { length: 20 }).notNull(),

    country: varchar("country", { length: 2 }).notNull().default("IN"),

    createdAt: timestamp("created_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
}); // reusable addresses for customers

export const orderAddresses = pgTable(
    "order_addresses",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        orderId: uuid("order_id")
            .notNull()
            .references(() => orders.id, {
                onDelete: "cascade",
            }),

        type: addressTypeEnum("type").notNull(),

        name: varchar("name", {
            length: 200,
        }).notNull(),

        phone: varchar("phone", {
            length: 30,
        }),

        addressLine1: text("address_line_1").notNull(),

        addressLine2: text("address_line_2"),

        city: varchar("city", {
            length: 100,
        }).notNull(),

        state: varchar("state", {
            length: 100,
        }).notNull(),

        postalCode: varchar("postal_code", { length: 20 }).notNull(),

        country: varchar("country", {
            length: 2,
        }).notNull(),
    },
    (table) => ({
        orderTypeIdx: uniqueIndex("order_addresses_type_idx").on(
            table.orderId,
            table.type,
        ),
    }),
); // address at tge time of order creation, incase customer changes their address later

export const paymentAttempts = pgTable(
    "payment_attempts",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        orderId: uuid("order_id")
            .notNull()
            .references(() => orders.id, {
                onDelete: "cascade",
            }),

        provider: paymentProviderEnum("provider").notNull(),

        status: paymentStatusEnum("status").notNull().default("pending"),

        amount: integer("amount").notNull(),

        currency: varchar("currency", {
            length: 3,
        }).notNull(),

        // The individual Razorpay payment
        providerPaymentId: varchar("provider_payment_id", { length: 200 }),

        // Useful even though the parent order has it too.
        // Makes reconciliation/querying easier.
        providerOrderId: varchar("provider_order_id", { length: 200 }),

        // Payment method used by this attempt
        paymentMethod: varchar("payment_method", { length: 50 }),

        // Raw/provider-specific information
        providerData: jsonb("provider_data"),

        failureCode: varchar("failure_code", { length: 200 }),

        failureReason: text("failure_reason"),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp("updated_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),

        authorizedAt: timestamp("authorized_at", {
            withTimezone: true,
        }),

        capturedAt: timestamp("captured_at", {
            withTimezone: true,
        }),

        failedAt: timestamp("failed_at", {
            withTimezone: true,
        }),

        refundedAt: timestamp("refunded_at", {
            withTimezone: true,
        }),
    },
    (table) => ({
        orderIdx: index("payment_attempts_order_idx").on(table.orderId),

        providerPaymentIdx: uniqueIndex(
            "payment_attempts_provider_payment_idx",
        ).on(table.providerPaymentId),

        providerOrderIdx: index("payment_attempts_provider_order_idx").on(
            table.providerOrderId,
        ),
    }),
); // see how paymanet attempts will look below:

// orders
// └── order_123
//       │
//       └── razorpayOrderId = order_xyz
//              │
//              ├── payment_attempt #1
//              │      razorpayPaymentId = pay_001
//              │      status = failed
//              │
//              ├── payment_attempt #2
//              │      razorpayPaymentId = pay_002
//              │      status = failed
//              │
//              └── payment_attempt #3
//                     razorpayPaymentId = pay_003
//                     status = captured

export const merchantPaymentHandlers = pgTable(
    "merchant_payment_handlers",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        merchantId: uuid("merchant_id")
            .notNull()
            .references(() => merchants.id, {
                onDelete: "cascade",
            }),

        handlerId: varchar("handler_id", { length: 200 }).notNull(),

        provider: paymentProviderEnum("provider").notNull(),

        config: jsonb("config").notNull(),

        isActive: boolean("is_active").notNull().default(true),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp("updated_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        merchantHandlerIdx: uniqueIndex("merchant_payment_handler_idx").on(
            table.merchantId,
            table.handlerId,
        ),
    }),
);

// for audit trail //

export const agentSessions = pgTable("agent_sessions", {
    id: uuid("id").defaultRandom().primaryKey(),

    agentMetadata: jsonb("agent_metadata"),

    checkoutSessionId: uuid("checkout_session_id").references(
        () => checkoutSessions.id,
    ),

    customerId: uuid("customer_id").references(() => customers.id),

    createdAt: timestamp("created_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),

    endedAt: timestamp("ended_at", {
        withTimezone: true,
    }),
});

export const agentInteractions = pgTable(
    "agent_interactions",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        agentSessionId: uuid("agent_session_id")
            .notNull()
            .references(() => agentSessions.id, {
                onDelete: "cascade",
            }),

        sequence: integer("sequence").notNull(), // sequence of the interactions

        type: varchar("type", {
            length: 100,
        }).notNull(),

        action: varchar("action", {
            length: 200,
        }),

        request: jsonb("request"),

        response: jsonb("response"),

        error: jsonb("error"), // to store whatever error is thrown, useful for auditing

        metadata: jsonb("metadata"),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        sessionSequenceIdx: uniqueIndex(
            "agent_interactions_session_sequence_idx",
        ).on(table.agentSessionId, table.sequence),

        sessionIdx: index("agent_interactions_session_idx").on(
            table.agentSessionId,
        ),
    }),
);

// audit trail example
// Agent Session #abc
// │
// ├── 001  GET products
// ├── 002  POST checkout session
// ├── 003  PUT checkout session
// ├── 004  POST complete checkout
// │
// ├── 005  payment attempt
// │       └── Razorpay pay_001 → failed
// │
// ├── 006  agent retries payment
// │       └── Razorpay pay_002 → failed
// │
// ├── 007  agent retries payment
// │       └── Razorpay pay_003 → captured
// │
// └── 008  checkout completed
