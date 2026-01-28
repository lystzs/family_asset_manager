import TradeLogs from '@/components/TradeLogs';

export default function LogsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">운영 로그</h1>
            <TradeLogs />
        </div>
    );
}
