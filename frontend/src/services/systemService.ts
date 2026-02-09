import { api } from './api';

export interface SchedulerJob {
    id: string;
    name: string;
    next_run_time: string | null;
    trigger: string;
    last_run?: string;
    last_status?: "SUCCESS" | "FAILED";
    message?: string;
}

export interface SystemStatus {
    server_time: string;
    app_env: string;
    scheduler_enabled: boolean;
    scheduler_running: boolean;
    active_jobs: SchedulerJob[];
}

export interface BatchJob {
    id: string;
    name: string;
    description: string;
}

export const getSystemStatus = async (): Promise<SystemStatus> => {
    try {
        const response = await api.get<SystemStatus>('/system/status');
        return response.data;
    } catch (error) {
        console.error("Failed to fetch system status:", error);
        throw error;
    }
};

export const getBatchJobs = async (): Promise<BatchJob[]> => {
    try {
        const response = await api.get<BatchJob[]>('/batch/jobs');
        return response.data;
    } catch (error) {
        console.error("Failed to fetch batch jobs:", error);
        return [];
    }
};

export const executeBatchJob = async (jobId: string): Promise<any> => {
    try {
        const response = await api.post(`/batch/exec/${jobId}`);
        return response.data;
    } catch (error) {
        console.error(`Failed to execute job ${jobId}:`, error);
        throw error;
    }
};
