import { useEffect, useState } from 'react';

/**
 * Hook to initialize and manage Farcaster Mini App SDK
 * This ensures the app is ready and the splash screen is hidden
 * 
 * Note: SDK is only loaded on the client side to avoid SSR issues
 */
export function useFarcasterSDK() {
  const [sdk, setSdk] = useState<any>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Dynamically import the SDK only on the client
    const initSDK = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const farcasterSDK = await import('@farcaster/miniapp-sdk');
        const sdkInstance = farcasterSDK.sdk;
        setSdk(sdkInstance);

        // Call ready() to hide the splash screen and show the app content
        await sdkInstance.actions.ready();
        console.log('Farcaster Mini App SDK initialized');
      } catch (error) {
        console.error('Error initializing Farcaster SDK:', error);
        // Continue even if SDK initialization fails (for non-Farcaster environments)
      }
    };

    initSDK();
  }, []);

  return {
    sdk,
  };
}
