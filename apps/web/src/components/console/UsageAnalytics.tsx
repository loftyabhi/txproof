'use client';

import React, { useState, useEffect } from 'react';

interface UsageStats {
    by_endpoint: { endpoint: string; count: number }[];
    by_status: { status: number; count: number }[];
    period: { start: string; end: string };
}

interface RequestLog {
    endpoint: string;
    method: string;
    status: number;
    duration_ms: number;
    created_at: string;
    error?: string;
}

interface UsageAnalyticsProps {
    token: string;
}

export const UsageAnalytics: React.FC<UsageAnalyticsProps> = ({ token }) => {
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [history, setHistory] = useState<RequestLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, historyRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/usage/stats?start_date=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/usage/history?limit=20`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (historyRes.ok) setHistory(await historyRes.json());

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchData();
    }, [token, fetchData]);

    // Simple Bar Chart Component
    const BarChart = ({ data }: { data: { label: string; value: number }[] }) => {
        const max = Math.max(...data.map(d => d.value), 1);
        return (
            <div className="flex items-end gap-2 h-40 pt-4">
                {data.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                            className="w-full bg-blue-500/50 rounded-t-sm group-hover:bg-blue-400 transition-all relative"
                            style={{ height: `${(d.value / max) * 100}%` }}
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                                {d.value} reqs
                            </div>
                        </div>
                        <span className="text-[10px] text-gray-500 truncate w-full text-center" title={d.label}>{d.label}</span>
                    </div>
                ))}
            </div>
        );
    };

    if (loading && !stats) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;

    return (
        <div className="space-y-8">
            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-4">Top Endpoints (30d)</h3>
                    {stats?.by_endpoint.length ? (
                        <BarChart data={stats.by_endpoint.map(e => ({ label: e.endpoint, value: e.count }))} />
                    ) : (
                        <div className="h-40 flex items-center justify-center text-gray-600 text-sm">No data available</div>
                    )}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-4">Response Statuses</h3>
                    <div className="space-y-3">
                        {stats?.by_status.map(s => (
                            <div key={s.status} className="flex items-center gap-3">
                                <div className={`w-12 text-sm font-mono ${s.status >= 500 ? 'text-red-400' : s.status >= 400 ? 'text-yellow-400' : 'text-green-400'}`}>
                                    {s.status}
                                </div>
                                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${s.status >= 500 ? 'bg-red-500' : s.status >= 400 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                        style={{ width: `${(s.count / Math.max(...(stats.by_status.map(x => x.count) || []), 1)) * 100}%` }}
                                    />
                                </div>
                                <div className="text-xs text-gray-400 min-w-[3rem] text-right">{s.count}</div>
                            </div>
                        ))}
                        {(!stats?.by_status.length) && (
                            <div className="h-32 flex items-center justify-center text-gray-600 text-sm">No data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent History Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-semibold text-white">Recent Requests</h3>
                    <button onClick={fetchData} className="text-xs text-blue-400 hover:text-blue-300">Refresh</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-black/20 text-gray-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Time</th>
                                <th className="px-6 py-3 font-medium">Method</th>
                                <th className="px-6 py-3 font-medium">Endpoint</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.length > 0 ? (
                                history.map((req, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                                            {new Date(req.created_at).toLocaleTimeString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${req.method === 'GET' ? 'bg-blue-500/10 text-blue-400' :
                                                    req.method === 'POST' ? 'bg-green-500/10 text-green-400' :
                                                        'bg-gray-500/10 text-gray-400'
                                                }`}>
                                                {req.method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-gray-300 text-xs">
                                            {req.endpoint}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`${req.status >= 500 ? 'text-red-400' :
                                                    req.status >= 400 ? 'text-yellow-400' :
                                                        'text-green-400'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-right font-mono">
                                            {req.duration_ms}ms
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No recent requests found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
