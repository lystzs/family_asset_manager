"use client";

import { useState, useEffect } from "react";
import { fetchAllStocks, searchStocks, fetchStockStats, syncStockMaster, Stock, StockStats } from "@/services/api";
import { Search, RefreshCw, TrendingUp, BarChart3 } from "lucide-react";

export default function StockMasterPage() {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [stats, setStats] = useState<StockStats | null>(null);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        loadStats();
        loadStocks();
    }, []);

    const loadStocks = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAllStocks();
            setStocks(data);
        } catch (e) {
            console.error("Failed to load stocks", e);
        } finally {
            setIsLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const data = await fetchStockStats();
            setStats(data);
        } catch (e) {
            console.error("Failed to load stats", e);
        }
    };

    const handleSearch = async () => {
        if (!searchKeyword) {
            loadStocks();
            return;
        }

        setIsLoading(true);
        try {
            const data = await searchStocks(searchKeyword, 100);
            setStocks(data);
        } catch (e) {
            console.error("Failed to search stocks", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSync = async () => {
        if (!confirm("종목 마스터를 동기화하시겠습니까?\n시간이 다소 소요될 수 있습니다.")) {
            return;
        }

        setIsSyncing(true);
        try {
            const result = await syncStockMaster();
            alert(`동기화 완료!\n추가: ${result.added}개, 수정: ${result.updated}개, 전체: ${result.total}개`);
            await loadStats();
            await loadStocks();
        } catch (e) {
            alert("동기화 실패");
            console.error("Failed to sync", e);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">종목 마스터</h1>
                <p className="text-muted-foreground mt-1">국내주식 전체 종목 데이터 관리</p>
            </div>

            {/* 통계 */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">전체 종목</p>
                                <p className="text-2xl font-bold text-foreground">{stats.total.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-100 text-green-600">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">KOSPI</p>
                                <p className="text-2xl font-bold text-foreground">{stats.kospi.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">KOSDAQ</p>
                                <p className="text-2xl font-bold text-foreground">{stats.kosdaq.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 검색 및 동기화 */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="종목명 또는 코드 검색..."
                            className="w-full pl-10 pr-4 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-colors disabled:opacity-50"
                    >
                        검색
                    </button>
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? "동기화 중..." : "동기화"}
                    </button>
                </div>
            </div>

            {/* 종목 리스트 */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full">
                        <thead className="bg-muted/50 border-b border-border sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">종목코드</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">종목명</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">시장</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                        로딩 중...
                                    </td>
                                </tr>
                            ) : stocks.length > 0 ? (
                                stocks.map((stock) => (
                                    <tr key={stock.code} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-3 text-sm font-mono text-foreground">{stock.code}</td>
                                        <td className="px-4 py-3 text-sm text-foreground">
                                            <a
                                                href={`https://stock.naver.com/domestic/stock/${stock.code}/price`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold hover:underline hover:text-blue-600 transition-colors cursor-pointer"
                                            >
                                                {stock.name}
                                            </a>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`px-2 py-1 text-xs rounded ${stock.market === 'KOSPI'
                                                    ? 'bg-green-100 text-green-700 border border-green-300'
                                                    : 'bg-purple-100 text-purple-700 border border-purple-300'
                                                    }`}
                                            >
                                                {stock.market}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                        검색 결과가 없습니다
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 안내 메시지 */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                    <strong>💡 참고:</strong> 종목 데이터는 매주 일요일 오전 2시에 자동으로 동기화됩니다.
                    필요한 경우 "동기화" 버튼을 눌러 수동으로 업데이트할 수 있습니다.
                </p>
            </div>
        </div>
    );
}
