import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Link from "next/link";
import { CDPReactProvider, type Config, type Theme } from "@coinbase/cdp-react";
import { CDPHooksProvider } from "@coinbase/cdp-hooks";
import { useAutoDeployWallet } from "@/hooks/useAutoDeployWallet";
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
  background-color: #ffffff;
  border-bottom: 1px solid #dcdfe4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 100;
`;

const Logo = styled(Link)`
  font-size: 20px;
  font-weight: 700;
  color: #098551;
  text-decoration: none;
`;

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isOnboardingPage = router.pathname === '/onboarding';
  const isStartPage = router.pathname === '/start';
  const isDeployWalletPage = router.pathname === '/deploy-wallet';
  const isAuthPage = router.pathname === '/auth';
  const isExplorePage = router.pathname === '/explore';
  
  // Hide top bar on onboarding and start pages
  const showTopBar = !isOnboardingPage && !isStartPage;

  // Only run auto-deployment on pages where it makes sense
  // Skip on deploy-wallet, auth, and explore pages to avoid redirect loops
  const shouldAutoDeploy = !isDeployWalletPage && !isAuthPage && !isExplorePage;
  
  if (shouldAutoDeploy) {
    useAutoDeployWallet();
  }

  return (
    <>
      {showTopBar && (
        <TopBar>
          <Logo href="/">Mystic Island</Logo>
          <AccountDropdown />
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
