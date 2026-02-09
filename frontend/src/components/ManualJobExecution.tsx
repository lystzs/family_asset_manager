"use client";

import React, { useEffect, useState } from 'react';
import { getBatchJobs, executeBatchJob, BatchJob } from '../services/systemService';
import { Play, Loader2 } from 'lucide-react';

const ManualJobExecution: React.FC = () => {
    const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [executingJobId, setExecutingJobId] = useState<string | null>(null);

    const fetchBatchJobs = async () => {
        try {
            const jobs = await getBatchJobs();
            setBatchJobs(jobs);
        } catch (err) {
            console.error("Failed to load batch jobs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBatchJobs();
    }, []);

    const handleExecuteJob = async (jobId: string, jobName: string) => {
        if (!confirm(`'${jobName}' 작업을 지금 실행하시겠습니까?`)) return;

        setExecutingJobId(jobId);
        try {
            await executeBatchJob(jobId);
            alert(`'${jobName}' 작업이 백그라운드에서 시작되었습니다.`);
        } catch (e) {
            alert(`작업 실행 실패: ${e}`);
        } finally {
            setExecutingJobId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">배치 작업 수동 실행</h2>
            <p className="text-sm text-muted-foreground mb-6">
                스케줄된 시간을 기다리지 않고 즉시 배치 작업을 실행할 수 있습니다.
            </p>

            {batchJobs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                    실행 가능한 배치 작업이 없습니다.
                </p>
            ) : (
                <div className="space-y-3">
                    {batchJobs.map((job) => (
                        <div
                            key={job.id}
                            className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex-1">
                                <h3 className="font-medium text-foreground">{job.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {job.description}
                                </p>
                            </div>

                            <button
                                onClick={() => handleExecuteJob(job.id, job.name)}
                                disabled={executingJobId === job.id}
                                className="ml-4 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {executingJobId === job.id ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>실행 중...</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4" />
                                        <span>즉시 실행</span>
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManualJobExecution;
