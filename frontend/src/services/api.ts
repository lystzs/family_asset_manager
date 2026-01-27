import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/v1`
    : 'http://localhost:8000/v1';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface User {
    id: number;
    name: string;
}

export interface Account {
    id: number;
    alias: string;
    user_id: number;
    cano: string;
    acnt_prdt_cd: string;
    hts_id?: string;
    api_expiry_date?: string;
    token_expired_at?: string;
}

export interface AccountWithUser extends Account {
    user_name: string;
}

export interface Stock {
    code: string;
    name: string;
    market: string;
}

export interface StockStats {
    total: number;
    kospi: number;
    kosdaq: number;
}

export const fetchUsers = async () => {
    const res = await api.get<User[]>('/users/');
    return res.data;
};

export const fetchAccounts = async (userId: number) => {
    const res = await api.get<Account[]>(`/users/${userId}/accounts`);
    return res.data;
};

export const fetchAllAccounts = async () => {
    const res = await api.get<AccountWithUser[]>('/accounts/');
    return res.data;
};

export const fetchBalance = async (accountId: number) => {
    const res = await api.get(`/accounts/${accountId}/balance`);
    return res.data;
};

export interface OrderRequest {
    account_id: number;
    ticker: string;
    quantity: number;
    price: number;
    action: "BUY" | "SELL" | "HOLD" | "RESERVE";
    strategy_id?: string;
}

export const placeOrder = async (orderData: OrderRequest) => {
    const res = await api.post('/trade/order', orderData);
    return res.data;
};

export const fetchUnfilledOrders = async (accountId: number) => {
    const res = await api.get(`/trade/orders/unfilled/${accountId}`);
    return res.data;
};

export const fetchExecutedOrders = async (accountId: number) => {
    const res = await api.get(`/trade/orders/executed/${accountId}`);
    return res.data;
};

export const reviseOrder = async (data: { account_id: number, orgn_odno: string, quantity: number, price: number, ord_dvsn: string, all_qty?: boolean }) => {
    const res = await api.post("/trade/order/revise", data);
    return res.data;
};

export const cancelOrder = async (data: { account_id: number, orgn_odno: string, quantity: number, all_qty?: boolean }) => {
    const res = await api.post("/trade/order/cancel", data);
    return res.data;
};

export const subscribeRealtimePrice = async (codes: string[]) => {
    const res = await api.post("/ws/subscribe", { codes });
    return res.data;
};

export const deleteUser = async (userId: number) => {
    const res = await api.delete(`/users/${userId}`);
    return res.data;
};

export const deleteAccount = async (accountId: number) => {
    const res = await api.delete(`/accounts/${accountId}`);
    return res.data;
};

export const updateAccount = async (accountId: number, data: Partial<Account> & { app_key?: string; app_secret?: string }) => {
    const res = await api.put(`/accounts/${accountId}`, data);
    return res.data;
};

export const refreshToken = async (accountId: number) => {
    const res = await api.post(`/accounts/${accountId}/token`);
    return res.data;
};

// Stock Master API
export const fetchAllStocks = async () => {
    const res = await api.get<Stock[]>('/stocks/');
    return res.data;
};

export const searchStocks = async (keyword: string, limit: number = 50) => {
    const res = await api.get<Stock[]>(`/stocks/search?q=${keyword}&limit=${limit}`);
    return res.data;
};

export const fetchStockByCode = async (code: string) => {
    const res = await api.get<Stock>(`/stocks/${code}`);
    return res.data;
};

export const fetchStockStats = async () => {
    const res = await api.get<StockStats>('/stocks/stats');
    return res.data;
};

export const syncStockMaster = async () => {
    const res = await api.post('/stocks/sync');
    return res.data;
};

// Portfolio Management API
export interface TargetPortfolio {
    id: number;
    account_id: number;
    stock_code: string;
    stock_name: string;
    target_percentage: number;
    updated_at: string;
}

// Scheduled Trading
export interface ScheduleOrderParams {
    account_id: number;
    ticker: string;
    stock_name: string;
    action: "BUY" | "SELL";
    total_quantity?: number;
    daily_quantity?: number;
    total_amount?: number;
    daily_amount?: number;
    order_mode: "QUANTITY" | "AMOUNT";
}

export const scheduleOrder = async (data: ScheduleOrderParams) => {
    const res = await api.post("/trade/schedule/schedule", data);
    return res.data;
};

export const fetchScheduledOrders = async (accountId: number) => {
    const res = await api.get(`/trade/schedule/list/${accountId}`);
    return res.data;
};

export const cancelScheduledOrder = async (orderId: number) => {
    const res = await api.delete(`/trade/schedule/${orderId}`);
    return res.data;
};

export interface TradeSuggestion {
    stock_code: string;
    stock_name: string;
    current_qty: number;
    current_price: number;
    current_value: number;
    target_value: number;
    diff_value: number;
    suggested_qty: number;
    action: "BUY" | "SELL" | "HOLD" | "RESERVE";
}

export interface RebalanceAnalysis {
    user_id: number;
    account_id: number;
    total_asset: number;
    current_cash: number;
    items: TradeSuggestion[];
    summary: {
        total_target_pct: number;
    };
}

export const fetchAccountPortfolio = async (accountId: number) => {
    const res = await api.get<TargetPortfolio[]>(`/portfolio/${accountId}`);
    return res.data;
};

export const fetchAssetHistory = async (accountId: number) => {
    const res = await api.get(`/accounts/${accountId}/history`);
    return res.data;
};

export const fetchAllAssetHistory = async () => {
    const res = await api.get('/accounts/history/aggregate');
    return res.data;
};

export const saveTargetPortfolio = async (accountId: number, data: { stock_code: string, stock_name: string, target_percentage: number }) => {
    const res = await api.post<TargetPortfolio>(`/portfolio/${accountId}`, { ...data, account_id: accountId });
    return res.data;
};

export const deleteTargetPortfolio = async (id: number) => {
    const res = await api.delete(`/portfolio/${id}`);
    return res.data;
};

export const analyzeRebalance = async (userId: number, accountId: number) => {
    const res = await api.get<RebalanceAnalysis>(`/portfolio/${userId}/analysis/${accountId}`);
    return res.data;
};

// Batch Jobs
export const fetchBatchJobs = async () => {
    const res = await api.get('/batch/jobs');
    return res.data;
};

export const triggerBatchJob = async (jobId: string) => {
    const res = await api.post(`/batch/exec/${jobId}`);
    return res.data;
};

// WebSocket Hook
import { useRef } from 'react';

export const useWebSocket = (accountId: number, onMessage: (msg: any) => void) => {
    const ws = useRef<WebSocket | null>(null);

    const connect = () => {
        // Close existing
        if (ws.current) ws.current.close();

        const wsBase = API_BASE_URL.replace(/^http/, 'ws');
        const wsUrl = `${wsBase}/ws/orders/${accountId}`;
        // Note: Using dynamic URL based on env config

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log("WS Connected");
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (e) {
                console.error("WS Parse Error", e);
            }
        };

        ws.current.onclose = () => {
            console.log("WS Closed");
            // Optional: Reconnect logic could go here
        };

        ws.current.onerror = (error) => {
            console.error("WS Error", error);
        };
    };

    const disconnect = () => {
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }
    };

    return { connect, disconnect };
};
