import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

/**
 * Hook to initialize and manage Farcaster Mini App SDK
 * This ensures the app is ready and the splash screen is hidden
 */
export function useFarcasterSDK() {
  useEffect(() => {
    // Initialize the SDK when the app is ready
    const initSDK = async () => {
      try {
        // Call ready() to hide the splash screen and show the app content
        await sdk.actions.ready();
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
