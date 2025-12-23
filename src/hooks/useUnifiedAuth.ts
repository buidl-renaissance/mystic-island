import { useFarcasterAuth } from './useFarcasterAuth';
import { useIsSignedIn, useEvmAddress, useCurrentUser } from '@coinbase/cdp-hooks';
import { useFarcasterContext } from './useFarcasterContext';

export type AuthType = 'farcaster' | 'cdp';

interface UnifiedAuthState {
  isSignedIn: boolean;
  evmAddress: string | null;
  currentUser: {
    fid?: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
    evmAccounts: string[];
    [key: string]: any;
  } | null;
  authType: AuthType;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Unified authentication hook that prefers Farcaster auth but falls back to CDP
 * Provides a consistent interface regardless of auth method
 */
export function useUnifiedAuth(): UnifiedAuthState {
  const { isFarcasterContext } = useFarcasterContext();
  const farcasterAuth = useFarcasterAuth();
  
  // CDP hooks - these will be used as fallback
  const cdpIsSignedIn = useIsSignedIn();
  const cdpEvmAddress = useEvmAddress();
  const cdpCurrentUser = useCurrentUser();

  // If in Farcaster context and still loading, show loading state instead of "not signed in"
  // This prevents the flash of "sign in" button for Farcaster users
  if (isFarcasterContext && farcasterAuth.isLoading) {
    return {
      isSignedIn: false,
      evmAddress: null,
      currentUser: null,
      authType: 'farcaster',
      signOut: async () => {},
      isLoading: true, // Indicate we're loading Farcaster auth
    };
  }

  // Use Farcaster auth if:
  // 1. We're in Farcaster context AND
  // 2. Farcaster auth is authenticated (not just loading)
  if (isFarcasterContext && farcasterAuth.isAuthenticated && farcasterAuth.walletAddress) {
    return {
      isSignedIn: true,
      evmAddress: farcasterAuth.walletAddress,
      currentUser: {
        fid: farcasterAuth.fid || undefined,
        username: farcasterAuth.username || undefined,
        displayName: farcasterAuth.displayName || undefined,
        pfpUrl: farcasterAuth.pfpUrl || undefined,
        evmAccounts: farcasterAuth.walletAddress ? [farcasterAuth.walletAddress] : [],
      },
      authType: 'farcaster',
      signOut: farcasterAuth.signOut,
      isLoading: false,
    };
  }

  // If not in Farcaster context OR Farcaster auth failed/not available,
  // immediately use CDP auth (don't wait for Farcaster to finish loading)
  // This ensures balances and other features work immediately

  // Use CDP auth
  // useEvmAddress returns { evmAddress: string | null } - extract the evmAddress property
  const cdpAddressValue = (cdpEvmAddress as any)?.evmAddress ?? 
                         (typeof cdpEvmAddress === 'string' ? cdpEvmAddress : null);
  
  // Get evmAccounts from currentUser - useCurrentUser returns { currentUser: User | null }
  const cdpUser = cdpCurrentUser?.currentUser;
  const cdpEvmAccounts = cdpUser?.evmAccounts || [];
  
  // Use evmAddress from hook, or fall back to first evmAccount
  const finalAddress = cdpAddressValue || 
                      (cdpEvmAccounts.length > 0 
                        ? (typeof cdpEvmAccounts[0] === 'string' 
                            ? cdpEvmAccounts[0] 
                            : (cdpEvmAccounts[0] as any)?.address)
                        : null);

  // Transform CDP user to match our unified interface
  const transformedUser = cdpUser ? {
    ...cdpUser,
    evmAccounts: (cdpUser.evmAccounts || []).map(addr => typeof addr === 'string' ? addr : String(addr)),
  } : null;

  return {
    isSignedIn: cdpIsSignedIn.isSignedIn || false,
    evmAddress: finalAddress,
    currentUser: transformedUser,
    authType: 'cdp',
    signOut: async () => {
      // CDP sign out would be handled by CDP components
      // For now, we'll just return
    },
    isLoading: false,
  };
}
