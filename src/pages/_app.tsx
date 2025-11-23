import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { CDPReactProvider, type Config, type Theme } from "@coinbase/cdp-react";
import { CDPHooksProvider } from "@coinbase/cdp-hooks";
import Navigation from "@/components/Navigation";
import { useAutoDeployWallet } from "@/hooks/useAutoDeployWallet";

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

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isHomePage = router.pathname === '/';
  const isAboutPage = router.pathname === '/about';
  const isOnboardingPage = router.pathname === '/onboarding';
  const isDeployWalletPage = router.pathname === '/deploy-wallet';
  const isAuthPage = router.pathname === '/auth';
  const isExplorePage = router.pathname === '/explore';
  const showNavigation = !isHomePage && !isAboutPage && !isOnboardingPage;

  // Only run auto-deployment on pages where it makes sense
  // Skip on deploy-wallet, auth, and explore pages to avoid redirect loops
  const shouldAutoDeploy = !isDeployWalletPage && !isAuthPage && !isExplorePage;
  
  if (shouldAutoDeploy) {
    useAutoDeployWallet();
  }

  return (
    <>
      {showNavigation && <Navigation />}
      <Component {...pageProps} />
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
