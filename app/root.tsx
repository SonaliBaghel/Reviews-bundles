import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { AppProvider as PolarisAppProvider, Frame } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";
import APP_CONFIG from "./app.config";

export function links() {
  return [
    { rel: "preconnect", href: APP_CONFIG.SHOPIFY.CDN_BASE_URL },
    {
      rel: "stylesheet",
      href: APP_CONFIG.SHOPIFY.FONTS_URL,
    },
  ];
}

export default function App() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <PolarisAppProvider i18n={enTranslations}>

          <Frame>
            <Outlet />
          </Frame>
        </PolarisAppProvider>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}