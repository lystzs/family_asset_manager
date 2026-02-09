"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { VersionFooter } from "@/components/VersionFooter";
import { Menu } from "lucide-react";
import { APP_VERSION } from "@/lib/constants";

interface AppLayoutProps {
    children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-full w-full flex-col lg:flex-row">
            {/* Mobile Header */}
            <div className="flex h-14 items-center border-b border-border bg-background px-4 lg:hidden flex-shrink-0">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="mr-3 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80 transition-colors"
                >
                    <Menu className="h-5 w-5" />
                </button>
                <span className="font-bold tracking-tight text-lg">FAM {APP_VERSION}</span>
            </div>

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
                {children}
                <div className="lg:hidden h-10" /> {/* Spacer for mobile footer if needed or just bottom padding */}
            </main>

            {/* Version Footer - Fixed at bottom for desktop, maybe relative for mobile? 
          Original layout had it outside the flex row, which suggests it might have been overlapping or outside flow.
          In previous layout.tsx:
          <div className="flex w-full"> <Sidebar/> <main/> </div> <VersionFooter/>
          It seems VersionFooter was fixed or absolute? Let's check VersionFooter code if possible, or assume it's fixed.
          Wait, previous layout:
          body -> AccountProvider -> div.flex.w-full -> Sidebar, Main
                                  -> VersionFooter
          Since body has h-screen overflow-hidden, and div.flex.w-full didn't have h-full?
          Sidebar has h-screen.
          Actually, let's keep VersionFooter logic simple.
          If Sidebar is fixed on mobile, VersionFooter should be visible.
      */}
            <VersionFooter />
        </div>
    );
}
