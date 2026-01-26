import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/v1';

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
export const scheduleOrder = async (data: any) => {
    const res = await api.post("/trade/schedule/schedule", data);
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
