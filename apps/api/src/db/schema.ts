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
} from "drizzle-orm/pg-core";

export const checkoutSessionStatusEnum = pgEnum("checkout_session_status", [
    "open",
    "completed",
    "expired",
    "cancelled",
]);

export const orderStatusEnum = pgEnum("order_status", [
    "pending",
    "paid",
    "failed",
    "cancelled",
    "refunded",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
    "created",
    "authorized",
    "captured",
    "failed",
    "refunded",
]);

export const paymentProviderEnum = pgEnum("payment_provider", ["razorpay"]);

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

        categoryId: uuid("category_id")
            .notNull()
            .references(() => categories.id),

        name: varchar("name", { length: 200 }).notNull(),

        slug: varchar("slug", { length: 200 }).notNull(),

        description: text("description"),

        price: integer("price").notNull(),

        currency: varchar("currency", { length: 3 }).notNull().default("INR"),

        imageUrl: text("image_url"),

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

        status: checkoutSessionStatusEnum("status").notNull().default("open"),

        currency: varchar("currency", { length: 3 }).notNull().default("INR"),

        totalAmount: integer("total_amount").notNull(),

        idempotencyKey: varchar("idempotency_key", {
            length: 200,
        }),

        expiresAt: timestamp("expires_at", {
            withTimezone: true,
        }),

        completedAt: timestamp("completed_at", {
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
            table.idempotencyKey,
        ),
    }),
);

export const checkoutSessionItems = pgTable(
    "checkout_session_items",
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

        productName: varchar("product_name", {
            length: 200,
        }).notNull(),

        unitPrice: integer("unit_price").notNull(),

        quantity: integer("quantity").notNull(),

        totalPrice: integer("total_price").notNull(),
    },
    (table) => ({
        sessionIdx: index("checkout_session_items_session_idx").on(
            table.checkoutSessionId,
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

        checkoutSessionId: uuid("checkout_session_id").references(
            () => checkoutSessions.id,
        ),

        status: orderStatusEnum("status").notNull().default("pending"),

        currency: varchar("currency", { length: 3 }).notNull().default("INR"),

        totalAmount: integer("total_amount").notNull(),

        idempotencyKey: varchar("idempotency_key", {
            length: 200,
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

        paidAt: timestamp("paid_at", {
            withTimezone: true,
        }),
    },
    (table) => ({
        merchantIdx: index("orders_merchant_idx").on(table.merchantId),

        customerIdx: index("orders_customer_idx").on(table.customerId),

        sessionIdx: index("orders_checkout_session_idx").on(
            table.checkoutSessionId,
        ),

        idempotencyIdx: uniqueIndex("orders_idempotency_idx").on(
            table.idempotencyKey,
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

        productName: varchar("product_name", {
            length: 200,
        }).notNull(),

        unitPrice: integer("unit_price").notNull(),

        quantity: integer("quantity").notNull(),

        totalPrice: integer("total_price").notNull(),
    },
    (table) => ({
        orderIdx: index("order_items_order_idx").on(table.orderId),
    }),
);

export const paymentAttempts = pgTable(
    "payment_attempts",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        orderId: uuid("order_id")
            .notNull()
            .references(() => orders.id),

        provider: paymentProviderEnum("provider").notNull().default("razorpay"),

        status: paymentStatusEnum("status").notNull().default("created"),

        amount: integer("amount").notNull(),

        currency: varchar("currency", { length: 3 }).notNull().default("INR"),

        providerOrderId: varchar("provider_order_id", {
            length: 100,
        }).notNull(),

        providerPaymentId: varchar("provider_payment_id", {
            length: 100,
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

        capturedAt: timestamp("captured_at", {
            withTimezone: true,
        }),
    },
    (table) => ({
        orderIdx: index("payment_attempts_order_idx").on(table.orderId),

        providerOrderIdx: index("payment_attempts_provider_order_idx").on(
            table.providerOrderId,
        ),

        providerPaymentIdx: index("payment_attempts_provider_payment_idx").on(
            table.providerPaymentId,
        ),
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
});

export const orderAddresses = pgTable(
    "order_addresses",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        orderId: uuid("order_id")
            .notNull()
            .references(() => orders.id, {
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
    },
    (table) => ({
        orderIdx: uniqueIndex("order_addresses_order_idx").on(table.orderId),
    }),
);
