"use client";

import { useEffect, useState } from "react";
import { fetchBatchJobs, triggerBatchJob } from "@/services/api";
import { Play, Settings, AlertCircle, CheckCircle } from "lucide-react";

interface BatchJob {
    id: string;
    name: string;
    description: string;
}

export default function SystemSettingsPage() {
    const [jobs, setJobs] = useState<BatchJob[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [triggeringId, setTriggeringId] = useState<string | null>(null);
    const [result, setResult] = useState<{ id: string; success: boolean; message: string } | null>(null);

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = async () => {
        setIsLoading(true);
        try {
            const data = await fetchBatchJobs();
            setJobs(data);
        } catch (e) {
            console.error("Failed to load jobs", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTrigger = async (jobId: string, jobName: string) => {
        if (!confirm(`'${jobName}' 작업을 수동으로 실행하시겠습니까?`)) return;

        setTriggeringId(jobId);
        setResult(null);
        try {
            const res = await triggerBatchJob(jobId);
            setResult({ id: jobId, success: true, message: "작업이 백그라운드에서 시작되었습니다." });
        } catch (e: any) {
            setResult({ id: jobId, success: false, message: e.response?.data?.detail || "작업 실행에 실패했습니다." });
        } finally {
            setTriggeringId(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">시스템 설정</h1>
                <p className="text-muted-foreground mt-1">시스템 배치 작업 및 기타 설정을 관리합니다.</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                        <Settings className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">배치 작업 수동 실행</h2>
                </div>

                {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
                ) : (
                    <div className="space-y-4">
                        {jobs.map((job) => (
                            <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50 border border-border gap-4">
                                <div className="space-y-1">
                                    <h3 className="font-medium text-foreground flex items-center gap-2">
                                        {job.name}
                                        {result?.id === job.id && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {result.success ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                                {result.success ? "실행됨" : "실패"}
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{job.description}</p>
                                </div>
                                <button
                                    onClick={() => handleTrigger(job.id, job.name)}
                                    disabled={triggeringId === job.id}
                                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white border border-border hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 min-w-[100px] shadow-sm font-medium text-sm text-slate-700"
                                >
                                    {triggeringId === job.id ? (
                                        <div className="h-4 w-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Play className="h-4 w-4 text-primary" />
                                    )}
                                    {triggeringId === job.id ? "요청 중" : "지금 실행"}
                                </button>
                            </div>
                        ))}

                        {jobs.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                실행 가능한 배치 작업이 없습니다.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
