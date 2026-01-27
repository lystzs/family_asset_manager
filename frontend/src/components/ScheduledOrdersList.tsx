import { AlertCircle, Trash2, CalendarClock, TrendingUp, TrendingDown } from "lucide-react";

export function ScheduledOrdersList({ orders, isLoading, error, onCancel }: {
    orders: any[],
    isLoading: boolean,
    error: string | null,
    onCancel: (orderId: number, stockName: string) => void
}) {

    if (error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 shadow-sm mt-6 mb-6">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-sm font-bold text-red-800">예약 내역 조회 실패</p>
                    <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-6">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">종목명</th>
                            <th className="px-4 py-3 text-center font-medium">구분</th>
                            <th className="px-4 py-3 text-right font-medium">총 목표</th>
                            <th className="px-4 py-3 text-right font-medium">일별 목표</th>
                            <th className="px-4 py-3 text-right font-medium">진행 상황</th>
                            <th className="px-4 py-3 text-center font-medium">상태</th>
                            <th className="px-4 py-3 text-right font-medium">등록일</th>
                            <th className="px-4 py-3 text-center font-medium">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {(!orders || orders.length === 0) ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                    등록된 예약 주문이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => {
                                const isBuy = order.action === "BUY";
                                const isAmount = order.order_mode === "AMOUNT";

                                return (
                                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-bold text-foreground">
                                            {order.stock_name}
                                            <span className="text-[10px] text-muted-foreground ml-1 font-mono">{order.stock_code}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {isBuy ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                                    <TrendingUp className="h-3 w-3" /> 매수
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                    <TrendingDown className="h-3 w-3" /> 매도
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            {isAmount
                                                ? `${order.total_amount?.toLocaleString()}원`
                                                : `${order.total_quantity?.toLocaleString()}주`}
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">
                                            {isAmount
                                                ? `${order.daily_amount?.toLocaleString()}원`
                                                : `${order.daily_quantity?.toLocaleString()}주`}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold">
                                                    {isAmount
                                                        ? `${order.executed_amount?.toLocaleString() || 0}원`
                                                        : `${order.executed_quantity?.toLocaleString() || 0}주`}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {(() => {
                                                        const totalDays = isAmount && order.daily_amount > 0
                                                            ? Math.ceil(order.total_amount / order.daily_amount)
                                                            : (order.daily_quantity > 0 ? Math.ceil(order.total_quantity / order.daily_quantity) : 0);

                                                        const executedDays = isAmount && order.daily_amount > 0
                                                            ? Math.floor(order.executed_amount / order.daily_amount)
                                                            : (order.daily_quantity > 0 ? Math.floor(order.executed_quantity / order.daily_quantity) : 0);

                                                        const pct = isAmount && order.total_amount
                                                            ? Math.round((order.executed_amount / order.total_amount) * 100)
                                                            : (order.total_quantity ? Math.round((order.executed_quantity / order.total_quantity) * 100) : 0);

                                                        return `${executedDays}/${totalDays}일 (${pct}%)`;
                                                    })()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${order.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                order.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {order.status === 'ACTIVE' ? '진행중' :
                                                    order.status === 'COMPLETED' ? '완료' : '취소됨'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {order.status === 'ACTIVE' && (
                                                <button
                                                    onClick={() => onCancel(order.id, order.stock_name)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="예약 취소"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
