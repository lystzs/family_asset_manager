"use client";

import { useAccount } from "@/context/AccountContext";
import { fetchAssetHistory, fetchAllAssetHistory } from "@/services/api";
import { useEffect, useState } from "react";
import { AssetChart } from "@/components/AssetChart";
import { LineChart, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function HistoryPage() {
    const { selectedAccount, accounts } = useAccount();
    const [assetHistory, setAssetHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadHistory = async () => {
            setIsLoading(true);
            try {
                let data;
                if (selectedAccount) {
                    data = await fetchAssetHistory(selectedAccount.id);
                } else {
                    // All Accounts Aggregation
                    data = await fetchAllAssetHistory();
                }
                setAssetHistory(data);
            } catch (e) {
                console.error("Failed to fetch history", e);
                setAssetHistory([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadHistory();
    }, [selectedAccount]);

    if (accounts.length === 0) {
        return <div className="p-10 text-center text-muted-foreground">계좌가 없습니다.</div>;
    }

    // "All Accounts" logic supported now, so removing the early return for !selectedAccount

    // Calculate stats
    const totalRecords = assetHistory.length;
    const startAsset = totalRecords > 0 ? assetHistory[0].total_asset_amount : 0;
    const currentAsset = totalRecords > 0 ? assetHistory[totalRecords - 1].total_asset_amount : 0;
    const totalGrowth = currentAsset - startAsset;
    const growthRate = startAsset > 0 ? (totalGrowth / startAsset) * 100 : 0;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">자산 변동 내역</h1>
                <p className="text-sm text-muted-foreground">
                    {selectedAccount ? `${selectedAccount.alias} 계좌의` : "전체 계좌의 합산"} 일별 자산 성장 기록입니다.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">현재 총 자산</p>
                    <p className="text-2xl font-bold text-foreground">{currentAsset.toLocaleString()}원</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">기록 시작일 대비 자산 변동</p>
                    <div className={`flex items-center gap-2 text-2xl font-bold ${totalGrowth >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                        {totalGrowth >= 0 ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                        {Math.abs(totalGrowth).toLocaleString()}원
                    </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">누적 수익률 (기록 기준)</p>
                    <p className={`text-2xl font-bold ${growthRate >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                        {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(2)}%
                    </p>
                </div>
            </div>

            {/* Chart Section */}
            <div className="rounded-xl border border-border bg-card shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                    <LineChart className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold text-foreground">자산 성장 추이</h3>
                </div>
                <div className="h-[400px]">
                    <AssetChart data={assetHistory} />
                </div>
            </div>

            {/* Table Section */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">일별 상세 내역</h3>
                </div>
                {assetHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                                <tr>
                                    <th className="px-4 py-4 text-left font-medium">날짜</th>
                                    <th className="px-4 py-4 text-right font-medium">총 자산</th>
                                    <th className="px-4 py-4 text-right font-medium">주식 평가금</th>
                                    <th className="px-4 py-4 text-right font-medium">예수금</th>
                                    <th className="px-4 py-4 text-right font-medium">총 평가손익</th>
                                    <th className="px-4 py-4 text-right font-medium">수익률</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {[...assetHistory].reverse().map((record, i) => (
                                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-4 font-mono">{record.date}</td>
                                        <td className="px-4 py-4 text-right font-bold">{record.total_asset_amount.toLocaleString()}원</td>
                                        <td className="px-4 py-4 text-right">{record.stock_eval_amount.toLocaleString()}원</td>
                                        <td className="px-4 py-4 text-right">{record.cash_balance.toLocaleString()}원</td>
                                        <td className={`px-4 py-4 text-right font-medium ${record.total_profit_loss >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                            {record.total_profit_loss >= 0 ? '+' : ''}{record.total_profit_loss.toLocaleString()}원
                                        </td>
                                        <td className={`px-4 py-4 text-right font-medium ${record.total_profit_rate >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                            {record.total_profit_rate.toFixed(2)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="px-6 py-20 text-center flex flex-col items-center gap-2">
                        <p className="text-muted-foreground font-medium">기록된 자산 내역이 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
