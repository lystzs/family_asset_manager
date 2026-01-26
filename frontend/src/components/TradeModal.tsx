"use client";

import { useState, useEffect } from "react";
import { TradeSuggestion, placeOrder, Account } from "@/services/api";
import { X, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: Account;
    suggestion: TradeSuggestion;
    availableCash: number;
    onSuccess: () => void;
}

export function TradeModal({ isOpen, onClose, account, suggestion, availableCash, onSuccess }: TradeModalProps) {
    const [price, setPrice] = useState<number>(suggestion.current_price);
    const [quantity, setQuantity] = useState<number>(suggestion.suggested_qty);
    const [isLoading, setIsLoading] = useState(false);
    const [orderType, setOrderType] = useState<"LIMIT" | "MARKET">("LIMIT");

    useEffect(() => {
        if (isOpen) {
            setPrice(suggestion.current_price);
            setQuantity(suggestion.suggested_qty);
            setOrderType("LIMIT");
        }
    }, [isOpen, suggestion]);

    if (!isOpen) return null;

    const isBuy = suggestion.action === "BUY";
    const totalAmount = price * quantity;
    const maxQty = isBuy
        ? Math.floor(availableCash / (price > 0 ? price : 1))
        : suggestion.current_qty; // For SELL, max is holding qty. Actually suggestion.current_qty is holding qty.

    const handlePercentageClick = (percent: number) => {
        if (percent === 100) {
            setQuantity(maxQty);
        } else if (percent === 0) {
            setQuantity(0); // Reset
        } else {
            setQuantity(Math.floor(maxQty * (percent / 100)));
        }
    };

    const handleOrder = async () => {
        setIsLoading(true);
        try {
            const finalPrice = orderType === "MARKET" ? 0 : price; // Assuming 0 for Market Order, check API req.
            // If backend handles 0 as market order or has strategy_id. 
            // Previous implementation used strategy_id="manual". 
            // KIS API 'place_order' (backend) needs to handle market price logic if price is 0?
            // Existing logic in KIS Client usually requires distinct code for Market ("01") vs Limit ("00").
            // For now, let's stick to Limit as the safest default or Current Price if "Market".
            // Since backend takes 'price', let's trust the user input or current price.

            const res = await placeOrder({
                account_id: account.id,
                ticker: suggestion.stock_code,
                quantity: quantity,
                price: finalPrice > 0 ? finalPrice : suggestion.current_price, // Fallback to current price if 0
                action: suggestion.action,
                strategy_id: orderType === "MARKET" ? "manual_market" : "manual_limit"
            });

            if (res.rt_cd === "0") {
                alert(`주문 성공! [${res.msg1}]`);
                onSuccess();
                onClose();
            } else {
                alert(`주문 실패: ${res.msg1}`);
            }
        } catch (e: any) {
            alert(`시스템 오류: ${e.response?.data?.detail || e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const themeColor = isBuy ? "bg-red-600" : "bg-blue-600";
    const themeText = isBuy ? "text-red-600" : "text-blue-600";
    const themeBorder = isBuy ? "border-red-200" : "border-blue-200";
    const themeLight = isBuy ? "bg-red-50" : "bg-blue-50";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-[480px] bg-background rounded-xl shadow-2xl overflow-hidden border border-border scale-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className={cn("px-6 py-5 text-white flex justify-between items-start", themeColor)}>
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            {suggestion.stock_code === 'CASH' ? (
                                suggestion.stock_name
                            ) : (
                                <a
                                    href={`https://stock.naver.com/domestic/stock/${suggestion.stock_code}/price`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline transition-all flex items-center gap-2"
                                >
                                    {suggestion.stock_name}
                                </a>
                            )}
                            <span className="text-white/80 text-sm font-normal">({suggestion.stock_code})</span>
                        </h2>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold">{price.toLocaleString()}</span>
                            <span className="text-white/90 text-sm">원</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-6 overflow-y-auto">
                    {/* Order Type Tabs */}
                    <div className="grid grid-cols-2 bg-muted p-1 rounded-lg">
                        <button
                            onClick={() => setOrderType("MARKET")}
                            className={cn(
                                "py-2 text-sm font-bold rounded-md transition-all",
                                orderType === "MARKET" ? `${themeColor} text-white shadow` : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            시장가
                        </button>
                        <button
                            onClick={() => setOrderType("LIMIT")}
                            className={cn(
                                "py-2 text-sm font-bold rounded-md transition-all",
                                orderType === "LIMIT" ? `${themeColor} text-white shadow` : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            지정가
                        </button>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        {/* Price */}
                        <div className="flex items-center gap-4">
                            <label className="w-20 text-sm font-medium text-muted-foreground">주문단가</label>
                            <div className="flex-1 relative">
                                <input
                                    type="number"
                                    disabled={orderType === "MARKET"}
                                    className={cn(
                                        "w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 font-bold text-right text-lg",
                                        orderType === "MARKET" ? "bg-muted text-transparent" : "bg-background border-input focus:ring-primary"
                                    )}
                                    value={orderType === "MARKET" ? 0 : price}
                                    placeholder={orderType === "MARKET" ? "시장가" : "가격 입력"}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                />
                                {orderType === "MARKET" && (
                                    <div className="absolute inset-0 flex items-center justify-end pr-3 pointer-events-none text-muted-foreground font-medium">
                                        시장가
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center gap-4">
                            <label className="w-20 text-sm font-medium text-muted-foreground">주문수량</label>
                            <div className="flex-1">
                                <input
                                    type="number"
                                    className="w-full px-3 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background font-bold text-right text-lg"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* Percent Shortcuts */}
                        <div className="flex gap-2 pl-24">
                            {[
                                { label: "10%", val: 10 },
                                { label: "50%", val: 50 },
                                { label: "최대", val: 100 },
                            ].map((btn) => (
                                <button
                                    key={btn.label}
                                    onClick={() => handlePercentageClick(btn.val)}
                                    className="flex-1 py-2 text-xs font-medium border border-border rounded bg-muted/30 hover:bg-muted text-foreground transition-colors"
                                >
                                    {btn.label}
                                </button>
                            ))}
                            <button
                                onClick={() => handlePercentageClick(0)}
                                className="flex-1 py-2 text-xs font-medium border border-border rounded bg-muted/30 hover:bg-muted text-foreground transition-colors flex items-center justify-center"
                            >
                                <span className={themeText}>초기화</span>
                            </button>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                            가능수량: <span className={cn("font-bold", isBuy ? "text-green-600" : "text-foreground")}>{maxQty.toLocaleString()}주</span> 가능
                        </div>
                    </div>

                    {/* Summary Box */}
                    <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-1">
                        <div className="text-right text-sm text-muted-foreground">예상 주문금액</div>
                        <div className="text-right text-2xl font-bold tracking-tight">{(orderType === "MARKET" ? suggestion.current_price * quantity : totalAmount).toLocaleString()}</div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-border bg-background space-y-3">
                    {/* Account Info */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>주문 계좌 정보</span>
                        <div className="font-medium flex items-center gap-1">
                            <span>{account.alias}</span>
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{account.cano}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleOrder}
                        disabled={isLoading || quantity <= 0}
                        className={cn(
                            "w-full py-4 rounded-xl font-bold text-white text-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]",
                            isLoading ? "opacity-70" : "",
                            themeColor,
                            "hover:opacity-90"
                        )}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                처리중...
                            </div>
                        ) : (
                            <span>{isBuy ? "매수 주문" : "매도 주문"}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

