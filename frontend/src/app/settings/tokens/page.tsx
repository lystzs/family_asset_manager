"use client";

import { useEffect, useState } from "react";
import { fetchAllAccounts, refreshToken, AccountWithUser } from "@/services/api";
import { RefreshCcw, CheckCircle, AlertCircle } from "lucide-react";

export default function TokenManagementPage() {
    const [accounts, setAccounts] = useState<AccountWithUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshingId, setRefreshingId] = useState<number | null>(null);

    // Edit State
    const [editingAccount, setEditingAccount] = useState<AccountWithUser | null>(null);
    const [editKey, setEditKey] = useState("");
    const [editSecret, setEditSecret] = useState("");

    const loadAccounts = async () => {
        try {
            const data = await fetchAllAccounts();
            setAccounts(data);
        } catch (e) {
            console.error("Failed to load accounts", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAccounts();
    }, []);

    const handleRefresh = async (accountId: number) => {
        if (!confirm("토큰을 갱신하시겠습니까?")) return;
        setRefreshingId(accountId);
        try {
            await refreshToken(accountId);
            alert("토큰이 갱신되었습니다.");
            loadAccounts();
        } catch (e) {
            alert("토큰 갱신 실패");
        } finally {
            setRefreshingId(null);
        }
    };

    const handleEditClick = (acc: AccountWithUser) => {
        setEditingAccount(acc);
        setEditKey(""); // Don't show existing encrypted key
        setEditSecret(""); // Don't show existing encrypted secret
    };

    const handleSaveKeys = async () => {
        if (!editingAccount) return;
        if (!editKey || !editSecret) {
            alert("Key와 Secret을 모두 입력해주세요.");
            return;
        }

        try {
            const { updateAccount } = await import("@/services/api");
            await updateAccount(editingAccount.id, {
                app_key: editKey,
                app_secret: editSecret
            });
            alert("Key가 수정되었습니다. 갱신을 시도해보세요.");
            setEditingAccount(null);
            loadAccounts();
        } catch (e) {
            alert("수정 실패");
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">토큰 관리</h1>
                <p className="text-muted-foreground mt-1">전체 계좌의 API 토큰 상태를 확인하고 갱신합니다.</p>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 font-medium">구성원</th>
                                <th className="px-6 py-4 font-medium">계좌 별칭</th>
                                <th className="px-6 py-4 font-medium">계좌번호</th>
                                <th className="px-6 py-4 font-medium">토큰 상태</th>
                                <th className="px-6 py-4 font-medium text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        로딩 중...
                                    </td>
                                </tr>
                            ) : accounts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        등록된 계좌가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                accounts.map((acc) => {
                                    const isExpired = !acc.token_expired_at || new Date(acc.token_expired_at) <= new Date();
                                    const expiryDate = acc.token_expired_at ? new Date(acc.token_expired_at).toLocaleString() : "미발급";

                                    return (
                                        <tr key={acc.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-foreground">{acc.user_name}</td>
                                            <td className="px-6 py-4 text-foreground">{acc.alias}</td>
                                            <td className="px-6 py-4 text-muted-foreground bg-muted/20 w-fit rounded font-mono text-xs">{acc.cano}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {isExpired ? (
                                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                                    ) : (
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    )}
                                                    <span className={isExpired ? "text-red-500 font-medium" : "text-green-600"}>
                                                        {isExpired ? "만료됨" : "유효함"}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground ml-1">
                                                        ({expiryDate})
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(acc)}
                                                        className="p-1.5 text-muted-foreground hover:bg-muted rounded transition-colors"
                                                        title="Key 수정"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleRefresh(acc.id)}
                                                        disabled={refreshingId === acc.id}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                                                    >
                                                        <RefreshCcw className={`h-3.5 w-3.5 ${refreshingId === acc.id ? 'animate-spin' : ''}`} />
                                                        {refreshingId === acc.id ? "갱신 중" : "갱신"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg border border-border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">API Key 수정</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {editingAccount.alias} ({editingAccount.cano}) 계좌의<br />
                            실전 투자용 App Key와 Secret을 입력해주세요.
                        </p>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">App Key</label>
                                <input
                                    type="text"
                                    value={editKey}
                                    onChange={(e) => setEditKey(e.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="실전 투자 App Key"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">App Secret</label>
                                <input
                                    type="password"
                                    value={editSecret}
                                    onChange={(e) => setEditSecret(e.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="실전 투자 App Secret"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6 justify-end">
                            <button
                                onClick={() => setEditingAccount(null)}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSaveKeys}
                                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
                            >
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
