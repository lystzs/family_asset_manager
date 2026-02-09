"use client";

import BatchMonitoringView from "@/components/BatchMonitoringView";

export default function BatchMonitoringPage() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">배치 모니터링</h1>
                <p className="text-muted-foreground mt-2">
                    배치 작업의 실행 현황과 이력을 모니터링합니다.
                </p>
            </div>

            <BatchMonitoringView />
        </div>
    );
}
