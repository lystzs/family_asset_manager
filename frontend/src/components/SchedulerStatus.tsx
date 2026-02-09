import React, { useEffect, useState } from 'react';
import { getSystemStatus, getBatchJobs, executeBatchJob, SystemStatus, BatchJob } from '../services/systemService';
import { Play, Loader2 } from 'lucide-react';

const SchedulerStatus: React.FC = () => {
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [executingJobId, setExecutingJobId] = useState<string | null>(null);

    const fetchStatus = async () => {
        try {
            // setLoading(true); // Don't block UI on refresh
            const data = await getSystemStatus();
            setStatus(data);
            setError(null);
        } catch (err) {
            console.error(err);
            // Don't show error on every poll failure if we already have data
            if (!status) setError('Failed to load system status');
        } finally {
            setLoading(false);
        }
    };

    const fetchBatchJobs = async () => {
        try {
            const jobs = await getBatchJobs();
            setBatchJobs(jobs);
        } catch (err) {
            console.error("Failed to load batch jobs", err);
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchStatus(), fetchBatchJobs()]).finally(() => setLoading(false));
        const interval = setInterval(fetchStatus, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const handleExecuteJob = async (jobId: string, jobName: string) => {
        if (!confirm(`'${jobName}' 작업을 지금 실행하시겠습니까?`)) return;

        setExecutingJobId(jobId);
        try {
            await executeBatchJob(jobId);
            alert(`'${jobName}' 작업이 백그라운드에서 시작되었습니다.`);
            setTimeout(fetchStatus, 2000); // Wait a bit then refresh to potentially see 'running' status if captured
        } catch (e) {
            alert(`작업 실행 실패: ${e}`);
        } finally {
            setExecutingJobId(null);
        }
    };

    if (loading && !status) return <div className="p-4 bg-white rounded-lg shadow animate-pulse">Loading System Status...</div>;
    if (error && !status) return <div className="p-4 bg-red-50 text-red-600 rounded-lg shadow">{error}</div>;

    if (!status) return null;

    return (
        <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center justify-between">
                    시스템 상태
                    <span className={`px-3 py-1 text-sm rounded-full ${status.app_env === 'prd' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {status.app_env.toUpperCase()}
                    </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Server Info */}
                    <div className="space-y-3">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">서버 시간</span>
                            <span className="font-mono font-medium">{status.server_time}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">스케줄러 활성화</span>
                            <span className={`font-bold ${status.scheduler_enabled ? 'text-green-600' : 'text-red-600'}`}>
                                {status.scheduler_enabled ? 'ON' : 'OFF'}
                            </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">스케줄러 상태</span>
                            <span className={`font-bold ${status.scheduler_running ? 'text-green-600' : 'text-red-600'}`}>
                                {status.scheduler_running ? 'RUNNING' : 'STOPPED'}
                            </span>
                        </div>
                    </div>

                    {/* Jobs List */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">예약된 작업</h3>
                        {status.active_jobs.length === 0 ? (
                            <p className="text-gray-500 italic">No active jobs scheduled.</p>
                        ) : (
                            <div className="space-y-2">
                                {status.active_jobs.map((job) => (
                                    <div key={job.id} className="bg-gray-50 p-3 rounded border text-sm">
                                        <div className="flex justify-between font-medium text-gray-800">
                                            <div className="flex items-center gap-2">
                                                <span>{job.name || job.id}</span>
                                                {job.last_status && (
                                                    <span title={job.message || ''} className={`px-2 py-0.5 text-xs rounded-full ${job.last_status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {job.last_status === 'SUCCESS' ? '성공' : '실패'}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-blue-600">{job.next_run_time?.split(' ')[1]}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                                            <span>다음: {job.next_run_time || 'N/A'}</span>
                                            {job.last_run && (
                                                <span className="font-medium text-gray-600">
                                                    최근: {job.last_run}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4 text-right">
                    <button
                        onClick={fetchStatus}
                        className="text-sm text-blue-500 hover:text-blue-700 underline"
                    >
                        새로고침
                    </button>
                </div>
            </div>

            {/* Manual Execution Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">수동 작업 실행</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {batchJobs.map((job) => (
                        <div key={job.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <h3 className="font-bold text-gray-800 mb-1">{job.name}</h3>
                            <p className="text-xs text-gray-500 mb-4 h-8 overflow-hidden">{job.description}</p>
                            <button
                                onClick={() => handleExecuteJob(job.id, job.name)}
                                disabled={!!executingJobId}
                                className={`w-full flex items-center justify-center gap-2 py-2 rounded text-sm font-medium transition-colors
                                    ${executingJobId === job.id
                                        ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                                        : executingJobId
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                    }`}
                            >
                                {executingJobId === job.id ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        실행 요청 중...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4 fill-current" />
                                        즉시 실행
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                    {batchJobs.length === 0 && (
                        <div className="col-span-full text-center text-gray-500 py-4">
                            실행 가능한 작업 목록을 불러오는 중...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SchedulerStatus;
