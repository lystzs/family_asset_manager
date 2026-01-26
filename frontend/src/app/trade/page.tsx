"use client";

import { useAccount } from "@/context/AccountContext";
import { placeOrder } from "@/services/api";
import { useState } from "react";
import { ArrowLeftRight, CheckCircle, AlertCircle } from "lucide-react";

export default function TradePage() {
    const { selectedAccount } = useAccount();

    const [ticker, setTicker] = useState("005930");
    const [action, setAction] = useState<"BUY" | "SELL">("BUY");
    const [priceType, setPriceType] = useState("LIMIT");
    const [price, setPrice] = useState(70000);
    const [quantity, setQuantity] = useState(10);

    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAccount) return;

        setIsSubmitting(true);
        setStatus(null);

        try {
            const payload = {
                account_id: selectedAccount.id,
                ticker: ticker,
                quantity: quantity,
                price: priceType === "MARKET" ? 0 : price,
                action: action,
                strategy_id: "manual"
            };

            const res = await placeOrder(payload);
            if (res.rt_cd === "0") {
                setStatus({ type: 'success', msg: "주문이 정상적으로 접수되었습니다." });
            } else {
                setStatus({ type: 'error', msg: res.msg1 || "주문 실패" });
            }
        } catch (e: any) {
            setStatus({ type: 'error', msg: e.response?.data?.detail || "시스템 오류 발생" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!selectedAccount) {
        return <div className="p-10 text-center text-muted-foreground">계좌를 먼저 선택해주세요.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">트레이딩</h1>
                <p className="text-muted-foreground mt-1">주식 매수/매도 주문 실행</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Ticker */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">종목코드</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value)}
                                className="w-full rounded-md border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                                placeholder="예: 005930"
                            />
                        </div>
                    </div>

                    {/* Action */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">매매 구분</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setAction("BUY")}
                                className={`py-3 rounded-md font-bold transition-all shadow-sm ${action === "BUY" ? "bg-red-600 text-white hover:bg-red-700" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                            >
                                매수 (BUY)
                            </button>
                            <button
                                type="button"
                                onClick={() => setAction("SELL")}
                                className={`py-3 rounded-md font-bold transition-all shadow-sm ${action === "SELL" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                            >
                                매도 (SELL)
                            </button>
                        </div>
                    </div>

                    {/* Price Type & Price */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">가격 구분</label>
                            <select
                                value={priceType}
                                onChange={(e) => setPriceType(e.target.value)}
                                className="w-full rounded-md border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="LIMIT">지정가</option>
                                <option value="MARKET">시장가</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                {priceType === "MARKET" ? "예상 가격" : "주문 가격"}
                            </label>
                            <input
                                type="number"
                                disabled={priceType === "MARKET"}
                                value={price}
                                onChange={(e) => setPrice(parseInt(e.target.value))}
                                className="w-full rounded-md border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:bg-muted"
                            />
                        </div>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">수량</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value))}
                            className="w-full rounded-md border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-4 rounded-md font-bold text-lg text-white transition-all flex items-center justify-center gap-2 shadow-md ${action === "BUY" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isSubmitting ? "주문 전송 중..." : (
                            <>
                                <ArrowLeftRight className="h-5 w-5" />
                                {action === "BUY" ? "매수 주문 전송" : "매도 주문 전송"}
                            </>
                        )}
                    </button>
                </form>

                {status && (
                    <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 border ${status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                        {status.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                        <p className="font-medium">{status.msg}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
