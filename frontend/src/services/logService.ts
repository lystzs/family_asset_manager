import { api } from './api';

export interface TradeLog {
    id: number;
    account_id: number;
    timestamp: string;
    strategy_id: string;
    ticker: string;
    action: string;
    price: number;
    quantity: number;
    status: string;
    message: string;
}

export const fetchTradeLogs = async (skip: number = 0, limit: number = 100) => {
    const res = await api.get<TradeLog[]>(`/logs/trade?skip=${skip}&limit=${limit}`);
    return res.data;
};
