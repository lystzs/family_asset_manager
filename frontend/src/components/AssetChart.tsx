"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface AssetHistory {
    date: string
    total_asset_amount: number
    stock_eval_amount: number
    cash_balance: number
    total_profit_loss: number
}

interface AssetChartProps {
    data: AssetHistory[]
}

export function AssetChart({ data }: AssetChartProps) {
    if (!data || data.length === 0) {
        return <div className="text-center text-muted-foreground py-10">데이터가 없습니다.</div>
    }

    // Format date for display
    const chartData = data.map(item => ({
        ...item,
        formattedDate: new Date(item.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
        formattedTotal: Math.round(item.total_asset_amount / 10000) // 만원 단위
    }))

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{
                        top: 10,
                        right: 0,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="formattedDate"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={12}
                    />
                    <YAxis
                        tickFormatter={(value) => `${value.toLocaleString()}`}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={12}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        formatter={(value: any) => [`${(value * 10000).toLocaleString()}원`, '총 자산']}
                        labelFormatter={(label) => `${label}`}
                    />
                    <Area
                        type="monotone"
                        dataKey="formattedTotal"
                        stroke="#8884d8"
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
