import { fetchUnfilledOrders, cancelOrder } from "@/services/api";
import { useEffect, useState } from "react";
import { RefreshCcw, AlertCircle, ShoppingCart, Trash2, Edit3 } from "lucide-react";


export function UnfilledOrdersList({ orders, isLoading, error, onRefresh, onRevise, onCancel }: {
    orders: any[],
    isLoading: boolean,
    error: string | null,
    onRefresh: () => void,
    onRevise: (order: any) => void,
    onCancel: (order: any) => void
}) {
    if (error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 shadow-sm mt-6 mb-6">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-sm font-bold text-red-800">미체결 내역 조회 실패</p>
                    <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                </div>
            </div>
        );
    }

    // Display empty state instead of returning null
    // if (!orders || orders.length === 0) return null;

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-border bg-amber-50/50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    미체결 주문 내역 ({orders.length}건)
                </h3>
                <button
                    onClick={onRefresh}
                    className="p-1 hover:bg-amber-100 rounded-full transition-colors text-amber-700"
                    disabled={isLoading}
                >
                    <RefreshCcw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">주문번호</th>
                            <th className="px-4 py-3 text-left font-medium">종목명</th>
                            <th className="px-4 py-3 text-center font-medium">구분</th>
                            <th className="px-4 py-3 text-right font-medium">주문수량</th>
                            <th className="px-4 py-3 text-right font-medium">주문단가</th>
                            <th className="px-4 py-3 text-right font-medium">체결수량</th>
                            <th className="px-4 py-3 text-right font-medium">미체결잔량</th>
                            <th className="px-4 py-3 text-right font-medium">주문시간</th>
                            <th className="px-4 py-3 text-center font-medium">액션</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {(!orders || orders.length === 0) ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                                    미체결된 주문이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            orders.map((order, i) => {
                                // Fallback for remaining quantity field
                                const rmnQty = order.rmn_qty || order.psbl_qty || order.nccs_qty || '0';

                                return (
                                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs">{order.odno}</td>
                                        <td className="px-4 py-3 font-bold text-foreground">
                                            {order.prdt_name}
                                            <span className="text-[10px] text-muted-foreground ml-1 font-mono">{order.pdno}</span>
                                        </td>
                                        <td className={`px-4 py-3 text-center font-bold text-xs ${order.sll_buy_dvsn_cd === '02' ? 'text-red-500' : 'text-blue-500'}`}>
                                            {order.sll_buy_dvsn_cd === '02' ? '매수' : '매도'}
                                        </td>
                                        <td className="px-4 py-3 text-right">{parseInt(order.ord_qty).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-medium">{parseInt(order.ord_unpr).toLocaleString()}원</td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">{parseInt(order.tot_ccld_qty).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-bold text-amber-600">{parseInt(rmnQty).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">{order.ord_tmd}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-center gap-1">
                                                <button
                                                    onClick={() => onRevise(order)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="정정"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onCancel(order)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="취소"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
