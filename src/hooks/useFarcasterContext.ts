import { useEffect, useState } from 'react';

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
}

/**
 * Hook to detect if the app is running in a Farcaster environment
 * Returns the Farcaster SDK instance, context, and user profile if available
 * Loads user profile immediately from context (fast, no auth required)
 */
export function useFarcasterContext() {
  const [sdk, setSdk] = useState<any>(null);
  const [isFarcasterContext, setIsFarcasterContext] = useState(false);
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          setUser(null);
          setIsLoading(false);
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
            setUser(null);
            setIsLoading(false);
            return;
          }

          // Load user profile immediately from context (fast, no auth needed)
          if (context.user) {
            setUser({
              fid: context.user.fid,
              username: context.user.username || '',
              displayName: context.user.displayName || context.user.username || '',
              pfpUrl: context.user.pfpUrl || '',
            });
          }

          // Verify wallet API is available (for wallet address)
          if (sdkInstance.wallet &&
              typeof sdkInstance.wallet.getEthereumProvider === 'function') {
            setSdk(sdkInstance);
            setIsFarcasterContext(true);
          } else {
            // SDK loaded but missing wallet API
            console.log('SDK loaded but missing wallet API');
            setIsFarcasterContext(false);
            setSdk(null);
          }
        } catch (contextError) {
          // Context check failed - not in Farcaster context
          console.log('Not in Farcaster Mini App context:', contextError);
          setIsFarcasterContext(false);
          setSdk(null);
          setUser(null);
        }
      } catch (error) {
        // SDK not available - not in Farcaster context
        console.log('Not in Farcaster context:', error);
        setIsFarcasterContext(false);
        setSdk(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkFarcasterContext();
  }, []);

  return {
    isFarcasterContext,
    sdk,
    user,
    isLoading,
  };
}
