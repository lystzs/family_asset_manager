"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, UserCircle, Users, CreditCard, TrendingUp, BarChart3, LineChart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "@/context/AccountContext";

const navItems = [
    { name: "대시보드", href: "/", icon: LayoutDashboard },
    { name: "포트폴리오", href: "/portfolio", icon: BarChart3 },
    { name: "자산 변동 내역", href: "/history", icon: LineChart },
];

const settingItems = [
    { name: "구성원 관리", href: "/settings/members", icon: Users },
    { name: "계좌 관리", href: "/settings/accounts", icon: CreditCard },
    { name: "토큰 관리", href: "/settings/tokens", icon: Settings },
    { name: "종목 마스터", href: "/settings/stocks", icon: TrendingUp },
    { name: "시스템 설정", href: "/settings/system", icon: Settings },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { accounts, selectedAccount, selectAccount } = useAccount();

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card/95 backdrop-blur shadow-xl lg:shadow-none lg:static lg:bg-muted/30 transition-transform duration-300 ease-in-out lg:translate-x-0 p-4 text-foreground",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Header */}
                <div className="mb-8 flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
                            <span className="text-primary-foreground font-bold">F</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight">FAM v3.0</span>
                    </div>
                    {/* Close Button (Mobile Only) */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1 rounded-md hover:bg-muted text-muted-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Account Select */}
                <div className="mb-6 space-y-2 rounded-lg bg-background p-4 border border-border shadow-sm">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">계좌 선택</label>
                    <select
                        className="w-full rounded bg-muted/50 p-2 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                        value={selectedAccount?.id || "all"}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value === "all") {
                                selectAccount(null);
                            } else {
                                selectAccount(parseInt(value));
                            }
                            if (onClose) onClose(); // Close sidebar on mobile selection
                        }}
                    >
                        <option value="all">전체</option>
                        {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.user_name} - {a.alias}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                                {item.name}
                            </Link>
                        );
                    })}

                    <div className="pt-6 pb-2 px-3">
                        <div className="h-px bg-border mb-4" />
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">설정</p>
                    </div>

                    {settingItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer User Info */}
                <div className="mt-auto border-t border-border pt-4">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-muted/30">
                        <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center border border-border shadow-sm">
                            <UserCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-xs overflow-hidden">
                            <p className="font-medium text-foreground truncate">
                                {selectedAccount ? selectedAccount.alias : "전체 계좌"}
                            </p>
                            <p className="text-muted-foreground truncate">
                                {selectedAccount ? selectedAccount.cano : `${accounts.length}개 계좌`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
