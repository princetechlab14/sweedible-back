const paypal = require("@paypal/checkout-server-sdk");
require("dotenv").config();

const isLive = process.env.PAYPAL_MODE === "Live";

if (isLive && (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET)) {
    throw new Error("Missing PayPal Live Credentials!");
}

const environment = () =>
    isLive
        ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
        : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);

const client = () => new paypal.core.PayPalHttpClient(environment());

const paymentLinkCreate = async ({ totalAmount = 1, countryCode = "USD" }) => {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
            {
                amount: {
                    currency_code: countryCode,
                    value: totalAmount.toString(),
                },
            },
        ],
    });

    try {
        const order = await client().execute(request);
        const link = order.result && order.result.links.find(lk => lk.rel === "approve").href;
        if (!link) throw new Error("Failed to retrieve PayPal approval link.");
        return { status: true, message: "Payment Link Generated SucessFully.", data: { id: order.result.id, link } };
    } catch (err) {
        console.error("❌ PayPal Error:", err);
        return { status: false, message: "Failed to create payment." }
    }
};
module.exports = { paymentLinkCreate };
