import { useEffect, useState, useCallback } from 'react';
import { useFarcasterContext } from './useFarcasterContext';

interface FarcasterAuthState {
  isAuthenticated: boolean;
  fid: number | null;
  walletAddress: string | null;
  token: string | null;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for Farcaster Quick Auth and wallet access
 * Handles authentication via Farcaster SDK and provides wallet address
 */
export function useFarcasterAuth() {
  const { isFarcasterContext, sdk } = useFarcasterContext();
  const [authState, setAuthState] = useState<FarcasterAuthState>({
    isAuthenticated: false,
    fid: null,
    walletAddress: null,
    token: null,
    username: null,
    displayName: null,
    pfpUrl: null,
    isLoading: true,
    error: null,
  });

  const authenticate = useCallback(async () => {
    if (!isFarcasterContext || !sdk) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: null, // Don't set error - just not in Farcaster context
      }));
      return;
    }

    // Get context and user details
    let context: any = null;
    let user: any = null;
    
    try {
      context = await sdk.context;
      if (!context) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: null, // Not an error, just not in Farcaster context
        }));
        return;
      }
      
      // Get user details from context
      user = context.user;
    } catch (contextError) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: null, // Not an error, just not in Farcaster context
      }));
      return;
    }

    // Check if quickAuth is available
    if (!sdk.quickAuth || typeof sdk.quickAuth.getToken !== 'function') {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: new Error('Farcaster Quick Auth not available'),
      }));
      return;
    }

    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Get JWT token via Quick Auth
      const tokenResult = await sdk.quickAuth.getToken();
      
      // Handle both { token } and direct token response
      const token = tokenResult?.token || tokenResult;
      
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token received from Farcaster');
      }
      
      // Verify token and extract FID (optional - can also verify on backend)
      // For now, we'll just store the token and get wallet
      
      // Get wallet address via EIP-1193 provider
      // Check if wallet API is available
      if (!sdk.wallet || typeof sdk.wallet.getEthereumProvider !== 'function') {
        throw new Error('Farcaster wallet API not available');
      }
      
      const provider = await sdk.wallet.getEthereumProvider();
      if (!provider) {
        throw new Error('Failed to get Ethereum provider from Farcaster');
      }
      
      const accounts = await provider.request({ method: 'eth_accounts' });
      const walletAddress = accounts?.[0] || null;

      if (!walletAddress) {
        throw new Error('No wallet connected in Farcaster');
      }

      // Extract FID from token (basic parsing - full verification should be on backend)
      // Prefer FID from user context if available, otherwise from token
      let fid: number | null = user?.fid || null;
      if (!fid) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          fid = payload.sub ? (typeof payload.sub === 'string' ? parseInt(payload.sub) : payload.sub) : null;
        } catch (e) {
          console.warn('Could not extract FID from token:', e);
        }
      }

      // Get user profile details from context
      const username = user?.username || null;
      const displayName = user?.displayName || null;
      const pfpUrl = user?.pfpUrl || null;

      setAuthState({
        isAuthenticated: true,
        fid,
        walletAddress: walletAddress.toLowerCase(),
        token,
        username,
        displayName,
        pfpUrl,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Farcaster authentication error:', error);
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Authentication failed'),
      }));
    }
  }, [isFarcasterContext, sdk]);

  const signOut = useCallback(async () => {
    setAuthState({
      isAuthenticated: false,
      fid: null,
      walletAddress: null,
      token: null,
      username: null,
      displayName: null,
      pfpUrl: null,
      isLoading: false,
      error: null,
    });
  }, []);

  // Auto-authenticate when in Farcaster context
  useEffect(() => {
    if (isFarcasterContext && sdk) {
      authenticate();
    } else {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [isFarcasterContext, sdk, authenticate]);

  return {
    ...authState,
    authenticate,
    signOut,
  };
}
