import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ad Wars — The Living Advertising Battlefield',
  description: 'Pay to claim territory on a shared 64×64 grid. Anyone can conquer anyone else. 35% of every conquest goes to charity. The battlefield is live.',
  openGraph: {
    title: 'Ad Wars',
    description: 'The internet\'s first living ad battlefield. Pay. Conquer. Give.',
    url: 'https://adwars.live',
    siteName: 'Ad Wars',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ad Wars',
    description: 'Pay to conquer. 35% goes to charity.',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://adwars.live'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
