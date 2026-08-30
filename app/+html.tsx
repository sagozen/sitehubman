import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />

        {/* Theme & PWA */}
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="dark" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SiteHub Man" />
        <meta name="application-name" content="SiteHub Man" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#000000" />

        {/* Preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://identitytoolkit.googleapis.com" />

        {/* Fonts — Inter as system font fallback */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />

        {/* Favicon & Apple Touch */}
        <link rel="icon" href="/assets/images/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/images/icon.png" />

        {/* Expo Router scroll reset */}
        <ScrollViewStyleReset />

        {/* Base styles for web */}
        <style dangerouslySetInnerHTML={{ __html: `
          html, body { background-color: #000000; margin: 0; padding: 0; height: 100%; }
          #root { display: flex; flex-direction: column; min-height: 100%; }
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
