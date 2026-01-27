import { AppLayout } from "@/components/AppLayout";
import { AccountProvider } from "@/context/AccountContext";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Asset Manager",
  description: "Advanced asset management for family",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden bg-background text-foreground antialiased">
        <AccountProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </AccountProvider>
      </body>
    </html>
  );
}
