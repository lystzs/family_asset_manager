"use client";

import { useState, useEffect, useMemo } from "react";
import { TradeSuggestion, placeOrder, Account } from "@/services/api";
import { X, Loader2, Play, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface SplitTradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: Account;
    suggestion: TradeSuggestion;
    onSuccess: () => void;
}

interface GridOrder {
    step: number;
    price: number;
    quantity: number;
    status: "PENDING" | "SUCCESS" | "FAILED" | "SKIPPED";
    msg?: string;
}

export function SplitTradeModal({ isOpen, onClose, account, suggestion, onSuccess }: SplitTradeModalProps) {
    // Settings
    const [totalQty, setTotalQty] = useState<number>(suggestion.suggested_qty);
    const [splitCount, setSplitCount] = useState<number>(5);
    const [priceGapPct, setPriceGapPct] = useState<number>(0.5); // 0.5%
    const [startPrice, setStartPrice] = useState<number>(suggestion.current_price);

    // Execution State
    const [isExecuting, setIsExecuting] = useState(false);
    const [completedCount, setCompletedCount] = useState(0);
    const [orderList, setOrderList] = useState<GridOrder[]>([]);

    const isBuy = suggestion.action === "BUY";

    // Recalculate Preview
    useEffect(() => {
        if (!isOpen) return;

        const newOrders: GridOrder[] = [];
        const baseQty = Math.floor(totalQty / splitCount);
        let remainder = totalQty % splitCount;

        for (let i = 0; i < splitCount; i++) {
            // Price Calculation: Buy -> Lower, Sell -> Higher
            const direction = isBuy ? -1 : 1;
            const gap = priceGapPct / 100;
            const stepPrice = Math.floor(startPrice * (1 + direction * gap * i));

            // Qty Distribution (Add remainder to first orders)
            const stepQty = baseQty + (remainder > 0 ? 1 : 0);
            remainder--;

            newOrders.push({
                step: i + 1,
                price: stepPrice,
                quantity: stepQty,
                status: "PENDING"
            });
        }
        setOrderList(newOrders);
    }, [isOpen, totalQty, splitCount, priceGapPct, startPrice, isBuy]);

    if (!isOpen) return null;

    const handleExecute = async () => {
        if (!confirm(`${splitCount}건의 분할 주문을 실행하시겠습니까?`)) return;

        setIsExecuting(true);
        setCompletedCount(0);

        const results = [...orderList]; // Clone for updates

        for (let i = 0; i < results.length; i++) {
            const order = results[i];

            try {
                // Determine strategy ID logic (optional)
                const res = await placeOrder({
                    account_id: account.id,
                    ticker: suggestion.stock_code,
                    quantity: order.quantity,
                    price: order.price,
                    action: suggestion.action,
                    strategy_id: "manual_grid"
                });

                if (res.rt_cd === "0") {
                    results[i].status = "SUCCESS";
                    results[i].msg = res.msg1;
                    setCompletedCount(prev => prev + 1);
                } else {
                    results[i].status = "FAILED";
                    results[i].msg = res.msg1;
                }
            } catch (e: any) {
                results[i].status = "FAILED";
                results[i].msg = e.message;
            }

            // Update UI step by step
            setOrderList([...results]);

            // Small delay to prevent rate limit
            await new Promise(r => setTimeout(r, 200));
        }

        setIsExecuting(false);

        // Auto close if all success after 1.5s
        if (results.every(r => r.status === "SUCCESS")) {
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1000);
        }
    };

    const themeColor = isBuy ? "bg-red-600" : "bg-blue-600";
    const themeText = isBuy ? "text-red-600" : "text-blue-600";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-background rounded-xl shadow-2xl overflow-hidden border border-border scale-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className={cn("px-6 py-4 text-white flex justify-between items-center", themeColor)}>
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Layers className="h-5 w-5" />
                            분할 {isBuy ? "매수" : "매도"}
                        </h2>
                        {suggestion.stock_code !== 'CASH' ? (
                            <a
                                href={`https://stock.naver.com/domestic/stock/${suggestion.stock_code}/price`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-white/90 hover:underline flex items-center gap-1 font-medium pl-7"
                            >
                                {suggestion.stock_name} ({suggestion.stock_code})
                            </a>
                        ) : (
                            <span className="text-xs text-white/90 font-medium pl-7">
                                {suggestion.stock_name} ({suggestion.stock_code})
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} disabled={isExecuting} className="text-white/80 hover:text-white transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-0 flex flex-col h-full overflow-hidden">
                    {/* Settings Panel */}
                    <div className="p-5 bg-muted/20 border-b border-border space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">총 수량</label>
                                <input
                                    type="number"
                                    disabled={isExecuting}
                                    className="w-full px-3 py-2 border rounded font-mono text-right"
                                    value={totalQty}
                                    onChange={e => setTotalQty(Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">시작 가격</label>
                                <input
                                    type="number"
                                    disabled={isExecuting}
                                    className="w-full px-3 py-2 border rounded font-mono text-right"
                                    value={startPrice}
                                    onChange={e => setStartPrice(Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">분할 횟수</label>
                                <select
                                    className="w-full px-3 py-2 border rounded"
                                    value={splitCount}
                                    onChange={e => setSplitCount(Number(e.target.value))}
                                    disabled={isExecuting}
                                >
                                    {[3, 5, 10, 20].map(n => <option key={n} value={n}>{n}회</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">가격 간격 (%)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        disabled={isExecuting}
                                        step="0.1"
                                        className="w-full px-3 py-2 border rounded font-mono text-right"
                                        value={priceGapPct}
                                        onChange={e => setPriceGapPct(Number(e.target.value))}
                                    />
                                    <span className="text-sm font-bold text-muted-foreground">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview List */}
                    <div className="flex-1 overflow-y-auto p-0">
                        <table className="w-full text-sm">
                            <thead className="bg-muted text-muted-foreground sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-2 text-center w-12">#</th>
                                    <th className="px-4 py-2 text-right">가격 ({isBuy ? "-" : "+"}{priceGapPct}%)</th>
                                    <th className="px-4 py-2 text-right">수량</th>
                                    <th className="px-4 py-2 text-center">상태</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {orderList.map((order) => (
                                    <tr key={order.step} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 text-center font-mono text-muted-foreground">{order.step}</td>
                                        <td className="px-4 py-3 text-right font-bold">{order.price.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right">{order.quantity.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-center">
                                            {order.status === "PENDING" && <span className="text-muted-foreground text-xs">대기</span>}
                                            {order.status === "SUCCESS" && <span className="text-green-600 text-xs font-bold">완료</span>}
                                            {order.status === "FAILED" && <span className="text-red-600 text-xs font-bold" title={order.msg}>실패</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-background">
                    <button
                        onClick={handleExecute}
                        disabled={isExecuting}
                        className={cn(
                            "w-full py-3 rounded-xl font-bold text-white shadow transition-all flex items-center justify-center gap-2",
                            themeColor,
                            isExecuting ? "opacity-70 cursor-not-allowed" : "hover:shadow-md hover:opacity-90"
                        )}
                    >
                        {isExecuting ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                실행 중 ({completedCount}/{splitCount})...
                            </>
                        ) : (
                            <>
                                <Play className="h-5 w-5 fill-current" />
                                분할 주문 실행
                            </>
                        )}
                    </button>
                    {isExecuting && (
                        <p className="text-center text-xs text-muted-foreground mt-2">
                            * 주문 실행 중에는 창을 닫지 마세요.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
