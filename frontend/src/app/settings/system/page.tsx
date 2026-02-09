'use client';

import React from 'react';
import ManualJobExecution from '@/components/ManualJobExecution';

export default function SystemSettingsPage() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">배치 수동 실행</h1>
                <p className="text-muted-foreground mt-2">
                    배치 작업을 수동으로 실행할 수 있습니다.
                </p>
            </div>

            <ManualJobExecution />
        </div>
    );
}
