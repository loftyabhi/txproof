
export const DashboardLoader = () => (
    <div className="animate-pulse space-y-6">
        <div className="flex justify-between items-center">
            <div className="h-8 w-48 bg-white/10 rounded"></div>
            <div className="h-8 w-24 bg-white/10 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/10"></div>
            ))}
        </div>
        <div className="h-96 bg-white/5 rounded-xl border border-white/10"></div>
    </div>
);
