import { RefreshCcw, AlertCircle, CheckCircle2 } from "lucide-react";

export function ExecutedOrdersList({ orders, isLoading, error, onRefresh }: {
    orders: any[],
    isLoading: boolean,
    error: string | null,
    onRefresh: () => void
}) {
    if (error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 shadow-sm mt-6 mb-6">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-sm font-bold text-red-800">체결 내역 조회 실패</p>
                    <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-border bg-green-50/50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-green-800 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    당일 체결 내역 ({orders.length}건)
                </h3>
                <button
                    onClick={onRefresh}
                    className="p-1 hover:bg-green-100 rounded-full transition-colors text-green-700"
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
                            <th className="px-4 py-3 text-right font-medium font-bold text-green-700">체결수량</th>
                            <th className="px-4 py-3 text-right font-medium">평균체결가</th>
                            <th className="px-4 py-3 text-right font-medium">시간</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {(!orders || orders.length === 0) ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                    오늘 체결 내역이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            orders.map((order, i) => {
                                const isBuy = order.sll_buy_dvsn_cd === '02' || order.sll_buy_dvsn_cd === '매수';

                                return (
                                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-mono text-[10px]">{order.odno}</td>
                                        <td className="px-4 py-3 font-bold text-foreground">
                                            {order.prdt_name}
                                            <span className="text-[10px] text-muted-foreground ml-1 font-mono">{order.pdno}</span>
                                        </td>
                                        <td className={`px-4 py-3 text-center font-bold text-xs ${isBuy ? 'text-red-500' : 'text-blue-500'}`}>
                                            {isBuy ? '매수' : '매도'}
                                        </td>
                                        <td className="px-4 py-3 text-right">{parseInt(order.ord_qty).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-medium text-muted-foreground">{parseInt(order.ord_unpr).toLocaleString()}원</td>
                                        <td className="px-4 py-3 text-right font-bold text-green-600">{parseInt(order.tot_ccld_qty).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-medium">{parseInt(order.avg_prvs || order.avg_unpr || '0').toLocaleString()}원</td>
                                        <td className="px-4 py-3 text-right text-[10px] text-muted-foreground">
                                            {order.ord_tmd.replace(/(\d{2})(\d{2})(\d{2})/, '$1:$2:$3')}
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
