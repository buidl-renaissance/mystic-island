# Farcaster Mini App Setup Guide

This application has been configured to work as a Farcaster mini app. Follow these steps to complete the setup:

## ✅ Completed Setup

1. **Installed Farcaster Mini App SDK** (`@farcaster/miniapp-sdk`)
2. **Created configuration file** (`public/.well-known/farcaster.json`)
3. **Integrated SDK initialization** in `_app.tsx`
4. **Added Farcaster meta tags** in `_document.tsx`
5. **Created webhook endpoint** (`/api/farcaster/webhook`)

## 📋 Next Steps

### 1. Generate Domain Manifest

To complete the setup, you need to generate the `accountAssociation` values in `public/.well-known/farcaster.json`:

1. **Enable Developer Mode in Farcaster:**
   - Log in to Farcaster on your mobile or desktop
   - Navigate to [Developer Tools Settings](https://farcaster.xyz/~/settings/developer-tools)
   - Toggle on "Developer Mode"

2. **Generate Domain Manifest:**
   - Open the Warpcast mobile app
   - Go to `Settings > Developer > Domains`
   - Enter your domain (e.g., `yourdomain.com`)
   - Generate the domain manifest
   - Copy the generated `accountAssociation` values (header, payload, signature)

3. **Update `farcaster.json`:**
   - Open `public/.well-known/farcaster.json`
   - Replace the empty `accountAssociation` object with the values from Warpcast:
     ```json
     {
       "accountAssociation": {
         "header": "your-header-value",
         "payload": "your-payload-value",
         "signature": "your-signature-value"
       },
       ...
     }
     ```

### 2. Update Domain URLs

Update all placeholder URLs in `public/.well-known/farcaster.json`:

- Replace `https://yourdomain.com` with your actual domain
- Update `iconUrl` to point to your favicon
- Update `splashImageUrl` to point to your splash screen image
- Update `webhookUrl` to point to your deployed webhook endpoint

### 3. Deploy Your Application

1. Deploy your Next.js application to a hosting service (Vercel, Netlify, etc.)
2. Ensure the `.well-known/farcaster.json` file is accessible at:
   `https://yourdomain.com/.well-known/farcaster.json`
3. Test the webhook endpoint is accessible at:
   `https://yourdomain.com/api/farcaster/webhook`

### 4. Test Your Mini App

1. **Local Testing:**
   - Run your app locally: `yarn dev`
   - Use a tool like `ngrok` to expose it: `ngrok http 3000`
   - Use the generated URL to test in Farcaster

2. **Production Testing:**
   - Share your mini app URL in Farcaster
   - Users can access it through Warpcast or other Farcaster clients

## 🔧 Configuration Details

### SDK Integration

The Farcaster SDK is automatically initialized when your app loads via the `useFarcasterSDK` hook in `_app.tsx`. This:
- Hides the splash screen when the app is ready
- Enables Farcaster-specific features
- Works gracefully in non-Farcaster environments (won't break if SDK isn't available)

### Webhook Endpoint

The webhook endpoint at `/api/farcaster/webhook` receives events from Farcaster. Currently, it logs events. You can extend it to:
- Track user analytics
- Send notifications
- Perform server-side actions
- Handle frame interactions

### Meta Tags

Farcaster-specific meta tags have been added to `_document.tsx` to ensure proper display in Farcaster clients.

## 📚 Resources

- [Farcaster Mini Apps Documentation](https://docs.farcaster.xyz/miniapps)
- [Farcaster Mini App SDK](https://github.com/farcasterxyz/miniapp-sdk)
- [Warpcast Developer Tools](https://warpcast.com/~/settings/developer-tools)

## 🐛 Troubleshooting

- **SDK not initializing:** Check browser console for errors. The SDK only works in Farcaster clients.
- **Webhook not receiving events:** Ensure your domain is properly configured and the webhook URL is accessible.
- **Splash screen not hiding:** Make sure `sdk.actions.ready()` is being called after your app is fully loaded.
