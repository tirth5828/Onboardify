import type { Metadata } from "next";

import { AppProviders } from "@/components/app-providers";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  title: "Mainnet Ready | Monitored Testnet Environment",
  description:
    "A monitored testnet environment for practicing onchain custody, swaps, lending, and guarded settlement.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <SiteHeader />
          <main>{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
