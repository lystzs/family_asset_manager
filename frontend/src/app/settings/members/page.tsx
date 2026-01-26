"use client";

import { useAccount } from "@/context/AccountContext";
import { api, deleteUser, fetchUsers, User } from "@/services/api";
import { useState, useEffect } from "react";
import { UserPlus, Trash2 } from "lucide-react";

export default function MembersPage() {
    const { refreshAccounts } = useAccount();

    const [users, setUsers] = useState<User[]>([]);
    const [userName, setUserName] = useState("");
    const [isUserLoading, setIsUserLoading] = useState(false);

    // Load users on mount
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await fetchUsers();
            setUsers(data);
        } catch (e) {
            console.error("Failed to load users", e);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userName) return;
        setIsUserLoading(true);
        try {
            await api.post("/users/", { name: userName });
            alert("구성원이 등록되었습니다.");
            setUserName("");
            await loadUsers();
            await refreshAccounts(); // Refresh global context
        } catch (e) {
            alert("구성원 등록 실패");
        } finally {
            setIsUserLoading(false);
        }
    };

    const handleDeleteUser = async (id: number, name: string) => {
        if (confirm(`'${name}' 구성원을 삭제하시겠습니까?\n연결된 모든 계좌도 함께 삭제됩니다.`)) {
            try {
                await deleteUser(id);
                alert("삭제되었습니다.");
                await loadUsers();
                await refreshAccounts(); // Refresh global context
            } catch (e) {
                alert("삭제 실패");
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">구성원 관리</h1>
                <p className="text-muted-foreground mt-1">가족 구성원을 등록하고 관리합니다.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* User Creation */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm h-fit">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                            <UserPlus className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">구성원 등록</h2>
                    </div>

                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">이름</label>
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="예: 아버지"
                                className="w-full rounded-md border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isUserLoading}
                            className="w-full rounded-md bg-primary py-2 font-medium text-primary-foreground hover:opacity-90 transition-colors disabled:opacity-50"
                        >
                            {isUserLoading ? "등록 중..." : "구성원 추가"}
                        </button>
                    </form>
                </div>

                {/* User List */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-xl font-semibold text-foreground">등록된 구성원</h2>
                    </div>

                    <div className="space-y-3">
                        {users && users.length > 0 ? users.map((u) => (
                            <div key={u.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                        {u.name[0]}
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{u.name}</p>
                                        <p className="text-xs text-muted-foreground">ID: {u.id}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteUser(u.id, u.name)}
                                    className="p-2 text-muted-foreground hover:text-red-600 transition-colors"
                                    title="삭제"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-muted-foreground">등록된 구성원이 없습니다.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
