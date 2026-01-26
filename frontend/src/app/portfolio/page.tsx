"use client";

import { useAccount } from "@/context/AccountContext";
import {
    fetchAccountPortfolio,
    saveTargetPortfolio,
    deleteTargetPortfolio,
    analyzeRebalance,
    searchStocks,
    TargetPortfolio,
    RebalanceAnalysis,
    Stock,
    TradeSuggestion
} from "@/services/api";

import { useEffect, useState } from "react";
import { TradeModal } from "@/components/TradeModal";
import {
    Plus,
    Trash2,
    BarChart3,
    RefreshCw,
    Search,
    Save,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
    TrendingDown,
    Minus,
    Coins,
    Layers,
    CalendarClock
} from "lucide-react";
import { SplitTradeModal } from "@/components/SplitTradeModal";
import { DailySplitModal } from "@/components/DailySplitModal";

export default function PortfolioPage() {
    const { selectedAccount } = useAccount();
    const [portfolio, setPortfolio] = useState<TargetPortfolio[]>([]);
    const [analysis, setAnalysis] = useState<RebalanceAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // New Stock Input
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState<Stock[]>([]);
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [targetPct, setTargetPct] = useState<number>(0);

    // Editing State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<string>("");

    // Trade Modal state
    const [selectedSuggestion, setSelectedSuggestion] = useState<TradeSuggestion | null>(null);
    const [selectedSplitSuggestion, setSelectedSplitSuggestion] = useState<TradeSuggestion | null>(null);
    const [selectedDailySuggestion, setSelectedDailySuggestion] = useState<TradeSuggestion | null>(null);

    const loadPortfolio = async () => {
        if (!selectedAccount) return;
        setIsLoading(true);
        try {
            const data = await fetchAccountPortfolio(selectedAccount.id);
            setPortfolio(data);
        } catch (e) {
            console.error("Failed to load portfolio", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (val: string) => {
        setSearchKeyword(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const results = await searchStocks(val, 10);
            setSearchResults(results);
        } catch (e) {
            console.error("Search failed", e);
        }
    };

    const handleSelectCash = () => {
        setSelectedStock({
            code: "CASH",
            name: "현금",
            market: "Virtual"
        });
        setSearchKeyword("현금 (CASH)");
        setSearchResults([]);
    };

    const handleAddStock = async () => {
        if (!selectedAccount || !selectedStock || targetPct <= 0) return;

        try {
            await saveTargetPortfolio(selectedAccount.id, {
                stock_code: selectedStock.code,
                stock_name: selectedStock.name,
                target_percentage: targetPct
            });
            setSelectedStock(null);
            setTargetPct(0);
            setSearchKeyword("");
            setSearchResults([]);
            loadPortfolio();
        } catch (e) {
            alert("저장 실패: 중복된 종목이거나 시스템 오류입니다.");
        }
    };

    const handleUpdatePct = async (item: TargetPortfolio) => {
        const val = parseFloat(editValue);
        if (isNaN(val) || val < 0 || val > 100) {
            alert("0에서 100 사이의 숫자를 입력해주세요.");
            return;
        }

        try {
            await saveTargetPortfolio(item.account_id, {
                stock_code: item.stock_code,
                stock_name: item.stock_name,
                target_percentage: val
            });
            setEditingId(null);
            loadPortfolio();
        } catch (e) {
            alert("수정 실패");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        try {
            await deleteTargetPortfolio(id);
            loadPortfolio();
        } catch (e) {
            console.error("Delete failed", e);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedAccount) return;
        setIsAnalyzing(true);
        try {
            const data = await analyzeRebalance(selectedAccount.user_id, selectedAccount.id);
            setAnalysis(data);
        } catch (e: any) {
            alert(e.response?.data?.detail || "분석 실패");
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        loadPortfolio();
        setAnalysis(null);
    }, [selectedAccount]);

    const totalTargetPct = portfolio.reduce((acc, curr) => acc + curr.target_percentage, 0);

    if (!selectedAccount) {
        return (
            <div className="flex h-full flex-col items-center justify-center space-y-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold">계좌를 선택해주세요</h2>
                <p className="text-muted-foreground">포트폴리오 관리를 위해 특정 계좌를 먼저 선택해야 합니다.</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-20">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">포트폴리오 관리</h1>
                <p className="text-muted-foreground mt-1">사용자별 목표 비중을 설정하고 리밸런싱을 분석합니다.</p>
            </div>

            {/* Target Settings */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                목표 비중 설정
                            </h3>
                            <div className={cn(
                                "text-sm font-medium px-3 py-1 rounded-full",
                                totalTargetPct === 100 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                            )}>
                                총계: {totalTargetPct}% / 100%
                            </div>
                        </div>

                        <div className="p-0">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-medium">종목명</th>
                                        <th className="px-6 py-3 text-center font-medium">코드</th>
                                        <th className="px-6 py-3 text-right font-medium">목표 비중</th>
                                        <th className="px-6 py-3 text-center font-medium">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {portfolio.map((item) => (
                                        <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                                            <td className="px-6 py-4 font-medium">
                                                {item.stock_code === 'CASH' ? (
                                                    item.stock_name
                                                ) : (
                                                    <a
                                                        href={`https://stock.naver.com/domestic/stock/${item.stock_code}/price`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="hover:underline hover:text-blue-600 transition-colors cursor-pointer"
                                                    >
                                                        {item.stock_name}
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center text-muted-foreground font-mono">{item.stock_code}</td>
                                            <td className="px-6 py-4 text-right font-semibold text-primary">
                                                {editingId === item.id ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <input
                                                            type="number"
                                                            className="w-20 px-2 py-1 rounded border border-primary bg-background text-right text-foreground focus:outline-none"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            autoFocus
                                                            onKeyPress={(e) => e.key === 'Enter' && handleUpdatePct(item)}
                                                        />
                                                        <span className="text-muted-foreground">%</span>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="cursor-pointer hover:bg-primary/10 px-2 py-1 rounded transition-colors inline-flex items-center gap-1"
                                                        onClick={() => {
                                                            setEditingId(item.id);
                                                            setEditValue(item.target_percentage.toString());
                                                        }}
                                                    >
                                                        {item.target_percentage}%
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {editingId === item.id ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdatePct(item)}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                                                                title="저장"
                                                            >
                                                                <Save className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingId(null)}
                                                                className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                                                                title="취소"
                                                            >
                                                                <Minus className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {portfolio.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                                                설정된 목표 종목이 없습니다.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Add Stock Form */}
                    <div className="rounded-xl border border-border bg-muted/20 p-6 space-y-4">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">종목 추가</h4>
                        <div className="grid gap-4 sm:grid-cols-4">
                            <div className="sm:col-span-2 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="종목명 또는 코드 검색"
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                    value={searchKeyword}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                                <button
                                    onClick={handleSelectCash}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-primary transition-colors text-muted-foreground"
                                    title="현금 추가"
                                >
                                    <Coins className="h-4 w-4" />
                                </button>
                                {searchResults.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {searchResults.map((s) => (
                                            <div
                                                key={s.code}
                                                className="w-full text-left px-4 py-2 hover:bg-muted text-sm flex justify-between items-center group/item"
                                            >
                                                <button
                                                    className="flex-1 text-left flex justify-between items-center pr-4"
                                                    onClick={() => {
                                                        setSelectedStock(s);
                                                        setSearchResults([]);
                                                        setSearchKeyword(s.name);
                                                    }}
                                                >
                                                    <span>{s.name}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{s.code}</span>
                                                </button>
                                                {s.code !== 'CASH' && (
                                                    <a
                                                        href={`https://stock.naver.com/domestic/stock/${s.code}/price`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1 rounded hover:bg-muted-foreground/20 text-muted-foreground hover:text-blue-600 transition-colors"
                                                        title="네이버 증권에서 보기"
                                                    >
                                                        <BarChart3 className="h-3.5 w-3.5" />
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <input
                                    type="number"
                                    placeholder="비중 (%)"
                                    min="0"
                                    max="100"
                                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                    value={targetPct}
                                    onChange={(e) => setTargetPct(parseFloat(e.target.value))}
                                />
                            </div>
                            <button
                                onClick={handleAddStock}
                                disabled={!selectedStock || targetPct <= 0}
                                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
                            >
                                <Plus className="h-4 w-4" />
                                추가
                            </button>
                        </div>
                    </div>
                </div>

                {/* Analysis Trigger & Summary */}
                <div className="space-y-6">
                    <div className="rounded-xl border border-border bg-primary/5 p-8 flex flex-col items-center text-center space-y-4 shadow-sm">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <RefreshCw className={cn("h-8 w-8 text-primary", isAnalyzing ? "animate-spin" : "")} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-xl">리밸런싱 분석</h3>
                            <p className="text-sm text-muted-foreground">현재 잔고와 목표 비중을 비교하여 최적의 매매 수량을 제안합니다.</p>
                        </div>
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || totalTargetPct !== 100}
                            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:shadow-lg disabled:opacity-50 transition-all"
                        >
                            {isAnalyzing ? "분석 중..." : "분석 시작"}
                        </button>
                        {totalTargetPct !== 100 && (
                            <p className="text-xs text-amber-600 font-medium italic">* 총 비중이 100%가 되어야 정확한 분석이 가능합니다.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Analysis Results */}
            {analysis && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1 bg-primary rounded-full"></div>
                        <h2 className="text-2xl font-bold tracking-tight">분석 결과 및 제안</h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-border p-6 bg-card flex justify-between items-center shadow-sm">
                            <span className="text-muted-foreground font-medium">총 평가 자산</span>
                            <span className="text-2xl font-bold">{analysis.total_asset.toLocaleString()}원</span>
                        </div>
                        <div className="rounded-xl border border-border p-6 bg-card flex justify-between items-center shadow-sm">
                            <span className="text-muted-foreground font-medium">현재 주문가능 현금</span>
                            <span className="text-2xl font-bold text-blue-600">{analysis.current_cash.toLocaleString()}원</span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 text-left font-medium">종목</th>
                                    <th className="px-4 py-4 text-right font-medium text-xs text-muted-foreground">
                                        주식비중
                                        <br />
                                        (평가액)
                                    </th>
                                    <th className="px-4 py-4 text-right font-medium text-xs text-muted-foreground">
                                        자산비중
                                        <br />
                                        (총자산)
                                    </th>
                                    <th className="px-4 py-4 text-right font-medium text-xs text-muted-foreground">
                                        목표비중
                                    </th>
                                    <th className="px-6 py-4 text-right font-medium">부족/초과</th>
                                    <th className="px-6 py-4 text-center font-medium">제안</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {analysis.items.map((item) => {
                                    const totalStockEquity = analysis.total_asset - analysis.current_cash;
                                    // Avoid division by zero
                                    const stockWeight = totalStockEquity > 0 && item.stock_code !== 'CASH'
                                        ? (item.current_value / totalStockEquity) * 100
                                        : 0;

                                    const assetWeight = (item.current_value / analysis.total_asset) * 100;
                                    const targetWeight = (item.target_value / analysis.total_asset) * 100;

                                    return (
                                        <tr key={item.stock_code} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    {item.stock_code === 'CASH' ? (
                                                        item.stock_name
                                                    ) : (
                                                        <a
                                                            href={`https://stock.naver.com/domestic/stock/${item.stock_code}/price`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-bold hover:underline hover:text-blue-600 transition-colors cursor-pointer"
                                                        >
                                                            {item.stock_name}
                                                        </a>
                                                    )}
                                                    <span className="text-xs text-muted-foreground">{item.stock_code}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5 text-right font-medium">
                                                {item.stock_code !== 'CASH' ? `${stockWeight.toFixed(1)}%` : '-'}
                                            </td>
                                            <td className="px-4 py-5 text-right font-medium">{assetWeight.toFixed(1)}%</td>
                                            <td className="px-4 py-5 text-right font-medium text-primary">{targetWeight.toFixed(1)}%</td>
                                            <td className={cn(
                                                "px-6 py-5 text-right font-bold",
                                                item.diff_value > 0 ? "text-red-500" : item.diff_value < 0 ? "text-blue-500" : ""
                                            )}>
                                                {item.diff_value > 0 ? "+" : ""}{item.diff_value.toLocaleString()}원
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {item.action === "BUY" ? (
                                                        <>
                                                            <button
                                                                onClick={() => setSelectedSuggestion(item)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold border border-red-200 hover:bg-red-200 transition-colors"
                                                            >
                                                                <TrendingUp className="h-3.5 w-3.5" />
                                                                매수 {item.suggested_qty.toLocaleString()}주
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedSplitSuggestion(item)}
                                                                className="p-1.5 rounded-full text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                                                                title="분할 매수 (Grid)"
                                                            >
                                                                <Layers className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedDailySuggestion(item)}
                                                                className="p-1.5 rounded-full text-purple-600 hover:bg-purple-50 border border-transparent hover:border-purple-200 transition-all"
                                                                title="일별 예약 매수"
                                                            >
                                                                <CalendarClock className="h-5 w-5" />
                                                            </button>
                                                        </>
                                                    ) : item.action === "SELL" ? (
                                                        <>
                                                            <button
                                                                onClick={() => setSelectedSuggestion(item)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200 hover:bg-blue-200 transition-colors"
                                                            >
                                                                <TrendingDown className="h-3.5 w-3.5" />
                                                                매도 {item.suggested_qty.toLocaleString()}주
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedSplitSuggestion(item)}
                                                                className="p-1.5 rounded-full text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all"
                                                                title="분할 매도 (Grid)"
                                                            >
                                                                <Layers className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedDailySuggestion(item)}
                                                                className="p-1.5 rounded-full text-purple-600 hover:bg-purple-50 border border-transparent hover:border-purple-200 transition-all"
                                                                title="일별 예약 매도"
                                                            >
                                                                <CalendarClock className="h-5 w-5" />
                                                            </button>
                                                        </>
                                                    ) : item.action === "RESERVE" ? (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold border border-green-200">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            현금보유
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-500 font-bold border border-gray-200">
                                                            <Minus className="h-3.5 w-3.5" />
                                                            유지
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Trade Modal */}
            {selectedSuggestion && selectedAccount && analysis && (
                <TradeModal
                    isOpen={!!selectedSuggestion}
                    onClose={() => setSelectedSuggestion(null)}
                    suggestion={selectedSuggestion}
                    account={selectedAccount as any}
                    availableCash={analysis.current_cash}
                    onSuccess={() => {
                        // Refresh Data
                        handleAnalyze();
                    }}
                />
            )}
            {/* Split Trade Modal */}
            {selectedSplitSuggestion && selectedAccount && (
                <SplitTradeModal
                    isOpen={!!selectedSplitSuggestion}
                    onClose={() => setSelectedSplitSuggestion(null)}
                    suggestion={selectedSplitSuggestion}
                    account={selectedAccount as any}
                    onSuccess={() => {
                        handleAnalyze();
                    }}
                />
            )}

            {/* Daily Split Modal */}
            {selectedDailySuggestion && selectedAccount && (
                <DailySplitModal
                    isOpen={!!selectedDailySuggestion}
                    onClose={() => setSelectedDailySuggestion(null)}
                    suggestion={selectedDailySuggestion}
                    account={selectedAccount as any}
                    onSuccess={() => {
                        handleAnalyze();
                    }}
                />
            )}
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
