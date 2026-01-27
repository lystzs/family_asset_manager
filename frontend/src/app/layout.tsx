import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { AccountProvider } from "@/context/AccountContext";
import { VersionFooter } from "@/components/VersionFooter";

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
          <div className="flex w-full">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8">
              {children}
            </main>
          </div>
          <VersionFooter />
        </AccountProvider>
      </body>
    </html>
  );
}
