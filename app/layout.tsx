import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hedera Galaxy',
  description: 'Explore Hedera projects in a 3D galaxy visualization',
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