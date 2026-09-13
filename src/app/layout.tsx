import type { Metadata, Viewport } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import FeedbackWidget from '@/components/ui/FeedbackWidget';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FBF9F5',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://sgnearby.fsyhub.com'),
  title: 'SG Nearby | See What’s Around Any Singapore Location',
  description:
    'Interactive Singapore map to see what’s nearby any home, condo, or postal code. Explore walking distance to hawker centres, MRT stations, bus stops, supermarkets, schools, and parks.',
  openGraph: {
    title: 'SG Nearby | See What’s Around Any Singapore Location',
    description:
      'Interactive Singapore map to see what’s nearby any home, condo, or postal code. Explore walking distance to hawker centres, MRT stations, bus stops, supermarkets, schools, and parks.',
    url: 'https://sgnearby.fsyhub.com',
    siteName: 'SG Nearby',
    images: [
      {
        url: '/og-image.png',
        width: 1024,
        height: 544,
        alt: 'SG Nearby Singapore Location & Amenities Map',
      },
    ],
    locale: 'en_SG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SG Nearby | See What’s Around Any Singapore Location',
    description:
      'Interactive Singapore map to see what’s nearby any home, condo, or postal code. Explore walking distance to hawker centres, MRT stations, bus stops, supermarkets, schools, and parks.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..800&family=Plus+Jakarta+Sans:wght@300..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-sans bg-[#FBF9F5] text-[#243324] selection:bg-[#E8DCC4] selection:text-[#1F2B1D] min-h-screen flex flex-col">
        {children}
        <FeedbackWidget />
      </body>
    </html>
  );
}
