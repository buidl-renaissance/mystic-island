import { useEffect, useState } from 'react';

/**
 * Hook to detect if the app is running in a Farcaster environment
 * Returns the Farcaster SDK instance if available, null otherwise
 */
export function useFarcasterContext() {
  const [sdk, setSdk] = useState<any>(null);
  const [isFarcasterContext, setIsFarcasterContext] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    const checkFarcasterContext = async () => {
      try {
        // Try to dynamically import the Farcaster SDK
        const farcasterSDK = await import('@farcaster/miniapp-sdk');
        const sdkInstance = farcasterSDK.sdk;
        
        if (!sdkInstance) {
          setIsFarcasterContext(false);
          setSdk(null);
          return;
        }
        
        // Check if we're actually in a Farcaster Mini App context
        // by checking if context is available
        try {
          const context = await sdkInstance.context;
          if (!context) {
            // SDK loaded but not in Farcaster Mini App context
            console.log('SDK loaded but not in Farcaster Mini App context');
            setIsFarcasterContext(false);
            setSdk(null);
            return;
          }
        } catch (contextError) {
          // Context check failed - not in Farcaster context
          console.log('Not in Farcaster Mini App context:', contextError);
          setIsFarcasterContext(false);
          setSdk(null);
          return;
        }
        
        // Verify required APIs are available
        if (sdkInstance.quickAuth && 
            sdkInstance.wallet &&
            typeof sdkInstance.quickAuth.getToken === 'function' &&
            typeof sdkInstance.wallet.getEthereumProvider === 'function') {
          setSdk(sdkInstance);
          setIsFarcasterContext(true);
        } else {
          // SDK loaded but missing required APIs
          console.log('SDK loaded but missing required APIs');
          setIsFarcasterContext(false);
          setSdk(null);
        }
      } catch (error) {
        // SDK not available - not in Farcaster context
        console.log('Not in Farcaster context:', error);
        setIsFarcasterContext(false);
        setSdk(null);
      }
    };

    checkFarcasterContext();
  }, []);

  return {
    isFarcasterContext,
    sdk,
  };
}
