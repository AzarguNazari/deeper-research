import { Brain } from 'lucide-react';

interface ChatHeaderProps {
    onNewChat: () => void;
}

export function ChatHeader({ onNewChat }: ChatHeaderProps) {
    return (
        <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-neutral-100 z-10 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-100">
                    <Brain className="text-white w-5 h-5" />
                </div>
                <span className="font-outfit font-bold text-lg tracking-tight">Deeper Research</span>
            </div>
            <button
                onClick={onNewChat}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
            >
                New Chat
            </button>
        </header>
    );
}
