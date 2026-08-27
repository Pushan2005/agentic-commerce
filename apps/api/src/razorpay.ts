const RAZORPAY_API = "https://api.razorpay.com/v1";

function getCredentials() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error("Razorpay credentials are not configured");
    }

    return {
        keyId,
        keySecret,
    };
}

export async function createRazorpayOrder({
    amount,
    currency = "INR",
    receipt,
}: {
    amount: number;
    currency?: string;
    receipt: string;
}) {
    const { keyId, keySecret } = getCredentials();

    const credentials = btoa(`${keyId}:${keySecret}`);

    const response = await fetch(`${RAZORPAY_API}/orders`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            amount,
            currency,
            receipt,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Razorpay error:", data);
        throw new Error("Failed to create Razorpay order");
    }

    return data;
}
