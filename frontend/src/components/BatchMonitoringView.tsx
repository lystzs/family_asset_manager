"use client";

import React, { useEffect, useState } from 'react';
import { getSystemStatus, SystemStatus } from '../services/systemService';
import { Clock, Activity } from 'lucide-react';

const BatchMonitoringView: React.FC = () => {
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchStatus = async () => {
        try {
            const data = await getSystemStatus();
            setStatus(data);
        } catch (err) {
            console.error("Failed to load system status", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 10000); // 10초마다 새로고침
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!status) {
        return (
            <div className="p-6 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-destructive">시스템 상태를 불러올 수 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 시스템 상태 */}
            <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">시스템 상태</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 서버 시간 */}
                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">서버 시간</p>
                            <p className="font-medium">{status.server_time}</p>
                        </div>
                    </div>

                    {/* 애완당 작업 */}
                    <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">애완당 작업</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.app_env === 'prd' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200' : 'bg-blue-100 text-blue-800'
                                }`}>
                                {status.app_env === 'prd' ? 'PRD' : status.app_env.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* 스케줄러 상태 */}
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground">스케줄러 활성화</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.scheduler_enabled ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {status.scheduler_enabled ? 'ON' : 'OFF'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground">스케줄러 상태</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.scheduler_running ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {status.scheduler_running ? 'RUNNING' : 'STOPPED'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 작업 목록 */}
            <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">스케줄 작업 목록</h2>

                {status.active_jobs && status.active_jobs.length > 0 ? (
                    <div className="space-y-3">
                        {status.active_jobs.map((job) => (
                            <div
                                key={job.id}
                                className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex-1">
                                    <p className="font-medium">{job.id}</p>
                                    {job.last_run && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            마지막: {job.last_run}
                                        </p>
                                    )}
                                </div>

                                {job.next_run_time && (
                                    <div className="text-right">
                                        <p className="text-sm text-primary font-medium">
                                            {job.next_run_time.split(' ')[1]}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            다음: {job.next_run_time.split(' ')[0]}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">등록된 작업이 없습니다.</p>
                )}
            </div>

            {/* 새로고침 안내 */}
            <div className="text-center">
                <p className="text-xs text-muted-foreground">
                    화면은 10초마다 자동으로 새로고침됩니다.
                </p>
            </div>
        </div>
    );
};

export default BatchMonitoringView;
