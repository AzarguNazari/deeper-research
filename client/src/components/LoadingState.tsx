import { Layers } from 'lucide-react';

interface LoadingStateProps {
    isDeeperResearch: boolean;
}

export function LoadingState({ isDeeperResearch }: LoadingStateProps) {
    return (
        <div className="flex gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-100">
                <Layers className="w-6 h-6 text-white animate-spin-slow" />
            </div>
            <div className="space-y-4 mt-1 flex-1">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-blue-600 uppercase tracking-widest animate-pulse">
                        {isDeeperResearch ? 'Orchestrating Multi-Agent Research...' : 'Processing...'}
                    </p>
                </div>
                <div className="space-y-2">
                    <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 w-1/3 animate-progress"></div>
                    </div>
                    <div className="h-3 w-3/4 bg-neutral-100 rounded-full"></div>
                </div>
            </div>
        </div>
    );
}
