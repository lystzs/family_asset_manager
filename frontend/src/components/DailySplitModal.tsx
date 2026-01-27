"use client";

import { useState } from "react";
import { TradeSuggestion, scheduleOrder, Account } from "@/services/api";
import { X, Loader2, CalendarClock, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailySplitModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: Account;
    suggestion: TradeSuggestion;
    onSuccess: () => void;
}

export function DailySplitModal({ isOpen, onClose, account, suggestion, onSuccess }: DailySplitModalProps) {
    // Mode: "AMOUNT" (Fixed amount per day) or "QUANTITY" (Fixed quantity per day)
    // Per user request, we default to AMOUNT based, but could support both.
    // Simplifying to Amount based as requested.

    // State for Amount Mode
    const [totalAmount, setTotalAmount] = useState<number>(Math.floor(Math.abs(suggestion.diff_value)));
    const [period, setPeriod] = useState<number>(5); // Default 5 days
    const [isLoading, setIsLoading] = useState(false);

    const isBuy = suggestion.action === "BUY";
    // Avoid division by zero
    const effectivePeriod = period > 0 ? period : 1;

    // Calculations
    // Ensure dailyAmount is integer
    const dailyAmount = Math.floor(totalAmount / effectivePeriod);
    const currentPrice = suggestion.current_price;
    const estimatedDailyQty = currentPrice > 0 ? Math.floor(dailyAmount / currentPrice) : 0;
    const estimatedTotalQty = estimatedDailyQty * effectivePeriod;

    // Theme Colors
    const themeColor = isBuy ? "bg-red-600" : "bg-blue-600";
    const themeText = isBuy ? "text-red-600" : "text-blue-600";
    const themeBorder = isBuy ? "border-red-200" : "border-blue-200";
    const themeBgSoft = isBuy ? "bg-red-50" : "bg-blue-50";

    if (!isOpen) return null;

    const handleSchedule = async () => {
        if (!confirm(`매일 약 ${dailyAmount.toLocaleString()}원씩 ${period}일간\n총 ${totalAmount.toLocaleString()}원을 ${isBuy ? '매수' : '매도'} 예약하시겠습니까?\n(예상 매매 수량: 약 ${estimatedTotalQty}주)`)) return;

        setIsLoading(true);
        try {
            await scheduleOrder({
                account_id: account.id,
                ticker: suggestion.stock_code,
                stock_name: suggestion.stock_name,
                action: suggestion.action as "BUY" | "SELL",
                order_mode: "AMOUNT",
                total_amount: Math.floor(totalAmount), // Ensure integer
                daily_amount: dailyAmount,
                // We send basic quantity fields as 0 or undefined if backend requires, 
                // but our updated backend logic handles total_amount/daily_amount
                total_quantity: 0, // Legacy/Fallback
                daily_quantity: 0  // Legacy/Fallback
            });
            alert("일별 금액 분할 예약 주문이 생성되었습니다.");
            onSuccess();
            onClose();
        } catch (e: any) {
            const errMsg = e.response?.data?.detail;
            alert(`예약 실패: ${typeof errMsg === 'object' ? JSON.stringify(errMsg) : (errMsg || e.message)}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-background rounded-xl shadow-2xl overflow-hidden border border-border scale-100 animate-in zoom-in-95 duration-200 flex flex-col">

                {/* Header */}
                <div className={cn("px-6 py-4 text-white flex justify-between items-center transition-colors duration-300", themeColor)}>
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <CalendarClock className="h-5 w-5" />
                            {isBuy ? "일별 분할 매수 예약 (금액)" : "일별 분할 매도 예약 (금액)"}
                        </h2>
                        <span className="text-xs text-white/80 font-medium pl-7">
                            {account.alias} ({account.cano}-{account.acnt_prdt_cd})
                        </span>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className={cn("p-4 rounded-lg flex items-start gap-3 border", themeBgSoft, themeBorder)}>
                        {isBuy ? (
                            <TrendingUp className={cn("h-5 w-5 shrink-0 mt-0.5", themeText)} />
                        ) : (
                            <TrendingDown className={cn("h-5 w-5 shrink-0 mt-0.5", themeText)} />
                        )}
                        <div className="text-sm text-muted-foreground">
                            {suggestion.stock_code === 'CASH' ? (
                                <span className={cn("font-bold", themeText)}>
                                    {suggestion.stock_name} ({suggestion.stock_code})
                                </span>
                            ) : (
                                <a
                                    href={`https://stock.naver.com/domestic/stock/${suggestion.stock_code}/price`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn("font-bold hover:underline", themeText)}
                                >
                                    {suggestion.stock_name} ({suggestion.stock_code})
                                </a>
                            )}
                            <br />
                            매일 {isBuy ? '12:30' : '12:15'}에 지정된 금액만큼 주문을 실행합니다.
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">총 목표 금액 (원)</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-lg font-bold text-right text-lg focus:ring-2 focus:ring-ring outline-none transition-all"
                                value={totalAmount}
                                onChange={e => setTotalAmount(Number(e.target.value))}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">진행 기간 (일)</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-lg font-bold text-right text-lg focus:ring-2 focus:ring-ring outline-none transition-all"
                                value={period}
                                onChange={e => setPeriod(Number(e.target.value))}
                                min={1}
                            />
                        </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground text-sm">1일 목표 금액</span>
                            <span className={cn("text-lg font-bold", themeText)}>
                                약 {dailyAmount.toLocaleString()}원
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-muted-foreground/20">
                            <span className="text-muted-foreground text-sm">현재가 기준 예상 수량 (1일)</span>
                            <span className="text-base font-medium">约 {estimatedDailyQty}주</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>총 예상 수량</span>
                            <span>약 {estimatedTotalQty}주</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSchedule}
                        disabled={isLoading || totalAmount <= 0 || period <= 0}
                        className={cn(
                            "w-full py-3 rounded-xl font-bold text-white shadow transition-all flex items-center justify-center gap-2",
                            themeColor,
                            isLoading ? "opacity-70 cursor-not-allowed" : "hover:shadow-md hover:opacity-90"
                        )}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                예약 중...
                            </>
                        ) : (
                            <>
                                {isBuy ? "매수" : "매도"} 예약 실행
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
