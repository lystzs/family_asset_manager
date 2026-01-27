"use client";

import { useAccount } from "@/context/AccountContext";
import { api, deleteAccount, updateAccount, fetchUsers, fetchAccounts, User, Account } from "@/services/api";
import { useState, useEffect } from "react";
import { CreditCard, Wallet, Trash2, Edit } from "lucide-react";

export default function AccountsPage() {
    const { refreshAccounts: refreshAllAccounts } = useAccount();

    const [users, setUsers] = useState<User[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | "">("");
    const [accAlias, setAccAlias] = useState("");
    const [accCano, setAccCano] = useState("");
    const [accCode, setAccCode] = useState("01");
    const [accKey, setAccKey] = useState("");
    const [accSecret, setAccSecret] = useState("");
    const [accExpiry, setAccExpiry] = useState("");
    const [isAccLoading, setIsAccLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editAccountId, setEditAccountId] = useState<number | null>(null);

    // Load users on mount
    useEffect(() => {
        const loadUsers = async () => {
            try {
                const data = await fetchUsers();
                setUsers(data);
                if (data.length > 0) {
                    setSelectedUserId(data[0].id);
                }
            } catch (e) {
                console.error("Failed to load users", e);
            }
        };
        loadUsers();
    }, []);

    // Load accounts when user selection changes
    useEffect(() => {
        if (selectedUserId) {
            const loadAccounts = async () => {
                try {
                    const data = await fetchAccounts(selectedUserId as number);
                    setAccounts(data);
                } catch (e) {
                    console.error("Failed to load accounts", e);
                    setAccounts([]);
                }
            };
            loadAccounts();
        }
    }, [selectedUserId]);

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) return;
        setIsAccLoading(true);
        try {
            const payload: any = {
                alias: accAlias,
                cano: accCano,
                acnt_prdt_cd: accCode,
                api_expiry_date: accExpiry
            };

            if (accKey) payload.app_key = accKey;
            if (accSecret) payload.app_secret = accSecret;

            if (isEditMode && editAccountId) {
                await updateAccount(editAccountId, payload);
                alert("계좌가 수정되었습니다.");
            } else {
                await api.post(`/users/${selectedUserId}/accounts`, payload);
                alert("계좌가 등록되었습니다.");
            }

            resetForm();
            // Reload accounts for this user
            const data = await fetchAccounts(selectedUserId as number);
            setAccounts(data);
            // Refresh global context
            await refreshAllAccounts();
        } catch (e) {
            alert("처리 실패");
        } finally {
            setIsAccLoading(false);
        }
    };

    const resetForm = () => {
        setAccAlias("");
        setAccCano("");
        setAccKey("");
        setAccSecret("");
        setAccExpiry("");
        setIsEditMode(false);
        setEditAccountId(null);
    };

    const handleEditClick = (account: any) => {
        setAccAlias(account.alias);
        setAccCano(account.cano);
        setAccCode("01");
        setAccKey(account.app_key || "");
        setAccSecret(account.app_secret || "");
        setAccExpiry(account.api_expiry_date || "");
        setIsEditMode(true);
        setEditAccountId(account.id);
    };

    const handleDeleteAccount = async (id: number, alias: string) => {
        if (confirm(`'${alias}' 계좌를 삭제하시겠습니까?`)) {
            try {
                await deleteAccount(id);
                alert("삭제되었습니다.");
                // Reload accounts
                if (selectedUserId) {
                    const data = await fetchAccounts(selectedUserId as number);
                    setAccounts(data);
                }
                // Refresh global context
                await refreshAllAccounts();
            } catch (e) {
                alert("삭제 실패");
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">계좌 관리</h1>
                <p className="text-muted-foreground mt-1">KIS 투자 계좌를 등록하고 관리합니다.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Account Creation */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">
                            {isEditMode ? "계좌 수정" : "계좌 등록"}
                        </h2>
                    </div>

                    <form onSubmit={handleCreateAccount} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">구성원 선택</label>
                            <select
                                value={selectedUserId}
                                disabled={isEditMode}
                                onChange={(e) => setSelectedUserId(parseInt(e.target.value))}
                                className="w-full rounded-md border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                            >
                                <option value="">선택하세요</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">계좌 별칭</label>
                            <input
                                type="text"
                                value={accAlias}
                                onChange={(e) => setAccAlias(e.target.value)}
                                placeholder="예: 아버지-주식"
                                className="w-full rounded-md border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2 space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">계좌번호 (CANO)</label>
                                <input
                                    type="text"
                                    value={accCano}
                                    onChange={(e) => setAccCano(e.target.value)}
                                    placeholder="8자리"
                                    className="w-full rounded-md border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">코드</label>
                                <input
                                    type="text"
                                    value={accCode}
                                    onChange={(e) => setAccCode(e.target.value)}
                                    placeholder="01"
                                    className="w-full rounded-md border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">App Key</label>
                            <input
                                type="password"
                                value={accKey}
                                onChange={(e) => setAccKey(e.target.value)}
                                autoComplete="new-password"
                                className="w-full rounded-md border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">App Secret</label>
                            <input
                                type="password"
                                value={accSecret}
                                onChange={(e) => setAccSecret(e.target.value)}
                                autoComplete="new-password"
                                className="w-full rounded-md border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">API 만료일</label>
                            <input
                                type="date"
                                value={accExpiry}
                                onChange={(e) => setAccExpiry(e.target.value)}
                                className="w-full rounded-md border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button
                                type="submit"
                                disabled={isAccLoading}
                                className="flex-1 rounded-md bg-purple-600 py-2 font-medium text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {isAccLoading ? "처리 중..." : (isEditMode ? "수정 완료" : "계좌 등록")}
                            </button>
                            {isEditMode && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-md bg-muted px-4 py-2 font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
                                >
                                    취소
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Account List */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-xl font-semibold text-foreground">등록된 계좌</h2>
                    </div>
                    <div className="space-y-3">
                        {selectedUserId && accounts.length > 0 ? accounts.map((a) => (
                            <div key={a.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-white border border-border">
                                        <Wallet className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{a.alias}</p>
                                        <p className="text-xs text-muted-foreground">CANO: {a.cano}</p>
                                        {a.api_expiry_date && (
                                            <p className="text-xs text-red-500 mt-1">만료일: {a.api_expiry_date}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEditClick(a)}
                                        className="p-2 text-muted-foreground hover:text-blue-600 transition-colors"
                                        title="수정"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAccount(a.id, a.alias)}
                                        className="p-2 text-muted-foreground hover:text-red-600 transition-colors"
                                        title="삭제"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-muted-foreground">
                                {users.length > 0 ? "계좌가 없습니다." : "먼저 구성원을 선택/등록 후 계좌를 확인하세요."}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
