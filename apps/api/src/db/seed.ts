import { db } from "./index";
import {
    merchants,
    categories,
    products,
    customers,
    addresses,
} from "./schema";
import { eq, and } from "drizzle-orm";

async function seed() {
    console.log("🌱 Seeding database...");

    // ------------------------------------------------------------
    // Merchant
    // ------------------------------------------------------------

    const [merchant] = await db
        .insert(merchants)
        .values({
            name: "QuickMart",
            slug: "quickmart",
            currency: "INR",
            isActive: true,
        })
        .onConflictDoUpdate({
            target: merchants.slug,
            set: {
                name: "QuickMart",
                currency: "INR",
                isActive: true,
                updatedAt: new Date(),
            },
        })
        .returning();

    if (!merchant) {
        throw new Error("Failed to create QuickMart merchant");
    }

    console.log(`✓ Merchant: ${merchant.name}`);

    // ------------------------------------------------------------
    // Categories
    // ------------------------------------------------------------

    const [groceries] = await db
        .insert(categories)
        .values({
            merchantId: merchant.id,
            name: "Groceries",
            slug: "groceries",
        })
        .onConflictDoUpdate({
            target: [categories.merchantId, categories.slug],
            set: {
                name: "Groceries",
            },
        })
        .returning();

    if (!groceries) {
        throw new Error("Failed to create Groceries category");
    }

    const [electronics] = await db
        .insert(categories)
        .values({
            merchantId: merchant.id,
            name: "Electronics",
            slug: "electronics",
        })
        .onConflictDoUpdate({
            target: [categories.merchantId, categories.slug],
            set: {
                name: "Electronics",
            },
        })
        .returning();

    if (!electronics) {
        throw new Error("Failed to create Electronics category");
    }

    console.log(`✓ Category: ${groceries.name}`);
    console.log(`✓ Category: ${electronics.name}`);

    // ------------------------------------------------------------
    // Products
    // ------------------------------------------------------------

    const [biryaniMasala] = await db
        .insert(products)
        .values({
            merchantId: merchant.id,
            categoryId: groceries.id,

            name: "Biryani Masala",
            slug: "biryani-masala",

            description: "Aromatic spice blend for making flavorful biryani.",

            // ₹120 = 12,000 paise
            price: 12000,
            currency: "INR",

            isActive: true,
        })
        .onConflictDoUpdate({
            target: [products.merchantId, products.slug],
            set: {
                categoryId: groceries.id,
                name: "Biryani Masala",
                description:
                    "Aromatic spice blend for making flavorful biryani.",
                price: 12000,
                currency: "INR",
                isActive: true,
                updatedAt: new Date(),
            },
        })
        .returning();

    if (!biryaniMasala) {
        throw new Error("Failed to create Biryani Masala");
    }

    const [inductionStove] = await db
        .insert(products)
        .values({
            merchantId: merchant.id,
            categoryId: electronics.id,

            name: "Induction Stove",
            slug: "induction-stove",

            description:
                "Compact induction stove suitable for everyday cooking.",

            // ₹1,499 = 149,900 paise
            price: 149900,
            currency: "INR",

            isActive: true,
        })
        .onConflictDoUpdate({
            target: [products.merchantId, products.slug],
            set: {
                categoryId: electronics.id,
                name: "Induction Stove",
                description:
                    "Compact induction stove suitable for everyday cooking.",
                price: 149900,
                currency: "INR",
                isActive: true,
                updatedAt: new Date(),
            },
        })
        .returning();

    if (!inductionStove) {
        throw new Error("Failed to create Induction Stove");
    }

    console.log(
        `✓ Product: ${biryaniMasala.name} - ₹${biryaniMasala.price / 100}`,
    );

    console.log(
        `✓ Product: ${inductionStove.name} - ₹${inductionStove.price / 100}`,
    );

    // ------------------------------------------------------------
    // Demo customer
    // ------------------------------------------------------------

    const [customer] = await db
        .insert(customers)
        .values({
            externalId: "demo-customer",
            name: "Demo Customer",
            email: "demo@example.com",
            phone: "9999999999",
        })
        .onConflictDoNothing()
        .returning();

    let demoCustomer = customer;

    // If it already existed, fetch it.
    if (!demoCustomer) {
        const existing = await db
            .select()
            .from(customers)
            .where(eq(customers.externalId, "demo-customer"))
            .limit(1);

        demoCustomer = existing[0];
    }

    if (!demoCustomer) {
        throw new Error("Failed to create/find demo customer");
    }

    console.log(`✓ Customer: ${demoCustomer.name}`);

    // ------------------------------------------------------------
    // Demo address
    // ------------------------------------------------------------

    const existingAddress = await db
        .select()
        .from(addresses)
        .where(eq(addresses.customerId, demoCustomer.id))
        .limit(1);

    if (existingAddress.length === 0) {
        await db.insert(addresses).values({
            customerId: demoCustomer.id,

            name: "Demo Customer",
            phone: "9999999999",

            addressLine1: "123 Demo Street",
            addressLine2: "Demo Area",

            city: "Bengaluru",
            state: "Karnataka",
            postalCode: "560001",
            country: "IN",
        });

        console.log("✓ Demo address created");
    } else {
        console.log("✓ Demo address already exists");
    }

    // ------------------------------------------------------------
    // Done
    // ------------------------------------------------------------

    console.log("\n🌱 Seed completed successfully!");

    console.log("\nMerchant:");
    console.log(`  ${merchant.name}`);
    console.log(`  ID: ${merchant.id}`);

    console.log("\nProducts:");
    console.log(`  ${biryaniMasala.name}: ₹${biryaniMasala.price / 100}`);
    console.log(`  ${inductionStove.name}: ₹${inductionStove.price / 100}`);

    console.log("\nDemo customer:");
    console.log(`  ${demoCustomer.name}`);
    console.log(`  ID: ${demoCustomer.id}`);
}

seed().catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
});
