import type { Metadata, Viewport } from 'next';
import {themeBootstrap} from '../public/theme-system.mjs';
import {languageBootstrap} from '../public/language-system.mjs';
import {launchBootstrap} from '../public/launch-screen.mjs';

export const metadata: Metadata = {
  title: 'KoleQuant Age — Your health workspace',
  description: 'Review your health and lifestyle, calculate clinical PhenoAge from blood results, and keep your assessment history across devices.',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {width:'device-width',initialScale:1,viewportFit:'cover',interactiveWidget:'resizes-content'};

// Resolve appearance before the stylesheet paints, including returning visitors.

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="en" suppressHydrationWarning>
    <head>
      <script dangerouslySetInnerHTML={{__html: themeBootstrap}} />
      <script dangerouslySetInnerHTML={{__html: languageBootstrap}} />
      <script dangerouslySetInnerHTML={{__html: launchBootstrap}} />
      <link rel="stylesheet" href="/styles.css" />
      <link rel="stylesheet" href="/fonts.css" />
      <link rel="stylesheet" href="/themes.css" />
      <link rel="stylesheet" href="/app-screens.css" />
      <link rel="stylesheet" href="/launch-screen.css" />
    </head>
    <body>{children}</body>
  </html>;
}
