import { paymentMiddleware } from 'x402-next';
import type { NextRequest } from 'next/server';
// import { facilitator } from "@coinbase/x402"; // For mainnet

// Configure the payment middleware
const payToAddress = (process.env.PAYMENT_RECIPIENT_ADDRESS || "0x4200000000000000000000000000000000000006") as `0x${string}`;

// Wrap the middleware to add logging
const baseMiddleware = paymentMiddleware(
  payToAddress, // your receiving wallet address
  {  // Route configurations for protected endpoints
    '/api/purchase-item': {
      price: '$0.01',
      network: "base-sepolia", // for mainnet, use "base"
      config: {
        description: 'Purchase game items',
        mimeType: "application/json",
      }
    },
  },
  {
    url: "https://x402.org/facilitator", // for testnet
    // For mainnet, use: facilitator (from @coinbase/x402)
  }
);

// Wrap with logging to debug
export const middleware = async (request: NextRequest) => {
  console.log("=== MIDDLEWARE RUNNING ===");
  console.log("Path:", request.nextUrl.pathname);
  console.log("Method:", request.method);
  console.log("Has X-PAYMENT header:", !!request.headers.get("X-PAYMENT"));
  
  const response = await baseMiddleware(request);
  
  console.log("=== MIDDLEWARE RESPONSE ===");
  console.log("Status:", response.status);
  console.log("Has X-PAYMENT-RESPONSE header:", !!response.headers.get("X-PAYMENT-RESPONSE"));
  const paymentResponseHeader = response.headers.get("X-PAYMENT-RESPONSE");
  if (paymentResponseHeader) {
    console.log("X-PAYMENT-RESPONSE value (first 100 chars):", paymentResponseHeader.substring(0, 100));
  }
  
  return response;
};

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/api/purchase-item/:path*',
  ],
  runtime: "nodejs",
};

