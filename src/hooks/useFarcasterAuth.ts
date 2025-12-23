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
 * Hook for Farcaster authentication and wallet access
 * Loads user profile immediately from context (fast)
 * Only performs Quick Auth token verification when needed (for API calls)
 */
export function useFarcasterAuth() {
  const { isFarcasterContext, sdk, user, isLoading: contextLoading } = useFarcasterContext();
  const [authState, setAuthState] = useState<FarcasterAuthState>({
    isAuthenticated: false,
    fid: user?.fid || null,
    walletAddress: null,
    token: null,
    username: user?.username || null,
    displayName: user?.displayName || null,
    pfpUrl: user?.pfpUrl || null,
    isLoading: true,
    error: null,
  });

  // Load wallet address (fast, no auth needed)
  const loadWallet = useCallback(async () => {
    if (!isFarcasterContext || !sdk) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
      }));
      return;
    }

    try {
      // Get wallet address via EIP-1193 provider (fast, no auth needed)
      if (!sdk.wallet || typeof sdk.wallet.getEthereumProvider !== 'function') {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: null, // Wallet not available, but that's okay
        }));
        return;
      }
      
      const provider = await sdk.wallet.getEthereumProvider();
      if (!provider) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
        return;
      }
      
      const accounts = await provider.request({ method: 'eth_accounts' });
      const walletAddress = accounts?.[0] || null;

      // Update state with wallet address and user profile from context
      setAuthState(prev => ({
        ...prev,
        walletAddress: walletAddress ? walletAddress.toLowerCase() : null,
        fid: user?.fid || prev.fid,
        username: user?.username || prev.username,
        displayName: user?.displayName || prev.displayName,
        pfpUrl: user?.pfpUrl || prev.pfpUrl,
        isAuthenticated: !!walletAddress, // Authenticated if we have wallet
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading Farcaster wallet:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: null, // Don't treat as error - might just not be available
      }));
    }
  }, [isFarcasterContext, sdk, user]);

  // Get authentication token (only when needed for API calls)
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    if (!isFarcasterContext || !sdk) {
      return null;
    }

    // Check if quickAuth is available
    if (!sdk.quickAuth || typeof sdk.quickAuth.getToken !== 'function') {
      console.warn('Farcaster Quick Auth not available');
      return null;
    }

    try {
      // Get JWT token via Quick Auth (for API verification)
      const tokenResult = await sdk.quickAuth.getToken();
      const token = tokenResult?.token || tokenResult;
      
      if (!token || typeof token !== 'string') {
        return null;
      }

      // Store token in state
      setAuthState(prev => ({
        ...prev,
        token,
      }));

      return token;
    } catch (error) {
      console.error('Error getting Farcaster auth token:', error);
      return null;
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

  // Update user profile when context user changes
  useEffect(() => {
    if (user) {
      setAuthState(prev => ({
        ...prev,
        fid: user.fid,
        username: user.username,
        displayName: user.displayName,
        pfpUrl: user.pfpUrl,
      }));
    }
  }, [user]);

  // Load wallet address when in Farcaster context (fast, no auth needed)
  useEffect(() => {
    if (isFarcasterContext && sdk && !contextLoading) {
      loadWallet();
    } else if (!contextLoading) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [isFarcasterContext, sdk, contextLoading, loadWallet]);

  return {
    ...authState,
    getAuthToken, // Expose function to get token when needed
    signOut,
  };
}
