"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { reviseOrder, cancelOrder } from "@/services/api";

export function OrderRevisionModal({
    isOpen,
    onClose,
    order,
    accountId,
    onSuccess
}: {
    isOpen: boolean;
    onClose: () => void;
    order: any;
    accountId: number;
    onSuccess: () => void;
}) {
    const [quantity, setQuantity] = useState<number>(0);
    const [price, setPrice] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (order && isOpen) {
            // Remaining quantity as default
            const rmnQty = order.rmn_qty || order.psbl_qty || order.nccs_qty || order.ord_qty;
            setQuantity(parseInt(rmnQty));
            setPrice(parseInt(order.ord_unpr));
            setError(null);
        }
    }, [order, isOpen]);

    if (!isOpen || !order) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Original values for comparison
        const originalQty = parseInt(order.rmn_qty || order.psbl_qty || order.nccs_qty || order.ord_qty || '0');
        const originalPrice = parseInt(order.ord_unpr || '0');

        // Check if anything changed
        if (quantity === originalQty && price === originalPrice) {
            setError("변경된 내용이 없습니다.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            if (price !== originalPrice) {
                // Case 1: Price changed -> Use 'Revision' (01)
                await reviseOrder({
                    account_id: accountId,
                    orgn_odno: order.odno,
                    quantity: quantity,
                    price: price,
                    ord_dvsn: order.ord_dvsn || "00",
                    all_qty: true // Usually revisions apply to all remaining
                });
            } else if (quantity < originalQty) {
                // Case 2: Only quantity reduced -> Use 'Partial Cancellation' (02)
                // KIS APBK1767 occurs if we use '01' with same price.
                // To reduce qty without changing price, we must cancel the difference.
                await cancelOrder({
                    account_id: accountId,
                    orgn_odno: order.odno,
                    quantity: originalQty - quantity, // Quantity to cancel
                    all_qty: false
                });
            } else {
                // Case 3: Quantity increased or other?
                // KIS revision usually doesn't support increasing quantity.
                throw new Error("수량 증가는 정정 주문으로 불가능합니다. 새로운 주문을 넣어주세요.");
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || "처리에 실패했습니다.";
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-50/50">
                    <h2 className="text-lg font-bold text-blue-900">주문 정정</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/50 rounded-full transition-colors">
                        <X className="h-5 w-5 text-blue-900" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg flex justify-between text-sm">
                        <span className="text-gray-500">종목</span>
                        <span className="font-bold">{order.prdt_name} ({order.pdno})</span>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">정정 수량</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">정정 단가</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-2 text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="pt-2 flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200"
                        >
                            {isSubmitting ? "처리 중..." : "정정 확인"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
