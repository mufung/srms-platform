// ============================================================
// SRMS-1-LAYOUT-001: Root Layout
// Owner: MUFUNG ANGELBELL MBUYEH
// Description: The main wrapper for all pages in the SRMS web app
// This renders on every single page
// ============================================================

import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';

// SRMS-1-LAYOUT-002: SEO Metadata for the platform
export const metadata: Metadata = {
  title: {
    default: 'SRMS Platform - Student Result Management System',
    template: '%s | SRMS Platform',
  },
  description: 'Enterprise-grade Student Result Management System. Teachers upload results, students view and raise complaints, parents stay informed. Powered by AWS.',
  keywords: ['student results', 'result management', 'school system', 'Cameroon', 'GCE', 'SRMS'],
  authors: [
    {
      name: 'MUFUNG ANGELBELL MBUYEH',
      url: 'mailto:mufungangelbellmbuyeh@gmail.com',
    },
  ],
  creator: 'MUFUNG ANGELBELL MBUYEH',
  publisher: 'SRMS Platform',
  applicationName: 'SRMS Platform',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    title: 'SRMS Platform - Student Result Management System',
    description: 'Professional result management platform for schools and exam boards.',
    siteName: 'SRMS Platform',
    locale: 'en_CM',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SRMS Platform',
    description: 'Professional result management for schools and exam boards.',
  },
  icons: {
    icon: '/icons/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
};

// SRMS-1-LAYOUT-003: Viewport settings for mobile responsiveness
export const viewport: Viewport = {
  themeColor: '#0f172a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

// ============================================================
// SRMS-1-LAYOUT-010: ROOT LAYOUT COMPONENT
// ============================================================
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* SRMS-1-LAYOUT-011: Google Fonts preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* SRMS-1-LAYOUT-012: Leaflet CSS for the map */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="bg-srms-primary-950 text-slate-200 font-body antialiased">
        {/* SRMS-1-LAYOUT-013: Main app wrapper */}
        <div id="srms-app" className="min-h-screen flex flex-col">
          {children}
        </div>

        {/* SRMS-1-LAYOUT-014: Platform attribution (hidden, accessible) */}
        <div className="sr-only" aria-hidden="true">
          SRMS Platform - Built by MUFUNG ANGELBELL MBUYEH - AWS Solutions Architect - Yaoundé, Cameroon
        </div>
      </body>
    </html>
  );
}