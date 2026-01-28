"use client";

import { useEffect, useState } from "react";
import { fetchTradeLogs, TradeLog } from "@/services/logService";
import { AlertCircle, FileText, RefreshCcw } from "lucide-react";

export default function TradeLogs() {
    const [logs, setLogs] = useState<TradeLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadLogs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchTradeLogs();
            setLogs(data);
        } catch (e: any) {
            setError(e.message || "Failed to load logs");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    if (error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 shadow-sm">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-sm font-bold text-red-800">로그 조회 실패</p>
                    <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    매매 일지
                </h2>
                <button
                    onClick={loadLogs}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                    disabled={isLoading}
                >
                    <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                {/* Mobile View */}
                <div className="md:hidden divide-y divide-border">
                    {logs.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            기록된 로그가 없습니다.
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-0.5">
                                        <div className="font-bold text-sm">{log.ticker || "-"}</div>
                                        <div className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {log.status}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className={log.action === 'BUY' ? 'text-red-500 font-bold' : 'text-blue-500 font-bold'}>
                                        {log.action}
                                    </span>
                                    <span>{log.quantity}주 @ {log.price.toLocaleString()}원</span>
                                </div>
                                <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                                    {log.message}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">시간</th>
                                <th className="px-4 py-3 text-center font-medium">상태</th>
                                <th className="px-4 py-3 text-center font-medium">구분</th>
                                <th className="px-4 py-3 text-left font-medium">종목</th>
                                <th className="px-4 py-3 text-right font-medium">수량</th>
                                <th className="px-4 py-3 text-right font-medium">가격</th>
                                <th className="px-4 py-3 text-left font-medium">메시지</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                        기록된 로그가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                                            {formatDate(log.timestamp)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-3 text-center font-bold ${log.action === 'BUY' ? 'text-red-500' :
                                                log.action === 'SELL' ? 'text-blue-500' : 'text-gray-500'
                                            }`}>
                                            {log.action}
                                        </td>
                                        <td className="px-4 py-3 font-medium">{log.ticker}</td>
                                        <td className="px-4 py-3 text-right font-mono">{log.quantity.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-mono">{log.price.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate" title={log.message}>
                                            {log.message}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
