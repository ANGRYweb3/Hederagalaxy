import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hedera Galaxy',
  description: 'Hedera Galaxy: A 3D platform on Hedera Network for projects & creators. Add yours as a new star in the galaxy!',
  icons: {
    icon: '/sitelogo.png',
    apple: '/sitelogo.png',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-black text-white">{children}</body>
    </html>
  );
} 