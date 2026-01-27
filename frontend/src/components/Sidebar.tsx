"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Settings, UserCircle, Users, CreditCard, TrendingUp, BarChart3, LineChart } from "lucide-react";
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

export function Sidebar() {
    const pathname = usePathname();
    const { accounts, selectedAccount, selectAccount } = useAccount();

    return (
        <div className="flex h-screen w-64 flex-col border-r border-border bg-muted/30 p-4 text-foreground">
            <div className="mb-8 flex items-center gap-2 px-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold">F</span>
                </div>
                <span className="text-xl font-bold tracking-tight">FAM v3.0</span>
            </div>

            <div className="mb-6 space-y-2 rounded-lg bg-card p-4 border border-border shadow-sm">
                <label className="text-xs font-semibold text-muted-foreground uppercase">계좌 선택</label>
                <select
                    className="w-full rounded bg-background p-2 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                    value={selectedAccount?.id || "all"}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (value === "all") {
                            selectAccount(null);
                        } else {
                            selectAccount(parseInt(value));
                        }
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

            <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}

                <div className="pt-4 pb-2 px-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">설정</p>
                </div>

                {settingItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto border-t border-border pt-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border">
                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="text-xs">
                        <p className="font-medium text-foreground">
                            {selectedAccount ? selectedAccount.alias : "전체 계좌"}
                        </p>
                        <p className="text-muted-foreground">
                            {selectedAccount ? selectedAccount.cano : `${accounts.length}개 계좌`}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
