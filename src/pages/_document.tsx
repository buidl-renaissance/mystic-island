import { Html, Head, Main, NextScript } from "next/document";
import { ServerStyleSheet } from "styled-components";
import type { DocumentContext, DocumentInitialProps } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Farcaster Mini App Meta Tags */}
        <meta name="farcaster:app" content="Mystic Island" />
        <meta property="og:title" content="Mystic Island – Build Your World. Grow Your Community." />
        <meta property="og:description" content="Mystic Island is a collaborative creation engine where communities form their own realms, build powerful Totems together, and connect with other Islands through quests, relics, and cross-realm alliances." />
        <meta property="og:image" content="/images/luma.png" />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

Document.getInitialProps = async (ctx: DocumentContext): Promise<DocumentInitialProps> => {
  const sheet = new ServerStyleSheet();
  const originalRenderPage = ctx.renderPage;

  try {
    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App) => (props) => sheet.collectStyles(<App {...props} />),
      });

    const initialProps = await ctx.defaultGetInitialProps(ctx);

    return {
      ...initialProps,
      styles: (
        <>
          {initialProps.styles}
          {sheet.getStyleElement()}
        </>
      ),
    };
  } finally {
    sheet.seal();
  }
};
