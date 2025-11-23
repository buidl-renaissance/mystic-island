import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Link from "next/link";
import { CDPReactProvider, type Config, type Theme } from "@coinbase/cdp-react";
import { CDPHooksProvider } from "@coinbase/cdp-hooks";
import { useAutoDeployWallet } from "@/hooks/useAutoDeployWallet";
import { useUserStats } from "@/hooks/useUserStats";
import { useIsSignedIn } from "@coinbase/cdp-hooks";
import styled from "styled-components";
import AccountDropdown from "@/components/AccountDropdown";

const config: Config = {
  projectId: "91f1f5ba-475e-4652-83a5-81f337f6d802",
  ethereum: {
    createOnLogin: "smart",
  },
  appName: "Mystic Island",
  appLogoUrl: "",
  authMethods: ["email", "sms", "oauth:google", "oauth:apple", "oauth:x"],
  showCoinbaseFooter: true,
};

const theme: Partial<Theme> = {
  "colors-bg-default": "#ffffff",
  "colors-bg-alternate": "#eef0f3",
  "colors-bg-primary": "#098551",
  "colors-bg-secondary": "#eef0f3",
  "colors-fg-default": "#0a0b0d",
  "colors-fg-muted": "#5b616e",
  "colors-fg-primary": "#098551",
  "colors-fg-onPrimary": "#ffffff",
  "colors-fg-onSecondary": "#0a0b0d",
  "colors-fg-positive": "#098551",
  "colors-fg-negative": "#cf202f",
  "colors-fg-warning": "#ed702f",
  "colors-line-default": "#dcdfe4",
  "colors-line-heavy": "#9397a0",
  "borderRadius-cta": "var(--cdp-web-borderRadius-full)",
  "borderRadius-link": "var(--cdp-web-borderRadius-full)",
  "borderRadius-input": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-select-trigger": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-select-list": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-modal": "var(--cdp-web-borderRadius-xl)",
  "font-family-sans": "'Inter', 'Inter Fallback'",
};

const TopBar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background-color: #0A1410;
  border-bottom: 1px solid rgba(232, 168, 85, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 100;
`;

const Logo = styled(Link)`
  font-size: 20px;
  font-weight: 700;
  color: #E8A855;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: #C76A2A;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-right: 1rem;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(45, 90, 61, 0.3);
  border: 1px solid rgba(232, 168, 85, 0.2);
  border-radius: 8px;
  color: #F5F5F5;
  font-size: 0.9rem;
  font-weight: 600;
`;

const StatValue = styled.span`
  color: #E8A855;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatEmoji = styled.span`
  font-size: 1.1rem;
  line-height: 1;
`;

function AppContent({ Component, pageProps }: { Component: AppProps['Component']; pageProps: AppProps['pageProps'] }) {
  const router = useRouter();
  const { isSignedIn } = useIsSignedIn();
  const { magicBalance, isLoading: statsLoading } = useUserStats();
  const isOnboardingPage = router.pathname === '/onboarding';
  const isStartPage = router.pathname === '/start';
  const isDeployWalletPage = router.pathname === '/deploy-wallet';
  const isAuthPage = router.pathname === '/auth';
  const isExplorePage = router.pathname === '/explore';
  const isIndexPage = router.pathname === '/';
  const isAboutPage = router.pathname === '/about';
  
  // Hide top bar on onboarding, start, index, and about pages
  const showTopBar = !isOnboardingPage && !isStartPage && !isIndexPage && !isAboutPage;

  // Only run auto-deployment on pages where it makes sense
  // Skip on deploy-wallet, auth, and explore pages to avoid redirect loops
  const shouldAutoDeploy = !isDeployWalletPage && !isAuthPage && !isExplorePage;
  
  // Always call the hook (hooks must be called unconditionally)
  // The hook itself will handle the conditional logic
  useAutoDeployWallet(shouldAutoDeploy);

  // Format magic balance for display
  const formatMagicBalance = (balance: string | null) => {
    if (!balance) return "0";
    const num = parseFloat(balance);
    if (num === 0) return "0";
    if (num < 0.01) return "<0.01";
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return `${(num / 1000).toFixed(2)}K`;
    return `${(num / 1000000).toFixed(2)}M`;
  };

  return (
    <>
      {showTopBar && (
        <TopBar>
          <Logo href="/">Mystic Island</Logo>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {isSignedIn && (
              <StatsContainer>
                <StatItem>
                  <StatValue>
                    <StatEmoji>✨</StatEmoji>
                    <span>{statsLoading ? "..." : formatMagicBalance(magicBalance)}</span>
                  </StatValue>
                </StatItem>
              </StatsContainer>
            )}
            <AccountDropdown />
          </div>
        </TopBar>
      )}
      <div style={{ marginTop: showTopBar ? '64px' : '0' }}>
        <Component {...pageProps} />
      </div>
    </>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CDPHooksProvider config={config}>
      <CDPReactProvider config={config} theme={theme}>
        <AppContent Component={Component} pageProps={pageProps} />
      </CDPReactProvider>
    </CDPHooksProvider>
  );
}
