"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchAllAccounts, AccountWithUser } from "@/services/api";

interface AccountContextType {
    selectedAccount: AccountWithUser | null;
    accounts: AccountWithUser[];
    isLoading: boolean;
    refreshAccounts: () => Promise<void>;
    selectAccount: (accountId: number | null) => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: React.ReactNode }) {
    const [selectedAccount, setSelectedAccount] = useState<AccountWithUser | null>(null);
    const [accounts, setAccounts] = useState<AccountWithUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshAccounts = useCallback(async () => {
        try {
            const data = await fetchAllAccounts();
            setAccounts(data);
            // Auto-select first account if none selected
            if (data.length > 0) {
                setSelectedAccount((prev) => prev || data[0]);
            }
        } catch (e) {
            console.error("Failed to load accounts", e);
            setAccounts([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load all accounts on mount
    useEffect(() => {
        refreshAccounts();
    }, [refreshAccounts]);

    const selectAccount = useCallback((accountId: number | null) => {
        if (accountId === null) {
            // "전체" 선택
            setSelectedAccount(null);
        } else {
            const acc = accounts.find((a) => a.id === accountId) || null;
            setSelectedAccount(acc);
        }
    }, [accounts]);

    return (
        <AccountContext.Provider
            value={{
                selectedAccount,
                accounts,
                isLoading,
                refreshAccounts,
                selectAccount,
            }}
        >
            {children}
        </AccountContext.Provider>
    );
}

export function useAccount() {
    const context = useContext(AccountContext);
    if (context === undefined) {
        throw new Error("useAccount must be used within an AccountProvider");
    }
    return context;
}
